import type { DraggableAttributes, SyntheticListenerMap } from "@dnd-kit/core";
import GripVertical from "@lucide/react/grip-vertical";

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
  label = "拖曳以調整排序",
}: DragHandleProps) {
  const listenerProps = !disabled && listeners ? listeners : {};
  const attributeProps = !disabled && attributes ? attributes : {};

  return (
    <button
      aria-disabled={disabled}
      aria-label={label}
      className={`flex size-8 w-5 items-center justify-center rounded border transition-colors ${disabled ? "cursor-not-allowed border-transparent opacity-40" : "cursor-grab border-border hover:bg-muted active:cursor-grabbing"} ${isDragging ? "bg-muted/80 shadow-sm" : ""}`}
      disabled={disabled}
      type="button"
      {...listenerProps}
      {...attributeProps}
    >
      <GripVertical aria-hidden="true" className="h-4 w-4" />
    </button>
  );
}
