import {
  Badge,
  Button,
  Input,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@blackliving/ui";
import Plus from "@lucide/react/plus";
import Search from "@lucide/react/search";
import X from "@lucide/react/x";
import { useState } from "react";
import type { CustomerTag } from "./customer-types";

const PRESET_COLORS = [
  "#EF4444", // red
  "#F97316", // orange
  "#EAB308", // yellow
  "#22C55E", // green
  "#14B8A6", // teal
  "#3B82F6", // blue
  "#8B5CF6", // purple
  "#EC4899", // pink
  "#6B7280", // gray
];

type TagWithUsage = CustomerTag & {
  usageCount?: number;
};

type TagManagementSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tags: TagWithUsage[];
  onUpdateTag: (tagId: string, name: string, color: string) => Promise<void>;
  onDeleteTag: (tagId: string) => Promise<void>;
  onCreateTag: (name: string, color: string) => Promise<void>;
  onRefresh: () => void;
};

export function TagManagementSheet({
  open,
  onOpenChange,
  tags,
  onUpdateTag,
  onDeleteTag,
  onCreateTag,
  onRefresh,
}: TagManagementSheetProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showNewTagForm, setShowNewTagForm] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState(PRESET_COLORS[5]);

  // Filter tags by search
  const filteredTags = searchQuery
    ? tags.filter((tag) =>
        tag.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : tags;

  const handleStartEdit = (tag: TagWithUsage) => {
    setEditingId(tag.id);
    setEditName(tag.name);
    setEditColor(tag.color);
    setDeleteConfirmId(null);
  };

  const handleSaveEdit = async () => {
    if (!editingId) {
      return;
    }
    if (!editName.trim()) {
      return;
    }
    setIsLoading(true);
    try {
      await onUpdateTag(editingId, editName.trim(), editColor);
      setEditingId(null);
      onRefresh();
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (tagId: string) => {
    setIsLoading(true);
    try {
      await onDeleteTag(tagId);
      setDeleteConfirmId(null);
      onRefresh();
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTag = async () => {
    if (!newTagName.trim()) {
      return;
    }
    setIsLoading(true);
    try {
      await onCreateTag(newTagName.trim(), newTagColor);
      setNewTagName("");
      setNewTagColor(PRESET_COLORS[5]);
      setShowNewTagForm(false);
      onRefresh();
    } finally {
      setIsLoading(false);
    }
  };

  const renderTagItem = (tag: TagWithUsage) => {
    // Edit mode
    if (editingId === tag.id) {
      return (
        <div className="flex items-center gap-2 rounded-lg border bg-gray-50 p-3">
          <Input
            className="h-8 flex-1"
            disabled={isLoading}
            onChange={(e) => setEditName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSaveEdit();
              }
              if (e.key === "Escape") {
                setEditingId(null);
              }
            }}
            value={editName}
          />
          <div className="flex gap-1">
            {PRESET_COLORS.map((color) => (
              <button
                className={`h-6 w-6 rounded-full border-2 ${
                  editColor === color ? "border-gray-900" : "border-transparent"
                }`}
                key={color}
                onClick={() => setEditColor(color)}
                style={{ backgroundColor: color }}
                type="button"
              />
            ))}
          </div>
          <Button disabled={isLoading} onClick={handleSaveEdit} size="sm">
            儲存
          </Button>
          <Button
            disabled={isLoading}
            onClick={() => setEditingId(null)}
            size="sm"
            variant="ghost"
          >
            取消
          </Button>
        </div>
      );
    }

    // Delete confirm mode
    if (deleteConfirmId === tag.id) {
      return (
        <div className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 p-3">
          <div className="flex items-center gap-2">
            <span className="text-red-600 text-sm">
              確定刪除「{tag.name}」？
              {typeof tag.usageCount === "number" && tag.usageCount > 0 ? (
                <span className="ml-1">（{tag.usageCount} 個客戶使用中）</span>
              ) : null}
            </span>
          </div>
          <div className="flex gap-2">
            <Button
              className="bg-red-600 hover:bg-red-700"
              disabled={isLoading}
              onClick={() => handleDelete(tag.id)}
              size="sm"
            >
              刪除
            </Button>
            <Button
              disabled={isLoading}
              onClick={() => setDeleteConfirmId(null)}
              size="sm"
              variant="ghost"
            >
              取消
            </Button>
          </div>
        </div>
      );
    }

    // Normal mode
    return (
      <div className="group flex items-center justify-between rounded-lg border p-3 hover:bg-gray-50">
        <div className="flex items-center gap-3">
          <div
            className="h-4 w-4 rounded-full"
            style={{ backgroundColor: tag.color }}
          />
          <span className="font-medium">{tag.name}</span>
          {typeof tag.usageCount === "number" && (
            <Badge className="text-xs" variant="secondary">
              {tag.usageCount} 個客戶
            </Badge>
          )}
        </div>
        <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <Button
            onClick={() => handleStartEdit(tag)}
            size="sm"
            variant="ghost"
          >
            編輯
          </Button>
          <Button
            className="text-red-500"
            onClick={() => setDeleteConfirmId(tag.id)}
            size="sm"
            variant="ghost"
          >
            刪除
          </Button>
        </div>
      </div>
    );
  };

  return (
    <Sheet onOpenChange={onOpenChange} open={open}>
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle>管理所有標籤</SheetTitle>
          <SheetDescription>
            新增、編輯或刪除客戶標籤。刪除標籤會同時移除所有客戶的該標籤。
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {/* Search + Add */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute top-2.5 left-3 h-4 w-4 text-gray-400" />
              <Input
                className="pl-10"
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜尋標籤…"
                value={searchQuery}
              />
            </div>
            <Button
              onClick={() => setShowNewTagForm(true)}
              size="icon"
              variant="outline"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* New Tag Form */}
          {showNewTagForm ? (
            <div className="space-y-3 rounded-lg border bg-green-50 p-4">
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm">建立新標籤</span>
                <button
                  className="text-gray-500 hover:text-gray-700"
                  onClick={() => setShowNewTagForm(false)}
                  type="button"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <Input
                onChange={(e) => setNewTagName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleCreateTag();
                  }
                  if (e.key === "Escape") {
                    setShowNewTagForm(false);
                  }
                }}
                placeholder="標籤名稱"
                value={newTagName}
              />
              <div className="flex items-center gap-2">
                <span className="text-gray-600 text-sm">顏色：</span>
                <div className="flex gap-1">
                  {PRESET_COLORS.map((color) => (
                    <button
                      className={`h-6 w-6 rounded-full border-2 ${
                        newTagColor === color
                          ? "border-gray-900"
                          : "border-transparent"
                      }`}
                      key={color}
                      onClick={() => setNewTagColor(color)}
                      style={{ backgroundColor: color }}
                      type="button"
                    />
                  ))}
                </div>
              </div>
              <Button
                className="w-full"
                disabled={!newTagName.trim() || isLoading}
                onClick={handleCreateTag}
              >
                建立標籤
              </Button>
            </div>
          ) : null}

          {/* Tags List */}
          <div className="max-h-[60vh] space-y-2 overflow-y-auto">
            {filteredTags.length > 0 ? (
              filteredTags.map((tag) => (
                <div key={tag.id}>{renderTagItem(tag)}</div>
              ))
            ) : (
              <div className="py-8 text-center text-gray-500">
                {searchQuery ? "找不到符合的標籤" : "尚未建立任何標籤"}
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
