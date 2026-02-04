/**
 * TypeScript типы для SMM Dashboard
 */

// ═══════════════════════════════════════════════════
// POST TYPES
// ═══════════════════════════════════════════════════

export type PostStatus = 'idea' | 'draft' | 'review' | 'scheduled' | 'published' | 'rejected';
export type PostPlatform = 'telegram' | 'linkedin' | 'vk' | 'twitter';

export interface Post {
  id: number;
  title: string;
  content: string | null;
  platform: PostPlatform;
  author: string;
  status: PostStatus;
  image_url: string | null;
  image_prompt: string | null;
  ai_prompt: string | null;
  ai_model: string | null;
  scheduled_at: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PostList {
  items: Post[];
  total: number;
  limit: number;
  offset: number;
}

export interface PostCreate {
  title: string;
  content?: string;
  platform?: PostPlatform;
  author?: string;
}

export interface PostUpdate {
  title?: string;
  content?: string;
  platform?: PostPlatform;
  author?: string;
  status?: PostStatus;
  image_url?: string;
  scheduled_at?: string;
}

// ═══════════════════════════════════════════════════
// METRICS TYPES
// ═══════════════════════════════════════════════════

export interface HealthMetrics {
  plan_completion: number;
  buffer_days: number;
  empty_slots_week: number;
  posts_by_status: Record<PostStatus, number>;
  posts_by_platform: Record<PostPlatform, number>;
}

// ═══════════════════════════════════════════════════
// UI TYPES
// ═══════════════════════════════════════════════════

export interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  href: string;
}

// Тема для Label компонента (Gravity UI)
export type LabelTheme = 'normal' | 'info' | 'warning' | 'danger' | 'utility' | 'unknown' | 'success' | 'clear';

export const STATUS_COLORS: Record<PostStatus, LabelTheme> = {
  idea: 'unknown',     // Серый
  draft: 'warning',    // Жёлтый
  review: 'info',      // Синий
  scheduled: 'utility', // Фиолетовый
  published: 'success', // Зелёный
  rejected: 'danger',   // Красный
};

// Цвета платформ
export const PLATFORM_COLORS: Record<PostPlatform, string> = {
  telegram: '#26A5E4',
  linkedin: '#0A66C2',
  vk: '#0077FF',
  twitter: '#1DA1F2',
};

// Названия статусов на русском
export const STATUS_LABELS: Record<PostStatus, string> = {
  idea: 'Идея',
  draft: 'Черновик',
  review: 'На ревью',
  scheduled: 'Запланирован',
  published: 'Опубликован',
  rejected: 'Отклонён',
};

// Названия платформ
export const PLATFORM_LABELS: Record<PostPlatform, string> = {
  telegram: 'Telegram',
  linkedin: 'LinkedIn',
  vk: 'VK',
  twitter: 'X / Twitter',
};
