/**
 * API клиент для SMM Dashboard
 */
import type { Post, PostList, PostCreate, PostUpdate, HealthMetrics } from './types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// ═══════════════════════════════════════════════════
// FETCH WRAPPER
// ═══════════════════════════════════════════════════

async function fetchAPI<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(error.detail || `HTTP ${response.status}`);
  }

  // Для DELETE запросов может не быть тела
  if (response.status === 204) {
    return null as T;
  }

  return response.json();
}

// ═══════════════════════════════════════════════════
// POSTS API
// ═══════════════════════════════════════════════════

export async function getPosts(params?: {
  status?: string;
  platform?: string;
  limit?: number;
  offset?: number;
}): Promise<PostList> {
  const searchParams = new URLSearchParams();
  if (params?.status) searchParams.set('status', params.status);
  if (params?.platform) searchParams.set('platform', params.platform);
  if (params?.limit) searchParams.set('limit', String(params.limit));
  if (params?.offset) searchParams.set('offset', String(params.offset));

  const query = searchParams.toString();
  return fetchAPI<PostList>(`/api/posts${query ? `?${query}` : ''}`);
}

export async function getPost(id: number): Promise<Post> {
  return fetchAPI<Post>(`/api/posts/${id}`);
}

export async function createPost(data: PostCreate): Promise<Post> {
  return fetchAPI<Post>('/api/posts', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updatePost(id: number, data: PostUpdate): Promise<Post> {
  return fetchAPI<Post>(`/api/posts/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deletePost(id: number): Promise<void> {
  return fetchAPI<void>(`/api/posts/${id}`, {
    method: 'DELETE',
  });
}

export async function approvePost(id: number): Promise<Post> {
  return fetchAPI<Post>(`/api/posts/${id}/approve`, {
    method: 'POST',
  });
}

export async function rejectPost(id: number): Promise<Post> {
  return fetchAPI<Post>(`/api/posts/${id}/reject`, {
    method: 'POST',
  });
}

// ═══════════════════════════════════════════════════
// METRICS API
// ═══════════════════════════════════════════════════

export async function getHealthMetrics(): Promise<HealthMetrics> {
  return fetchAPI<HealthMetrics>('/api/metrics/health');
}

// ═══════════════════════════════════════════════════
// SWR FETCHERS
// ═══════════════════════════════════════════════════

export const fetcher = <T>(url: string): Promise<T> =>
  fetch(`${API_BASE}${url}`).then((res) => res.json());
