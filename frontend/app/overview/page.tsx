'use client';

import { useEffect, useState } from 'react';
import { Card, Text, Loader, Label } from '@gravity-ui/uikit';
import { MainLayout } from '@/components/layout/MainLayout';
import { Header } from '@/components/layout/Header';
import { getHealthMetrics, getPosts } from '@/lib/api';
import type { HealthMetrics, Post } from '@/lib/types';
import { STATUS_COLORS, STATUS_LABELS, PLATFORM_LABELS } from '@/lib/types';

export default function OverviewPage() {
  const [metrics, setMetrics] = useState<HealthMetrics | null>(null);
  const [recentPosts, setRecentPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [metricsData, postsData] = await Promise.all([
          getHealthMetrics(),
          getPosts({ limit: 5 }),
        ]);
        setMetrics(metricsData);
        setRecentPosts(postsData.items);
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <MainLayout>
        <Header title="Обзор" />
        <div className="dashboard-content" style={{ display: 'flex', justifyContent: 'center', paddingTop: '100px' }}>
          <Loader size="l" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <Header title="Обзор" subtitle="Статус контент-плана" showRefresh onRefresh={() => window.location.reload()} />

      <div className="dashboard-content">
        {/* Метрики */}
        <div className="metrics-grid">
          <MetricCard
            title="Выполнение плана"
            value={metrics ? `${Math.round(metrics.plan_completion * 100)}%` : '—'}
            color="positive"
          />
          <MetricCard
            title="Буфер"
            value={metrics ? `${metrics.buffer_days} дней` : '—'}
            color="info"
          />
          <MetricCard
            title="Пустых слотов"
            value={metrics ? `${metrics.empty_slots_week}` : '—'}
            color={metrics && metrics.empty_slots_week > 3 ? 'danger' : 'warning'}
          />
          <MetricCard
            title="На ревью"
            value={metrics?.posts_by_status?.review?.toString() || '0'}
            color="utility"
          />
        </div>

        {/* Статистика по статусам */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
          <Card style={{ padding: '20px' }}>
            <Text variant="subheader-2" style={{ marginBottom: '16px' }}>
              По статусам
            </Text>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {metrics?.posts_by_status &&
                Object.entries(metrics.posts_by_status).map(([status, count]) => (
                  <div key={status} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Label theme={STATUS_COLORS[status as keyof typeof STATUS_COLORS] || 'unknown'}>
                      {STATUS_LABELS[status as keyof typeof STATUS_LABELS] || status}
                    </Label>
                    <Text variant="body-2">{count}</Text>
                  </div>
                ))}
            </div>
          </Card>

          <Card style={{ padding: '20px' }}>
            <Text variant="subheader-2" style={{ marginBottom: '16px' }}>
              По платформам
            </Text>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {metrics?.posts_by_platform &&
                Object.entries(metrics.posts_by_platform).map(([platform, count]) => (
                  <div key={platform} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text variant="body-1">
                      {PLATFORM_LABELS[platform as keyof typeof PLATFORM_LABELS] || platform}
                    </Text>
                    <Text variant="body-2">{count}</Text>
                  </div>
                ))}
            </div>
          </Card>
        </div>

        {/* Последние посты */}
        <Card style={{ padding: '20px' }}>
          <Text variant="subheader-2" style={{ marginBottom: '16px' }}>
            Последние публикации
          </Text>

          {recentPosts.length === 0 ? (
            <Text color="secondary">Нет публикаций</Text>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {recentPosts.map((post) => (
                <div
                  key={post.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px',
                    borderRadius: '8px',
                    backgroundColor: 'var(--g-color-base-generic)',
                  }}
                >
                  <div>
                    <Text variant="body-1">{post.title}</Text>
                    <Text variant="caption-1" color="secondary">
                      {PLATFORM_LABELS[post.platform as keyof typeof PLATFORM_LABELS]} • {post.author}
                    </Text>
                  </div>
                  <Label theme={STATUS_COLORS[post.status as keyof typeof STATUS_COLORS] || 'unknown'}>
                    {STATUS_LABELS[post.status as keyof typeof STATUS_LABELS] || post.status}
                  </Label>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </MainLayout>
  );
}

function MetricCard({
  title,
  value,
  color,
}: {
  title: string;
  value: string;
  color: 'positive' | 'info' | 'warning' | 'danger' | 'utility';
}) {
  const colorMap = {
    positive: 'var(--g-color-text-positive)',
    info: 'var(--g-color-text-info)',
    warning: 'var(--g-color-text-warning)',
    danger: 'var(--g-color-text-danger)',
    utility: 'var(--g-color-text-utility)',
  };

  return (
    <Card className="metric-card">
      <Text variant="caption-2" color="secondary" style={{ marginBottom: '8px', display: 'block' }}>
        {title}
      </Text>
      <Text variant="display-1" style={{ color: colorMap[color] }}>
        {value}
      </Text>
    </Card>
  );
}
