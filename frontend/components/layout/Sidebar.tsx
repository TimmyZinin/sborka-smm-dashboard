'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Icon, Text } from '@gravity-ui/uikit';
import {
  House,
  Calendar,
  FileText,
  Globe,
  ListCheck,
  Gear,
} from '@gravity-ui/icons';

const menuItems = [
  { href: '/overview', label: 'Обзор', icon: House },
  { href: '/content-plan', label: 'Контент-план', icon: Calendar },
  { href: '/publications', label: 'Публикации', icon: FileText },
  { href: '/platforms', label: 'Соцсети', icon: Globe },
  { href: '/tasks', label: 'Задачи', icon: ListCheck },
  { href: '/settings', label: 'Настройки', icon: Gear },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="dashboard-sidebar">
      <div style={{ padding: '20px 16px' }}>
        <Text variant="subheader-2" style={{ fontWeight: 600 }}>
          СБОРКА SMM
        </Text>
      </div>

      <nav style={{ padding: '0 8px' }}>
        {menuItems.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');

          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 12px',
                borderRadius: '8px',
                marginBottom: '4px',
                backgroundColor: isActive ? 'var(--g-color-base-selection)' : 'transparent',
                color: isActive ? 'var(--g-color-text-primary)' : 'var(--g-color-text-secondary)',
                transition: 'all 0.15s',
              }}
            >
              <Icon data={item.icon} size={18} />
              <Text variant="body-1">{item.label}</Text>
            </Link>
          );
        })}
      </nav>

      <div
        style={{
          position: 'absolute',
          bottom: '20px',
          left: '16px',
          right: '16px',
        }}
      >
        <div
          style={{
            padding: '12px',
            borderRadius: '8px',
            backgroundColor: 'var(--g-color-base-positive-light)',
          }}
        >
          <Text variant="caption-2" color="positive">
            Агент активен
          </Text>
          <Text variant="caption-1" color="secondary">
            Последний запуск: 2 мин назад
          </Text>
        </div>
      </div>
    </aside>
  );
}
