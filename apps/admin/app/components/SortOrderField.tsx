import { Input, Label } from "@blackliving/ui";
import type React from "react";

export interface SortOrderFieldProps {
  value: number | undefined;
  onChange: (value: number) => void;
  onBlur?: () => void;
  error?: string;
  disabled?: boolean;
}

export function SortOrderField({
  value,
  onChange,
  onBlur,
  error,
  disabled,
}: SortOrderFieldProps) {
  const normalizedValue =
    typeof value === "number" && Number.isFinite(value) ? value : 0;

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const raw = event.target.value;

    if (raw === "") {
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
      ? "自動排序：系統會根據更新時間顯示文章"
      : `手動排序：目前的顯示順序為 ${normalizedValue}`;

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor="sort-order">排序順序</Label>
      <div className="flex items-center gap-3">
        <Input
          disabled={disabled}
          id="sort-order"
          inputMode="numeric"
          min={0}
          onBlur={onBlur}
          onChange={handleChange}
          step={1}
          type="number"
          value={Number.isFinite(normalizedValue) ? normalizedValue : 0}
        />
        <span className="whitespace-nowrap text-muted-foreground text-sm">
          {helperText}
        </span>
      </div>
      <p className="text-muted-foreground text-xs">
        0 代表「自動排序」，數值越小會顯示在越前面。
      </p>
      {error ? <p className="text-red-600 text-sm">{error}</p> : null}
    </div>
  );
}
