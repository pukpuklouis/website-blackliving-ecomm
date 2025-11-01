import React from 'react';
import type { DraggableAttributes, SyntheticListenerMap } from '@dnd-kit/core';
import GripVertical from '@lucide/react/grip-vertical';

interface DragHandleProps {
  listeners?: SyntheticListenerMap;
  attributes?: DraggableAttributes;
  disabled?: boolean;
  isDragging?: boolean;
  label?: string;
}

export function DragHandle({
  listeners,
  attributes,
  disabled = false,
  isDragging = false,
  label = '拖曳以調整排序',
}: DragHandleProps) {
  const listenerProps = !disabled && listeners ? listeners : {};
  const attributeProps = !disabled && attributes ? attributes : {};

  return (
    <button
      type="button"
      className={`flex size-8 w-5 items-center justify-center rounded border transition-colors ${disabled ? 'cursor-not-allowed opacity-40 border-transparent' : 'cursor-grab border-border hover:bg-muted active:cursor-grabbing'} ${isDragging ? 'bg-muted/80 shadow-sm' : ''}`}
      aria-label={label}
      aria-disabled={disabled}
      disabled={disabled}
      {...listenerProps}
      {...attributeProps}
    >
      <GripVertical className="h-4 w-4" aria-hidden="true" />
    </button>
  );
}
