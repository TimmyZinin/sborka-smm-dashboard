'use client';

import { Card, Text, Label, Button, Icon } from '@gravity-ui/uikit';
import { Check, Xmark, Pencil } from '@gravity-ui/icons';
import type { Post } from '@/lib/types';
import { STATUS_COLORS, STATUS_LABELS, PLATFORM_LABELS } from '@/lib/types';

interface PostCardProps {
  post: Post;
  onApprove?: (id: number) => void;
  onReject?: (id: number) => void;
  onEdit?: (id: number) => void;
  compact?: boolean;
}

export function PostCard({ post, onApprove, onReject, onEdit, compact = false }: PostCardProps) {
  const isReview = post.status === 'review';

  if (compact) {
    return (
      <div className="post-card" style={{ padding: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <Text variant="body-1" ellipsis>
              {post.title}
            </Text>
            <Text variant="caption-1" color="secondary">
              {PLATFORM_LABELS[post.platform as keyof typeof PLATFORM_LABELS]}
            </Text>
          </div>
          <Label
            size="xs"
            theme={STATUS_COLORS[post.status as keyof typeof STATUS_COLORS] || 'unknown'}
          >
            {STATUS_LABELS[post.status as keyof typeof STATUS_LABELS] || post.status}
          </Label>
        </div>
      </div>
    );
  }

  return (
    <Card className="post-card">
      <div className="post-header">
        <div style={{ flex: 1 }}>
          <Text variant="subheader-1" className="post-title">
            {post.title}
          </Text>
          <div className="post-meta">
            <span>{PLATFORM_LABELS[post.platform as keyof typeof PLATFORM_LABELS]}</span>
            <span>•</span>
            <span>{post.author}</span>
            {post.scheduled_at && (
              <>
                <span>•</span>
                <span>{new Date(post.scheduled_at).toLocaleDateString('ru-RU')}</span>
              </>
            )}
          </div>
        </div>
        <Label theme={STATUS_COLORS[post.status as keyof typeof STATUS_COLORS] || 'unknown'}>
          {STATUS_LABELS[post.status as keyof typeof STATUS_LABELS] || post.status}
        </Label>
      </div>

      {post.content && (
        <Text
          variant="body-1"
          color="secondary"
          style={{
            marginBottom: '12px',
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {post.content}
        </Text>
      )}

      {post.image_url && (
        <div
          style={{
            marginBottom: '12px',
            borderRadius: '8px',
            overflow: 'hidden',
            maxHeight: '200px',
          }}
        >
          <img
            src={post.image_url}
            alt={post.title}
            style={{ width: '100%', height: 'auto', objectFit: 'cover' }}
          />
        </div>
      )}

      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
        {onEdit && (
          <Button view="flat" size="s" onClick={() => onEdit(post.id)}>
            <Icon data={Pencil} size={14} />
            Редактировать
          </Button>
        )}

        {isReview && onReject && (
          <Button view="flat-danger" size="s" onClick={() => onReject(post.id)}>
            <Icon data={Xmark} size={14} />
            Отклонить
          </Button>
        )}

        {isReview && onApprove && (
          <Button view="flat-action" size="s" onClick={() => onApprove(post.id)}>
            <Icon data={Check} size={14} />
            Одобрить
          </Button>
        )}
      </div>
    </Card>
  );
}
