# Project Implementation Guide: Writing Better Requirement Documents for AI

A comprehensive reference for building React frontends and Django + FastAPI backends with AI assistance. Based on the real patterns and lessons learned from the Goals & Vocabulary Management System.

---

## Table of Contents

- [Part 1: React Frontend — Implementation Order](#part-1-react-frontend--implementation-order)
- [Part 2: Django + FastAPI Backend — Implementation Order](#part-2-django--fastapi-backend--implementation-order)
- [Part 3: The Critical Async Pattern (Django + FastAPI)](#part-3-the-critical-async-pattern-django--fastapi)
- [Part 4: AI Prompt Templates](#part-4-ai-prompt-templates)
- [Part 5: Common Pitfalls & Reminders](#part-5-common-pitfalls--reminders)

---

## Part 1: React Frontend — Implementation Order

**Prerequisite:** Backend API and request/response contracts are ready.

### Phase 1 — Project Scaffolding

**Order:**

1. Initialize project: `npm create vite@latest -- --template react-ts`
2. Install core dependencies: `react-router-dom`, `axios`, `tailwindcss`, `clsx`, `lucide-react`
3. Configure Tailwind CSS (`tailwind.config.js`, `postcss.config.js`, `index.css`)
4. Configure Vite dev server proxy and port (`vite.config.ts`)
5. Configure TypeScript (`tsconfig.json`, `tsconfig.node.json`)

**Example prompt for AI:**

> "Initialize a Vite + React + TypeScript project. Install react-router-dom, axios, tailwindcss, clsx, lucide-react. Configure Tailwind with a dark theme color palette (provide palette). Set dev server port to 3000 with API proxy to http://localhost:8001."

**Example `vite.config.ts`:**

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8001',
        changeOrigin: true,
      }
    }
  }
})
```

---

### Phase 2 — Type Definitions (`types/`)

**This is foundational** — everything else depends on correct types. `types/index.ts` is the single source of truth.

**Order:**

1. Define all TypeScript interfaces matching backend API response/request contracts
2. Group by domain: Auth, Goal, Task, Word, Tag
3. Include list response wrappers and pagination params

**Example prompt for AI:**

> "Here are the backend API response schemas (paste Pydantic models or Swagger JSON). Create TypeScript interfaces in `src/types/index.ts` that match these contracts exactly. Group by domain: Auth, Goal, Task, Word, Tag. Include list response wrappers and pagination params."

**Key considerations:**

- Backend field names must match **exactly** (e.g. `created_time` vs `created_at`, `creator_id` vs `user_id`)
- Nullable fields → `string | null`, optional request fields → `field?: type`
- Enum values must match backend choices (e.g. `'not_started' | 'in_progress' | 'completed'`)

**Real example from this project:**

```typescript
// ==================== Goal Types ====================
export interface Goal {
  id: number;
  title: string;
  description: string | null;    // nullable → string | null
  notes: string | null;
  status: 'not_started' | 'in_progress' | 'completed' | 'on_hold';  // match backend choices
  priority: 'low' | 'medium' | 'high';
  urgency: 'low' | 'medium' | 'high';
  creator_id: number;
  created_time: string;           // backend uses created_time, not created_at
  tags: string[];                 // API returns tag names, not IDs
}

export interface GoalCreate {
  title: string;
  description?: string;           // optional in creation
  notes?: string;
  status?: string;
  priority?: string;
  urgency?: string;
  tags?: number[];                // create/update uses tag IDs, not names
}

export interface GoalListResponse {
  goals: Goal[];
  total: number;
  page: number;
  size: number;
}

// Reusable pagination params
export interface PaginationParams {
  skip?: number;
  limit?: number;
}
```

---

### Phase 3 — API Service Layer (`services/`)

**Order:**

1. `api.ts` — Axios instance, token management, request/response interceptors
2. `auth.ts` — login, register, logout, getCurrentUser, refreshToken
3. Business domain services: `words.ts`, `goals.ts`, `tasks.ts`, `tags.ts`
4. `index.ts` — barrel export

**Example prompt for AI:**

> "Create an Axios service layer.
> - `api.ts`: base URL http://localhost:8001, auto-attach Bearer token from localStorage, implement 401 interceptor with refresh token queue (reference backend's POST /api/auth/refresh, request body: {refresh_token}).
> - Login endpoint uses `application/x-www-form-urlencoded` (OAuth2 form).
> - Create service files for each domain with CRUD methods matching these endpoints: [list endpoints]."

**Critical details for `api.ts`:**

```typescript
// Token refresh interceptor — must queue concurrent 401 requests
let isRefreshing = false;
let failedQueue: Array<{ resolve: Function; reject: Function }> = [];

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config;

    // CRITICAL: Skip token refresh for auth endpoints to avoid infinite loops
    const isAuthEndpoint = originalRequest.url?.includes('/api/auth/token') ||
                           originalRequest.url?.includes('/api/auth/register') ||
                           originalRequest.url?.includes('/api/auth/refresh');

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      // ... refresh logic with queue
    }
    return Promise.reject(error);
  }
);
```

**Critical: Login uses URLSearchParams, NOT JSON:**

```typescript
// CORRECT — FastAPI's OAuth2PasswordRequestForm expects form data
const formData = new URLSearchParams();
formData.append('username', username);
formData.append('password', password);

const response = await api.post<Token>('/api/auth/token', formData, {
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
});

// WRONG — This will fail with FastAPI's OAuth2PasswordRequestForm
// const response = await api.post('/api/auth/token', { username, password });
```

**Critical: File uploads need multipart/form-data:**

```typescript
uploadMedia: async (wordId: number, file: File) => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await api.post(`/api/words/${wordId}/media`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
},
```

**Domain service pattern (consistent for all resources):**

```typescript
export const goalsService = {
  getAll: async (params?: PaginationParams & {
    status?: string;
    priority?: string;
    tag_id?: number;
  }): Promise<GoalListResponse> => {
    const response = await api.get<GoalListResponse>('/api/goals/', { params });
    return response.data;
  },

  getById: async (id: number): Promise<Goal> => {
    const response = await api.get<Goal>(`/api/goals/${id}`);
    return response.data;
  },

  create: async (data: GoalCreate): Promise<Goal> => {
    const response = await api.post<Goal>('/api/goals/', data);
    return response.data;
  },

  update: async (id: number, data: GoalUpdate): Promise<Goal> => {
    const response = await api.put<Goal>(`/api/goals/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/api/goals/${id}`);
  },
};
```

---

### Phase 4 — Auth Context (`contexts/`)

**Order:**

1. `AuthContext.tsx` — AuthProvider wrapping the entire app

**Example prompt for AI:**

> "Create AuthContext with: user state, isAuthenticated, isLoading, login/register/logout/refreshUser methods. On mount, check localStorage for tokens and call GET /api/auth/me to restore session. Wrap login to call POST /api/auth/token then GET /api/auth/me. Wrap logout to call POST /api/auth/logout and clear tokens."

**Key considerations:**

- `isLoading` state is **critical** — prevents flash of login page on page refresh
- `useCallback` for all context methods to prevent unnecessary re-renders
- On mount: check if tokens exist in localStorage → if yes, call `/api/auth/me` to validate

**Pattern:**

```typescript
const AuthProvider: React.FC = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);  // starts true!

  useEffect(() => {
    const initAuth = async () => {
      const tokens = tokenManager.getTokens();
      if (tokens) {
        try {
          const currentUser = await authService.getCurrentUser();
          setUser(currentUser);
        } catch {
          tokenManager.clearTokens(); // token invalid, clear it
        }
      }
      setIsLoading(false);  // only set false AFTER check completes
    };
    initAuth();
  }, []);

  // ... login, logout, register (all wrapped in useCallback)
};
```

---

### Phase 5 — Routing and Layout (`App.tsx`, `layouts/`)

**Order:**

1. `main.tsx` — `BrowserRouter` > `AuthProvider` > `App`
2. `App.tsx` — Route definitions with ProtectedRoute/PublicRoute wrappers
3. `DashboardLayout.tsx` — Sidebar nav + header + `<Outlet />`

**Example prompt for AI:**

> "Create routing: public routes (login, register) redirect to dashboard if authenticated. Protected routes redirect to login if not authenticated. Dashboard layout with left sidebar navigation (sections: Vocabulary [Words, Word Tags], Goals & Tasks [Goals, Tasks, Goal Tags]), top header with user dropdown menu and logout. Use React Router v6 nested routes with Outlet."

**Key considerations:**

- Use `<Navigate replace />` to avoid back-button loops
- `ProtectedRoute` must wait for `isLoading` to be false before redirecting
- Add React Router v7 future flags to suppress warnings:

```tsx
<BrowserRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
```

**Nesting structure:**

```tsx
<Routes>
  <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
  <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />

  <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
    <Route index element={<Navigate to="words" replace />} />
    <Route path="words" element={<WordsPage />} />
    <Route path="words/:id" element={<WordDetailPage />} />
    <Route path="goals" element={<GoalsPage />} />
    <Route path="tasks" element={<TasksPage />} />
    {/* ... more routes */}
  </Route>

  <Route path="*" element={<Navigate to="/dashboard/words" replace />} />
</Routes>
```

---

### Phase 6 — Reusable Components (`components/`)

**Order:**

1. `Modal.tsx` — Generic modal (escape key, backdrop, body scroll lock, multiple sizes)
2. `ConfirmDialog.tsx` — Extends Modal for delete confirmations
3. `EmptyState.tsx` — Empty list placeholder with optional CTA button
4. `LoadingSpinner.tsx` — Loading indicator
5. `Pagination.tsx` — Reusable page navigation (first/prev/pages/next/last)

**Example prompt for AI:**

> "Create these reusable components: Modal (with sizes sm/md/lg/xl/2xl/4xl, escape to close, backdrop, body scroll lock), ConfirmDialog (danger action modal with cancel/confirm buttons), EmptyState (icon + title + description + optional CTA), LoadingSpinner, Pagination (first/prev/page numbers with ellipsis/next/last, showing 'X to Y of Z results')."

---

### Phase 7 — Page Components (`pages/`)

**Recommended implementation order:**

1. `LoginPage.tsx` + `RegisterPage.tsx` — Auth flow first (test end-to-end)
2. `WordsPage.tsx` — First list page with CRUD modal, search, tag filter, pagination
3. `WordDetailPage.tsx` — Detail page with media upload/preview/download/delete
4. `GoalsPage.tsx` — List with status/priority/tag filters + CRUD
5. `TasksPage.tsx` — List with status/priority/goal/tag filters + CRUD
6. `WordTagsPage.tsx` + `GoalTagsPage.tsx` — Tag CRUD

**Example prompt for a list page:**

> "Create WordsPage with:
> 1. State: items, tags, isLoading, search, tagFilter, pagination (currentPage, totalItems, totalPages), selectedItem, isFormOpen, isDeleteOpen
> 2. Fetch data with useCallback, pass search/tag_id/skip/limit params
> 3. Debounced search (300ms) resets to page 1
> 4. Tag filter dropdown resets to page 1
> 5. CRUD via Modal form with tag toggle buttons
> 6. Delete via ConfirmDialog
> 7. Pagination component at bottom
> Use the service layer, NOT direct axios calls."

**Key state management pattern for list pages:**

```tsx
// 1. Fetch function — wrapped in useCallback with all filter dependencies
const fetchWords = useCallback(async (page: number = currentPage) => {
  setIsLoading(true);
  try {
    const skip = (page - 1) * PAGE_SIZE;
    const response = await wordsService.getAll({
      search: search || undefined,
      tag_id: tagFilter ? parseInt(tagFilter) : undefined,
      skip,
      limit: PAGE_SIZE,
    });
    setWords(response.words);
    setTotalItems(response.total);
    setTotalPages(Math.ceil(response.total / PAGE_SIZE));
  } catch (err) { console.error(err); }
  finally { setIsLoading(false); }
}, [search, tagFilter, currentPage]);

// 2. Separate useEffects for different triggers
useEffect(() => { fetchWords(currentPage); }, [currentPage, fetchWords]);

// 3. Debounced search — resets to page 1
useEffect(() => {
  const timer = setTimeout(() => { setCurrentPage(1); fetchWords(1); }, 300);
  return () => clearTimeout(timer);
}, [search]);

// 4. Filter change — resets to page 1
useEffect(() => { setCurrentPage(1); fetchWords(1); }, [tagFilter]);
```

**Tag ID vs Tag Name — the common gotcha:**

```tsx
// API RETURNS tag names (strings) in list responses
// word.tags = ["vocabulary", "grammar"]

// API EXPECTS tag IDs (numbers) in create/update requests
// { tags: [1, 5, 12] }

// Converting names to IDs for the edit form:
const openEditForm = (word: Word) => {
  const tagIds = tags.filter(t => word.tags.includes(t.name)).map(t => t.id);
  setFormData({ ...word, tags: tagIds });
};
```

**Action buttons inside clickable cards — use stopPropagation:**

```tsx
<div className="card cursor-pointer" onClick={() => viewDetail(item)}>
  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
    <button onClick={() => openEditForm(item)}>Edit</button>
    <button onClick={() => openDeleteDialog(item)}>Delete</button>
  </div>
</div>
```

---

### Phase 8 — Polish and Edge Cases

- CORS configuration on backend if not using Vite proxy
- Error messages for login failures (401 → "Username or password is incorrect")
- Upload success/error feedback with auto-dismiss (setTimeout + state)
- File download via Blob (not just `window.open`) for proper filename preservation
- Responsive design: mobile sidebar toggle, responsive grid layouts

**File download pattern:**

```typescript
const handleDownload = async (media: MediaFileInfo) => {
  try {
    const response = await fetch(fullUrl);
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = media.filename || 'download';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch {
    window.open(fullUrl, '_blank'); // fallback
  }
};
```

---

## Part 2: Django + FastAPI Backend — Implementation Order

### Phase 1 — Django Foundation

**Order:**

1. Django project (`django-admin startproject root_directory .`)
2. Django apps:
   - `core` — Custom User model (extend AbstractUser)
   - `goal_app` — Goal, Task, Tag models
   - `main_app` — EnglishWord, Tag, EnglishWordMedia models
3. Models with relationships (FK, M2M, FileField)
4. Serializers (DRF serializers for user registration)
5. Database configuration (MySQL) and migrations
6. Django settings: JWT config, CORS, media files, logging, cache

**Example prompt for AI:**

> "Create Django models for:
> - User (extend AbstractUser with position CharField, age PositiveIntegerField)
> - Goal (title, description, notes, status [choices], priority [choices], urgency, creator FK, tags M2M)
> - Task (name, description, goal FK nullable, creator FK, tags M2M, same status/priority/urgency choices)
> - EnglishWord (title, explanation, notes, creator FK, tags M2M)
> - EnglishWordMedia (word FK, file FileField with extension validation)
>
> Each domain has its own Tag model with `unique_together = ['name', 'creator']`.
> Use `related_name` to avoid clashes (e.g. `'goal_app_tags'`, `'main_app_tags'`)."

**Key considerations:**

- Custom User model must be set **before first migration**: `AUTH_USER_MODEL = 'core.User'`
- Use `settings.AUTH_USER_MODEL` for FK references, not `User` directly
- Set unique `related_name` for FK/M2M to avoid reverse accessor clashes between apps
- Add `blank=True, null=True` for optional fields at model level
- Add `allow_blank=True` for optional CharFields at **serializer** level (DRF is stricter than Django)

### Phase 2 — FastAPI Application Layer

**Order:**

1. `api/main.py` — FastAPI app, Django setup, CORS middleware, route mounting, static files
2. `api/auth.py` — JWT token creation/verification/blacklisting, user authentication, dependency injection
3. `api/goals.py` — Goal CRUD endpoints
4. `api/tasks.py` — Task CRUD endpoints
5. `api/words.py` — Word CRUD + media upload/delete
6. `api/tags.py` — Tag CRUD (unified for both goals and words)

**Critical: Django must be initialized before FastAPI imports models:**

```python
# api/main.py — MUST be at the top, before any model imports
import os, django, sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.append(str(BASE_DIR))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'root_directory.settings')
django.setup()  # <-- MUST happen before importing any Django models

from fastapi import FastAPI
# ... now safe to import routes that use Django models
```

---

## Part 3: The Critical Async Pattern (Django + FastAPI)

**This is the most important technical concept in the backend.** FastAPI runs async, Django ORM is sync. You must bridge this correctly.

### The Three Rules

```
Rule 1: Create sync functions that encapsulate COMPLETE ORM operations
Rule 2: Use sync_to_async to call sync functions from async context
Rule 3: NEVER chain QuerySet evaluation methods across async boundaries
```

### Pattern Template

Here is the exact pattern used in this codebase, distilled into a reusable template:

```python
from asgiref.sync import sync_to_async

# ========== Step 1: Sync function — all ORM logic in one place ==========

def sync_get_items(queryset, skip: int, limit: int):
    """Sync function: complete ORM operation in a single function"""
    total = queryset.count()                                              # ORM call
    items = list(queryset.order_by('-created_time')[skip:skip + limit])   # ORM call
    return items, total

def sync_create_item(title, creator):
    """Sync function: creation with related objects"""
    from myapp.models import Item
    item = Item.objects.create(title=title, creator=creator)
    return item

def sync_check_exists(title, creator, exclude_id=None):
    """Sync function: existence check"""
    from myapp.models import Item
    qs = Item.objects.filter(title=title, creator=creator)
    if exclude_id:
        qs = qs.exclude(id=exclude_id)
    return qs.exists()

# ========== Step 2: Async wrapper — bridge to FastAPI ==========

async def async_get_items(queryset, skip, limit):
    return await sync_to_async(sync_get_items)(queryset, skip, limit)

# ========== Step 3: FastAPI endpoint — pure async ==========

@router.get("/")
async def list_items(
    skip: int = Query(0),
    limit: int = Query(100),
    status: Optional[str] = Query(None),
    tag_id: Optional[int] = Query(None),
    current_user: User = Depends(get_current_active_user)
):
    from myapp.models import Item
    queryset = Item.objects.filter(creator=current_user)

    # Filter building is OK — lazy, no DB hit yet
    if status:
        queryset = queryset.filter(status=status)
    if tag_id:
        queryset = queryset.filter(tags__id=tag_id)
    queryset = queryset.select_related('creator').prefetch_related('tags')

    # Evaluate — MUST go through sync_to_async
    items, total = await async_get_items(queryset, skip, limit)

    # Convert to Pydantic — related field access ALSO needs sync_to_async
    responses = []
    for item in items:
        tags = await sync_to_async(list)(item.tags.all().values_list('name', flat=True))
        responses.append(ItemResponse(id=item.id, title=item.title, tags=tags))

    return {"items": responses, "total": total}
```

### What Goes WRONG (Anti-patterns)

```python
# BAD: Evaluating QuerySet in async context without wrapper
async def list_items():
    items = Item.objects.filter(creator=user)  # Lazy — OK
    count = items.count()  # SYNC ORM call in ASYNC context — CRASH/HANG

# BAD: Accessing related fields without sync_to_async
async def get_item_response(item):
    tag_names = list(item.tags.all())  # SYNC ORM call in ASYNC context — CRASH

# BAD (fragile): Multiple separate sync_to_async calls for one logical operation
async def create_item(data):
    item = await sync_to_async(Item.objects.create)(...)       # Call 1
    tags = await sync_to_async(list)(Tag.objects.filter(...))  # Call 2
    await sync_to_async(item.tags.set)(tags)                   # Call 3
    # This works but is fragile. Better to wrap in ONE sync function.
```

### What is OK (Lazy QuerySet Building)

```python
# OK: Building QuerySets is lazy (no DB hit), so no async wrapper needed
queryset = Item.objects.filter(creator=user)
if status:
    queryset = queryset.filter(status=status)
if tag_id:
    queryset = queryset.filter(tags__id=tag_id)
queryset = queryset.select_related('creator').prefetch_related('tags')

# Only EVALUATE when you call count(), list(), get(), save(), delete() — wrap THOSE
```

### File Upload Pattern

```python
from django.core.files.base import ContentFile

# Sync function for file operations (Django file storage is sync)
def sync_create_media_file(word, filename, file_content):
    from main_app.models import EnglishWordMedia
    media = EnglishWordMedia(word=word)
    media.file.save(filename, ContentFile(file_content))
    media.save()
    return media

# Async endpoint
@router.post("/{word_id}/media")
async def upload_media(word_id: int, file: UploadFile = File(...)):
    # FastAPI reads file async
    file_content = await file.read()
    # Django saves file sync — wrapped
    media = await sync_to_async(sync_create_media_file)(word, file.filename, file_content)
    return MediaFileResponse(id=media.id, file_url=media.file.url, uploaded_at=media.uploaded_at)
```

### JWT Authentication Pattern

```python
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

security = HTTPBearer()

# Dependency injection chain:
# get_current_user (decode JWT) → get_current_active_user (check is_active) → endpoint

async def get_current_user(token: str = Depends(security)) -> User:
    """Decode JWT and return user. Uses sync_to_async for DB lookup."""
    payload = jwt.decode(token.credentials, SECRET_KEY, algorithms=[ALGORITHM])
    user_id = payload.get("user_id")
    user = await sync_to_async(sync_get_user_by_id)(user_id)  # sync wrapper
    if user is None:
        raise HTTPException(status_code=401)
    return user

async def get_current_active_user(current_user = Depends(get_current_user)):
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="User inactive")
    return current_user

# All endpoints use:
@router.get("/")
async def list_items(current_user: User = Depends(get_current_active_user)):
    # current_user is guaranteed to be authenticated and active
    queryset = Item.objects.filter(creator=current_user)
    ...
```

### TYPE_CHECKING Pattern for Django Models

```python
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from django.contrib.auth.models import User  # IDE type hints
else:
    from django.contrib.auth import get_user_model
    User = get_user_model()  # Runtime: gets actual custom User model
```

---

## Part 4: AI Prompt Templates

### Template A: Adding a New CRUD Resource

**Backend prompt:**

> "Add a new resource `[ResourceName]` to the FastAPI backend.
>
> Django model fields: [list fields with types, choices, relationships].
>
> Follow this async pattern:
> 1. Create sync helper functions for all ORM operations (get_items, create_item, update_item, check_exists)
> 2. Wrap with sync_to_async for async callers
> 3. QuerySet building (filter, select_related, prefetch_related) stays in the endpoint (lazy, no DB hit)
> 4. QuerySet evaluation (count, list, get, save, delete) MUST go through sync_to_async
> 5. Related field access (tags.all(), goal.title) in response conversion MUST use sync_to_async
>
> Pydantic models: Base, Create, Update, Response, ListResponse.
> Endpoints: GET / (list with pagination skip/limit and filters), GET /{id}, POST /, PUT /{id}, DELETE /{id}.
> All endpoints require `current_user = Depends(get_current_active_user)` and filter by creator."

**Frontend prompt:**

> "Add `[ResourceName]` to the frontend:
> 1. Add TypeScript types to `types/index.ts` matching these Pydantic response models: [paste]
> 2. Add service in `services/[resource].ts` with getAll(params), getById(id), create(data), update(id, data), delete(id)
> 3. Add list page `pages/[Resource]Page.tsx` with: search, tag filter dropdown, pagination, CRUD via Modal, delete via ConfirmDialog
> 4. Add route in App.tsx under dashboard
> 5. Add nav item in DashboardLayout.tsx
> Follow the same pattern as `WordsPage.tsx`."

### Template B: Adding a Filter to an Existing List

**Backend prompt:**

> "Add `tag_id: Optional[int] = Query(None)` parameter to `GET /api/[resource]/`. If provided, filter with `queryset.filter(tags__id=tag_id)`. This is a lazy QuerySet filter, no sync_to_async needed."

**Frontend prompt:**

> "Add tag filter dropdown to `[Resource]Page`. State: `tagFilter` string. Fetch tags from `tagsService.getAll({tag_type: '[type]'})`. Pass `tag_id: tagFilter ? parseInt(tagFilter) : undefined` to service call. Reset to page 1 when tagFilter changes."

### Template C: Adding a Detail Page

**Frontend prompt:**

> "Create `[Resource]DetailPage.tsx` for `GET /api/[resource]/{id}`. Display all fields prominently. Include:
> - Edit button → opens Modal with form
> - Delete button → ConfirmDialog
> - Back button → navigate to list
> - If media upload is supported: file upload section with hidden file input, upload button, success/error messages, media grid with preview/download/delete overlay buttons
> - Use Blob download for proper filenames
> Follow the same pattern as `WordDetailPage.tsx`."

### Template D: Adding Pagination to a List Page

**Backend prompt:**

> "The endpoint `GET /api/[resource]/` already accepts `skip` and `limit` params and returns `total` count. No backend changes needed."

**Frontend prompt:**

> "Add pagination to `[Resource]Page`:
> 1. Add state: currentPage (1), totalItems (0), totalPages (1)
> 2. Calculate skip = (currentPage - 1) * PAGE_SIZE in fetch function
> 3. Set totalPages = Math.ceil(response.total / PAGE_SIZE) after fetch
> 4. Add `<Pagination>` component at bottom of list
> 5. handlePageChange sets currentPage, which triggers fetch via useEffect
> 6. Reset to page 1 when search/filters change"

---

## Part 5: Common Pitfalls & Reminders

### Backend Pitfalls

| Issue | Solution |
|-------|----------|
| DRF serializer rejects blank fields | Add `allow_blank=True` to CharField in **serializer**, not just `blank=True` on model |
| MySQL connection drops on idle | Restart FastAPI; consider `CONN_MAX_AGE` or connection pool settings |
| M2M queries cause N+1 | Always use `prefetch_related('tags')` on QuerySets with M2M |
| `sync_to_async` thread safety | Each sync function should be self-contained; import models **inside** functions to avoid app-not-ready errors |
| Django model import at module level | Use `from myapp.models import Model` **inside** functions in api/ files, not at top level |
| CORS blocking requests | Add frontend origin (`http://localhost:3000`) to `allow_origins` in FastAPI `CORSMiddleware` |

### Frontend Pitfalls

| Issue | Solution |
|-------|----------|
| Token refresh infinite loop | Skip refresh interceptor for `/api/auth/token`, `/api/auth/register`, `/api/auth/refresh` |
| Flash of login page on refresh | Use `isLoading` state in AuthContext; show spinner until token validation completes |
| OAuth2 login format | Use `URLSearchParams` with `Content-Type: application/x-www-form-urlencoded`, NOT JSON |
| CORS errors | Add frontend origin to backend `allow_origins` in FastAPI CORSMiddleware |
| Tag ID vs Name mismatch | API returns tag **names** (strings) in lists, but create/update expect tag **IDs** (numbers). Convert via tag list lookup |
| Stale closures in useCallback | Include ALL dependencies (search, filters, currentPage) in dependency array |
| useEffect firing loops | Use separate effects for: mount, pagination, debounced search, filter changes |
| Download not working | Use `fetch` → `Blob` → `createObjectURL` → programmatic `<a>` click, NOT just `window.open` |
| `tsconfig.json` errors | If using project references, set `composite: true`, `declaration: true` in referenced tsconfig |

### Checklist When Writing Requirements for AI

1. **Always provide the backend API contract** — Pydantic models or Swagger/OpenAPI spec
2. **Specify exact field names** — `created_time` vs `created_at` matters
3. **Specify enum values** — `'not_started'` vs `'notStarted'` must match backend
4. **Mention the async pattern** — "Use sync_to_async wrapper pattern" for any new backend endpoint
5. **Specify which tag_type** — Your system has two separate Tag models (`goals` and `words`)
6. **Reference existing files** — "Follow the same pattern as `WordsPage.tsx`" saves extensive explanation
7. **Mention special API formats** — e.g. "Login uses OAuth2 form data, not JSON"
8. **Specify UI style** — "Use the existing Tailwind dark theme and component classes (btn-primary, input, card)"
9. **List the dependencies** — "The page needs to fetch both words and tags on mount"
10. **Describe the expected UX flow** — "After successful creation, close the modal and refresh the list"

---

## Quick Reference: Project File Structure

### Frontend (`Goals_Front_End`)

```
src/
├── types/index.ts           ← All TypeScript interfaces (Phase 2)
├── services/
│   ├── api.ts               ← Axios instance + interceptors (Phase 3)
│   ├── auth.ts              ← Auth API calls (Phase 3)
│   ├── words.ts             ← Words CRUD (Phase 3)
│   ├── goals.ts             ← Goals CRUD (Phase 3)
│   ├── tasks.ts             ← Tasks CRUD (Phase 3)
│   ├── tags.ts              ← Tags CRUD (Phase 3)
│   └── index.ts             ← Barrel export (Phase 3)
├── contexts/
│   └── AuthContext.tsx       ← Auth state management (Phase 4)
├── layouts/
│   └── DashboardLayout.tsx   ← Sidebar + header + Outlet (Phase 5)
├── components/
│   ├── Modal.tsx             ← Generic modal (Phase 6)
│   ├── ConfirmDialog.tsx     ← Delete confirmation (Phase 6)
│   ├── EmptyState.tsx        ← Empty list placeholder (Phase 6)
│   ├── LoadingSpinner.tsx    ← Loading indicator (Phase 6)
│   └── Pagination.tsx        ← Page navigation (Phase 6)
├── pages/
│   ├── LoginPage.tsx         ← Login form (Phase 7)
│   ├── RegisterPage.tsx      ← Registration form (Phase 7)
│   ├── WordsPage.tsx         ← Words list + CRUD (Phase 7)
│   ├── WordDetailPage.tsx    ← Word detail + media (Phase 7)
│   ├── GoalsPage.tsx         ← Goals list + CRUD (Phase 7)
│   ├── TasksPage.tsx         ← Tasks list + CRUD (Phase 7)
│   ├── WordTagsPage.tsx      ← Word tags CRUD (Phase 7)
│   └── GoalTagsPage.tsx      ← Goal tags CRUD (Phase 7)
├── App.tsx                   ← Route definitions (Phase 5)
├── main.tsx                  ← Entry point (Phase 5)
└── index.css                 ← Global styles + Tailwind (Phase 1)
```

### Backend (`Goals`)

```
api/
├── main.py                   ← FastAPI app, Django setup, CORS, routes
├── auth.py                   ← JWT, user auth, dependency injection
├── goals.py                  ← Goal CRUD (sync helpers + async wrappers + endpoints)
├── tasks.py                  ← Task CRUD (same pattern)
├── words.py                  ← Word CRUD + media upload/delete
└── tags.py                   ← Tag CRUD (unified goals + words tags)

core/
├── models.py                 ← Custom User model
└── serializers.py            ← DRF serializers (user create/update)

goal_app/
└── models.py                 ← Goal, Task, Tag, GoalAttachment, TaskAttachment

main_app/
├── models.py                 ← EnglishWord, Tag, EnglishWordMedia
└── signals.py                ← Auto-delete media files on model delete

root_directory/
└── settings.py               ← Django settings (DB, JWT, CORS, media, cache, logging)
```
