'use client';

import { useEffect, useState } from 'react';
import { Text, Loader, RadioButton, Card, Label } from '@gravity-ui/uikit';
import { MainLayout } from '@/components/layout/MainLayout';
import { Header } from '@/components/layout/Header';
import { PostCard } from '@/components/posts/PostCard';
import { getPosts, approvePost, rejectPost } from '@/lib/api';
import type { Post } from '@/lib/types';
import { STATUS_COLORS, STATUS_LABELS, PLATFORM_LABELS } from '@/lib/types';

type ViewMode = 'calendar' | 'kanban';

const KANBAN_COLUMNS = [
  { status: 'idea', title: '💡 Идеи' },
  { status: 'draft', title: '✏️ Черновики' },
  { status: 'review', title: '👁 Ревью' },
  { status: 'scheduled', title: '📅 Запланировано' },
  { status: 'published', title: '✅ Опубликовано' },
];

export default function ContentPlanPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('kanban');

  const loadPosts = async () => {
    setLoading(true);
    try {
      const data = await getPosts({ limit: 100 });
      setPosts(data.items);
    } catch (error) {
      console.error('Failed to load posts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPosts();
  }, []);

  const handleApprove = async (id: number) => {
    try {
      await approvePost(id);
      loadPosts();
    } catch (error) {
      console.error('Failed to approve:', error);
    }
  };

  const handleReject = async (id: number) => {
    try {
      await rejectPost(id);
      loadPosts();
    } catch (error) {
      console.error('Failed to reject:', error);
    }
  };

  const getPostsByStatus = (status: string) => posts.filter((p) => p.status === status);

  return (
    <MainLayout>
      <Header
        title="Контент-план"
        showAddButton
        onAdd={() => console.log('Add post')}
        showRefresh
        onRefresh={loadPosts}
      />

      <div className="dashboard-content">
        {/* Переключатель вида */}
        <div style={{ marginBottom: '24px' }}>
          <RadioButton
            value={viewMode}
            onUpdate={(value) => setViewMode(value as ViewMode)}
            options={[
              { value: 'kanban', content: 'Канбан' },
              { value: 'calendar', content: 'Календарь' },
            ]}
          />
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '50px' }}>
            <Loader size="l" />
          </div>
        ) : viewMode === 'kanban' ? (
          <KanbanView
            posts={posts}
            onApprove={handleApprove}
            onReject={handleReject}
          />
        ) : (
          <CalendarView posts={posts} />
        )}
      </div>
    </MainLayout>
  );
}

function KanbanView({
  posts,
  onApprove,
  onReject,
}: {
  posts: Post[];
  onApprove: (id: number) => void;
  onReject: (id: number) => void;
}) {
  const getPostsByStatus = (status: string) => posts.filter((p) => p.status === status);

  return (
    <div className="kanban-board">
      {KANBAN_COLUMNS.map((column) => {
        const columnPosts = getPostsByStatus(column.status);
        const isReviewColumn = column.status === 'review';

        return (
          <div key={column.status} className="kanban-column">
            <div className="kanban-column-header">
              <Text variant="subheader-1">{column.title}</Text>
              <Label size="xs" theme="info">
                {columnPosts.length}
              </Label>
            </div>

            <div className="kanban-cards">
              {columnPosts.length === 0 ? (
                <Text variant="caption-1" color="secondary" style={{ padding: '12px', textAlign: 'center' }}>
                  Нет постов
                </Text>
              ) : (
                columnPosts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    compact
                    onApprove={isReviewColumn ? onApprove : undefined}
                    onReject={isReviewColumn ? onReject : undefined}
                  />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function CalendarView({ posts }: { posts: Post[] }) {
  // Получаем текущую неделю
  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay() + 1); // Понедельник

  const days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(startOfWeek);
    date.setDate(startOfWeek.getDate() + i);
    return date;
  });

  const dayNames = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

  const getPostsForDay = (date: Date) => {
    return posts.filter((post) => {
      if (!post.scheduled_at) return false;
      const postDate = new Date(post.scheduled_at);
      return postDate.toDateString() === date.toDateString();
    });
  };

  return (
    <div>
      {/* Заголовки дней */}
      <div className="calendar-grid" style={{ marginBottom: '8px' }}>
        {days.map((date, i) => (
          <div key={i} style={{ textAlign: 'center' }}>
            <Text variant="caption-2" color="secondary">
              {dayNames[i]}
            </Text>
            <Text variant="body-1">
              {date.getDate()}
            </Text>
          </div>
        ))}
      </div>

      {/* Сетка календаря */}
      <div className="calendar-grid">
        {days.map((date, i) => {
          const dayPosts = getPostsForDay(date);
          const isToday = date.toDateString() === today.toDateString();

          return (
            <div
              key={i}
              className="calendar-day"
              style={{
                borderColor: isToday ? 'var(--g-color-line-brand)' : undefined,
                borderWidth: isToday ? '2px' : undefined,
              }}
            >
              {dayPosts.length === 0 ? (
                <Text variant="caption-1" color="hint" style={{ textAlign: 'center' }}>
                  —
                </Text>
              ) : (
                dayPosts.map((post) => (
                  <div
                    key={post.id}
                    style={{
                      padding: '6px 8px',
                      marginBottom: '4px',
                      borderRadius: '4px',
                      backgroundColor: 'var(--g-color-base-generic)',
                      fontSize: '12px',
                    }}
                  >
                    <Text variant="caption-2" ellipsis>
                      {post.title}
                    </Text>
                    <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
                      <Label size="xs" theme={STATUS_COLORS[post.status as keyof typeof STATUS_COLORS] || 'unknown'}>
                        {STATUS_LABELS[post.status as keyof typeof STATUS_LABELS]?.[0] || '?'}
                      </Label>
                    </div>
                  </div>
                ))
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
