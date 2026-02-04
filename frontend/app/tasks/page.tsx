'use client';

import { useEffect, useState } from 'react';
import { Text, Loader, Card, Label, Button, Icon } from '@gravity-ui/uikit';
import { Check, Xmark, ArrowRight } from '@gravity-ui/icons';
import { MainLayout } from '@/components/layout/MainLayout';
import { Header } from '@/components/layout/Header';
import { getPosts, approvePost, rejectPost } from '@/lib/api';
import type { Post } from '@/lib/types';
import { PLATFORM_LABELS } from '@/lib/types';

const PIPELINE_STAGES = [
  { id: 'research', title: '🔍 Ресёрч', description: 'Поиск тем и материалов' },
  { id: 'draft', title: '✏️ Драфт', description: 'AI генерирует контент' },
  { id: 'review', title: '👁 Ревью', description: 'Ожидает одобрения', isStop: true },
  { id: 'scheduled', title: '📅 План', description: 'Запланирован к публикации' },
  { id: 'published', title: '🚀 Публикация', description: 'Опубликован' },
];

export default function TasksPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

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

  // Считаем посты на ревью
  const reviewPosts = posts.filter((p) => p.status === 'review');
  const ideaPosts = posts.filter((p) => p.status === 'idea');
  const draftPosts = posts.filter((p) => p.status === 'draft');

  return (
    <MainLayout>
      <Header
        title="Задачи"
        subtitle="Пайплайн публикаций"
        showRefresh
        onRefresh={loadPosts}
      />

      <div className="dashboard-content">
        {/* Пайплайн визуализация */}
        <Card style={{ padding: '24px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
            {PIPELINE_STAGES.map((stage, index) => (
              <div key={stage.id} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div
                  style={{
                    padding: '12px 20px',
                    borderRadius: '8px',
                    backgroundColor: stage.isStop ? 'var(--g-color-base-warning-light)' : 'var(--g-color-base-generic)',
                    border: stage.isStop ? '2px solid var(--g-color-line-warning)' : '1px solid var(--g-color-line-generic)',
                    textAlign: 'center',
                  }}
                >
                  <Text variant="subheader-1">{stage.title}</Text>
                  {stage.isStop && (
                    <div>
                      <Label size="xs" theme="warning">STOP</Label>
                    </div>
                  )}
                </div>
                {index < PIPELINE_STAGES.length - 1 && (
                  <Icon data={ArrowRight} size={20} />
                )}
              </div>
            ))}
          </div>
        </Card>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '50px' }}>
            <Loader size="l" />
          </div>
        ) : (
          <>
            {/* Посты на ревью (STOP) */}
            {reviewPosts.length > 0 && (
              <div style={{ marginBottom: '32px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                  <Text variant="header-1">⏸ На ревью</Text>
                  <Label theme="warning">{reviewPosts.length}</Label>
                </div>

                <div style={{ display: 'grid', gap: '16px', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))' }}>
                  {reviewPosts.map((post) => (
                    <Card key={post.id} style={{ padding: '20px' }}>
                      <div style={{ marginBottom: '12px' }}>
                        <Text variant="subheader-1">{post.title}</Text>
                        <Text variant="caption-1" color="secondary">
                          {PLATFORM_LABELS[post.platform as keyof typeof PLATFORM_LABELS]} • {post.author}
                        </Text>
                      </div>

                      {post.content && (
                        <Text
                          variant="body-1"
                          color="secondary"
                          style={{
                            marginBottom: '16px',
                            display: '-webkit-box',
                            WebkitLineClamp: 4,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          }}
                        >
                          {post.content}
                        </Text>
                      )}

                      <div style={{ display: 'flex', gap: '8px' }}>
                        <Button view="outlined-danger" size="m" onClick={() => handleReject(post.id)}>
                          <Icon data={Xmark} />
                          Отклонить
                        </Button>
                        <Button view="action" size="m" onClick={() => handleApprove(post.id)}>
                          <Icon data={Check} />
                          Одобрить
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Идеи */}
            {ideaPosts.length > 0 && (
              <div style={{ marginBottom: '32px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                  <Text variant="header-1">💡 Идеи</Text>
                  <Label theme="info">{ideaPosts.length}</Label>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {ideaPosts.map((post) => (
                    <Card key={post.id} style={{ padding: '12px 16px' }}>
                      <Text variant="body-1">{post.title}</Text>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Черновики */}
            {draftPosts.length > 0 && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                  <Text variant="header-1">✏️ Черновики</Text>
                  <Label theme="utility">{draftPosts.length}</Label>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {draftPosts.map((post) => (
                    <Card key={post.id} style={{ padding: '12px 16px' }}>
                      <Text variant="body-1">{post.title}</Text>
                      <Text variant="caption-1" color="secondary">
                        {PLATFORM_LABELS[post.platform as keyof typeof PLATFORM_LABELS]}
                      </Text>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {reviewPosts.length === 0 && ideaPosts.length === 0 && draftPosts.length === 0 && (
              <div style={{ textAlign: 'center', paddingTop: '50px' }}>
                <Text variant="body-2" color="secondary">
                  Нет активных задач
                </Text>
              </div>
            )}
          </>
        )}
      </div>
    </MainLayout>
  );
}
