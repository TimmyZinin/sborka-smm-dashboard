'use client';

import { Button, Text, Icon } from '@gravity-ui/uikit';
import { Plus, ArrowRotateLeft } from '@gravity-ui/icons';

interface HeaderProps {
  title: string;
  subtitle?: string;
  showAddButton?: boolean;
  onAdd?: () => void;
  showRefresh?: boolean;
  onRefresh?: () => void;
}

export function Header({
  title,
  subtitle,
  showAddButton = false,
  onAdd,
  showRefresh = false,
  onRefresh,
}: HeaderProps) {
  return (
    <header className="dashboard-header">
      <div style={{ flex: 1 }}>
        <Text variant="header-1">{title}</Text>
        {subtitle && (
          <Text
            variant="body-1"
            color="secondary"
            style={{ marginLeft: '12px' }}
          >
            {subtitle}
          </Text>
        )}
      </div>

      <div style={{ display: 'flex', gap: '8px' }}>
        {showRefresh && (
          <Button view="flat" size="m" onClick={onRefresh}>
            <Icon data={ArrowRotateLeft} size={16} />
            Обновить
          </Button>
        )}

        {showAddButton && (
          <Button view="action" size="m" onClick={onAdd}>
            <Icon data={Plus} size={16} />
            Добавить
          </Button>
        )}
      </div>
    </header>
  );
}
