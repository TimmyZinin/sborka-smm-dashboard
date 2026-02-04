'use client';

import { useEffect, useState } from 'react';
import { Text, Loader, Select, Button, Icon, Modal } from '@gravity-ui/uikit';
import { Plus } from '@gravity-ui/icons';
import { MainLayout } from '@/components/layout/MainLayout';
import { Header } from '@/components/layout/Header';
import { PostCard } from '@/components/posts/PostCard';
import { getPosts, approvePost, rejectPost } from '@/lib/api';
import type { Post, PostStatus, PostPlatform } from '@/lib/types';
import { STATUS_LABELS, PLATFORM_LABELS } from '@/lib/types';

export default function PublicationsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [platformFilter, setPlatformFilter] = useState<string[]>([]);
  const [total, setTotal] = useState(0);

  const loadPosts = async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { limit: 50 };
      if (statusFilter.length === 1) params.status = statusFilter[0];
      if (platformFilter.length === 1) params.platform = platformFilter[0];

      const data = await getPosts(params);
      setPosts(data.items);
      setTotal(data.total);
    } catch (error) {
      console.error('Failed to load posts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPosts();
  }, [statusFilter, platformFilter]);

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

  const statusOptions = [
    { value: '', content: 'Все статусы' },
    ...Object.entries(STATUS_LABELS).map(([value, content]) => ({ value, content })),
  ];

  const platformOptions = [
    { value: '', content: 'Все платформы' },
    ...Object.entries(PLATFORM_LABELS).map(([value, content]) => ({ value, content })),
  ];

  return (
    <MainLayout>
      <Header
        title="Публикации"
        subtitle={`Всего: ${total}`}
        showAddButton
        onAdd={() => console.log('Add post')}
        showRefresh
        onRefresh={loadPosts}
      />

      <div className="dashboard-content">
        {/* Фильтры */}
        <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
          <Select
            placeholder="Статус"
            options={statusOptions}
            value={statusFilter}
            onUpdate={setStatusFilter}
            width={200}
          />
          <Select
            placeholder="Платформа"
            options={platformOptions}
            value={platformFilter}
            onUpdate={setPlatformFilter}
            width={200}
          />
        </div>

        {/* Список постов */}
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '50px' }}>
            <Loader size="l" />
          </div>
        ) : posts.length === 0 ? (
          <div style={{ textAlign: 'center', paddingTop: '50px' }}>
            <Text variant="body-2" color="secondary">
              Нет публикаций
            </Text>
            <Button view="action" size="l" style={{ marginTop: '16px' }}>
              <Icon data={Plus} />
              Создать первую публикацию
            </Button>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '16px', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))' }}>
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onApprove={handleApprove}
                onReject={handleReject}
                onEdit={(id) => console.log('Edit', id)}
              />
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
