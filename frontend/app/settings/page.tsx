'use client';

import { useState } from 'react';
import { Card, Text, TextInput, TextArea, Button, Select } from '@gravity-ui/uikit';
import { MainLayout } from '@/components/layout/MainLayout';
import { Header } from '@/components/layout/Header';

export default function SettingsPage() {
  const [brandVoice, setBrandVoice] = useState(
    'Дружелюбный, экспертный тон. Фокус на практической пользе. Избегаем корпоративного языка и канцеляризмов.'
  );
  const [defaultAuthor, setDefaultAuthor] = useState(['kristina']);

  const authorOptions = [
    { value: 'kristina', content: 'Кристина Жукова' },
    { value: 'tim', content: 'Тим Зинин' },
  ];

  return (
    <MainLayout>
      <Header title="Настройки" />

      <div className="dashboard-content">
        <div style={{ maxWidth: '600px' }}>
          {/* Бренд-голос */}
          <Card style={{ padding: '24px', marginBottom: '24px' }}>
            <Text variant="subheader-2" style={{ marginBottom: '16px' }}>
              Бренд-голос
            </Text>
            <TextArea
              value={brandVoice}
              onUpdate={setBrandVoice}
              rows={4}
              placeholder="Опишите тон и стиль контента..."
            />
            <Text variant="caption-1" color="secondary" style={{ marginTop: '8px' }}>
              Эти инструкции будут использоваться AI при генерации контента
            </Text>
          </Card>

          {/* Автор по умолчанию */}
          <Card style={{ padding: '24px', marginBottom: '24px' }}>
            <Text variant="subheader-2" style={{ marginBottom: '16px' }}>
              Автор по умолчанию
            </Text>
            <Select
              value={defaultAuthor}
              onUpdate={setDefaultAuthor}
              options={authorOptions}
              width="max"
            />
          </Card>

          {/* Расписание публикаций */}
          <Card style={{ padding: '24px', marginBottom: '24px' }}>
            <Text variant="subheader-2" style={{ marginBottom: '16px' }}>
              Расписание публикаций
            </Text>
            <div style={{ display: 'grid', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Text variant="body-1" style={{ width: '100px' }}>Утро</Text>
                <TextInput value="09:00" style={{ width: '100px' }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Text variant="body-1" style={{ width: '100px' }}>День</Text>
                <TextInput value="13:00" style={{ width: '100px' }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Text variant="body-1" style={{ width: '100px' }}>Вечер</Text>
                <TextInput value="20:00" style={{ width: '100px' }} />
              </div>
            </div>
          </Card>

          {/* API ключи */}
          <Card style={{ padding: '24px', marginBottom: '24px' }}>
            <Text variant="subheader-2" style={{ marginBottom: '16px' }}>
              API ключи
            </Text>
            <div style={{ display: 'grid', gap: '16px' }}>
              <div>
                <Text variant="body-1" style={{ marginBottom: '8px' }}>OpenRouter API Key</Text>
                <TextInput
                  type="password"
                  placeholder="sk-or-..."
                  hasClear
                />
              </div>
              <div>
                <Text variant="body-1" style={{ marginBottom: '8px' }}>Groq API Key</Text>
                <TextInput
                  type="password"
                  placeholder="gsk_..."
                  hasClear
                />
              </div>
            </div>
            <Text variant="caption-1" color="secondary" style={{ marginTop: '12px' }}>
              Ключи хранятся безопасно и используются только для генерации контента
            </Text>
          </Card>

          {/* Сохранить */}
          <Button view="action" size="l" width="max">
            Сохранить настройки
          </Button>
        </div>
      </div>
    </MainLayout>
  );
}
