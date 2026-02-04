'use client';

import { Card, Text, Label, Button, Icon } from '@gravity-ui/uikit';
import { Link as LinkIcon, TrashBin } from '@gravity-ui/icons';
import { MainLayout } from '@/components/layout/MainLayout';
import { Header } from '@/components/layout/Header';

const platforms = [
  {
    id: 'telegram',
    name: 'Telegram',
    icon: '📱',
    connected: true,
    postsCount: 12,
    lastPost: '2 часа назад',
    color: '#0088cc',
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    icon: '💼',
    connected: true,
    postsCount: 8,
    lastPost: '1 день назад',
    color: '#0077b5',
  },
  {
    id: 'vk',
    name: 'ВКонтакте',
    icon: '🔵',
    connected: false,
    postsCount: 0,
    lastPost: null,
    color: '#4c75a3',
  },
  {
    id: 'twitter',
    name: 'Twitter / X',
    icon: '🐦',
    connected: false,
    postsCount: 0,
    lastPost: null,
    color: '#1da1f2',
  },
];

export default function PlatformsPage() {
  return (
    <MainLayout>
      <Header title="Соцсети" subtitle="Подключённые платформы" />

      <div className="dashboard-content">
        <div style={{ display: 'grid', gap: '16px', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
          {platforms.map((platform) => (
            <Card key={platform.id} style={{ padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    backgroundColor: platform.color + '20',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '24px',
                  }}
                >
                  {platform.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <Text variant="subheader-2">{platform.name}</Text>
                  <Label
                    size="xs"
                    theme={platform.connected ? 'success' : 'unknown'}
                  >
                    {platform.connected ? 'Подключено' : 'Не подключено'}
                  </Label>
                </div>
              </div>

              {platform.connected ? (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <Text variant="body-1" color="secondary">Публикаций</Text>
                    <Text variant="body-1">{platform.postsCount}</Text>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <Text variant="body-1" color="secondary">Последний пост</Text>
                    <Text variant="body-1">{platform.lastPost}</Text>
                  </div>
                  <Button view="flat-danger" width="max">
                    <Icon data={TrashBin} />
                    Отключить
                  </Button>
                </>
              ) : (
                <Button view="action" width="max">
                  <Icon data={LinkIcon} />
                  Подключить
                </Button>
              )}
            </Card>
          ))}
        </div>
      </div>
    </MainLayout>
  );
}
