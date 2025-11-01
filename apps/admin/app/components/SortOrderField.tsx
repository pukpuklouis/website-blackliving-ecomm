import React from 'react';
import { Input } from '@blackliving/ui';
import { Label } from '@blackliving/ui';

export interface SortOrderFieldProps {
  value: number | undefined;
  onChange: (value: number) => void;
  onBlur?: () => void;
  error?: string;
  disabled?: boolean;
}

export function SortOrderField({ value, onChange, onBlur, error, disabled }: SortOrderFieldProps) {
  const normalizedValue = typeof value === 'number' && Number.isFinite(value) ? value : 0;

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const raw = event.target.value;

    if (raw === '') {
      onChange(0);
      return;
    }

    const parsed = Number.parseInt(raw, 10);
    if (Number.isNaN(parsed) || parsed < 0) {
      return;
    }

    onChange(parsed);
  };

  const helperText =
    normalizedValue === 0
      ? '自動排序：系統會根據更新時間顯示文章'
      : `手動排序：目前的顯示順序為 ${normalizedValue}`;

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor="sort-order">排序順序</Label>
      <div className="flex items-center gap-3">
        <Input
          id="sort-order"
          type="number"
          inputMode="numeric"
          min={0}
          step={1}
          value={Number.isFinite(normalizedValue) ? normalizedValue : 0}
          onChange={handleChange}
          onBlur={onBlur}
          disabled={disabled}
        />
        <span className="text-sm text-muted-foreground whitespace-nowrap">{helperText}</span>
      </div>
      <p className="text-xs text-muted-foreground">
        0 代表「自動排序」，數值越小會顯示在越前面。
      </p>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
