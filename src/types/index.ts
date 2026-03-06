// ==================== Auth Types ====================
export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  position: string;
  age: number | null;
}

export interface Token {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
  position?: string;
  age?: number;
}

export interface RegisterResponse extends User {
  message: string;
}

// ==================== Goal Types ====================
export interface Goal {
  id: number;
  title: string;
  description: string | null;
  notes: string | null;
  status: 'not_started' | 'in_progress' | 'completed' | 'on_hold';
  priority: 'low' | 'medium' | 'high';
  urgency: 'low' | 'medium' | 'high';
  creator_id: number;
  created_time: string;
  tags: string[];
}

export interface GoalCreate {
  title: string;
  description?: string;
  notes?: string;
  status?: string;
  priority?: string;
  urgency?: string;
  tags?: number[];
}

export interface GoalUpdate {
  title?: string;
  description?: string;
  notes?: string;
  status?: string;
  priority?: string;
  urgency?: string;
  tags?: number[];
}

export interface GoalListResponse {
  goals: Goal[];
  total: number;
  page: number;
  size: number;
}

// ==================== Task Types ====================
export interface Task {
  id: number;
  name: string;
  description: string | null;
  goal_id: number | null;
  status: 'not_done' | 'in_progress' | 'done';
  priority: 'low' | 'medium' | 'high';
  urgency: 'low' | 'medium' | 'high';
  creator_id: number;
  created_time: string;
  tags: string[];
  goal_title: string | null;
}

export interface TaskCreate {
  name: string;
  description?: string;
  goal_id?: number;
  status?: string;
  priority?: string;
  urgency?: string;
  tags?: number[];
}

export interface TaskUpdate {
  name?: string;
  description?: string;
  goal_id?: number;
  status?: string;
  priority?: string;
  urgency?: string;
  tags?: number[];
}

export interface TaskListResponse {
  tasks: Task[];
  total: number;
  page: number;
  size: number;
}

// ==================== Word Types ====================
export interface MediaFileInfo {
  id: number;
  file_url: string;
  filename: string;
}

export interface Word {
  id: number;
  title: string;
  explanation: string;
  notes: string | null;
  creator_id: number;
  created_at: string;
  tags: string[];
  media_files: MediaFileInfo[];
}

export interface WordCreate {
  title: string;
  explanation: string;
  notes?: string;
  tags?: number[];
}

export interface WordUpdate {
  title?: string;
  explanation?: string;
  notes?: string;
  tags?: number[];
}

export interface WordListResponse {
  words: Word[];
  total: number;
  page: number;
  size: number;
}

export interface MediaFile {
  id: number;
  file_url: string;
  uploaded_at: string;
}

// ==================== Tag Types ====================
export interface Tag {
  id: number;
  name: string;
  tag_type: 'goals' | 'words';
  creator_id: number;
  created_at: string;
  goal_count: number;
  task_count: number;
  word_count: number;
}

export interface TagCreate {
  name: string;
  tag_type: 'goals' | 'words';
}

export interface TagUpdate {
  name?: string;
}

export interface TagListResponse {
  tags: Tag[];
  total: number;
  page: number;
  size: number;
}

// ==================== Email Types ====================
export interface EmailConfig {
  id: number;
  is_active: boolean;
  timezone: string;
  send_times: string[];
  words_per_email: number;
  extra_recipients: string[];
  story_language: 'english' | 'bilingual';
  exclude_word_ids: number[];
  user_email: string;
  created_at: string;
  updated_at: string;
}

export interface EmailConfigUpdate {
  is_active?: boolean;
  timezone?: string;
  send_times?: string[];
  words_per_email?: number;
  extra_recipients?: string[];
  story_language?: string;
  exclude_word_ids?: number[];
}

export interface StoryEmail {
  id: number;
  word_snapshots: { title: string; explanation: string }[];
  story_content: string;
  subject: string;
  recipient_emails: string[];
  sent_at: string;
  status: 'pending' | 'sent' | 'failed';
  error_message?: string | null;
}

export interface StoryEmailListResponse {
  emails: StoryEmail[];
  total: number;
  page: number;
  size: number;
}

// ==================== API Response Types ====================
export interface ApiError {
  detail: string;
}

export interface PaginationParams {
  skip?: number;
  limit?: number;
}
