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

