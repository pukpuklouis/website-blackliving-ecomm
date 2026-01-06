import { Badge, Input } from "@blackliving/ui";
import Plus from "@lucide/react/plus";
import Search from "@lucide/react/search";
import X from "@lucide/react/x";
import { useEffect, useId, useRef, useState } from "react";
import type { CustomerTag } from "./customer-types";

type TagAutocompleteProps = {
  assignedTags: CustomerTag[];
  allTags: CustomerTag[];
  onAssignTag: (tagId: string) => Promise<void>;
  onRemoveTag: (tagId: string) => Promise<void>;
  onCreateTag: (name: string, color: string) => Promise<void>;
  disabled?: boolean;
};

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

function getRandomColor(): string {
  return PRESET_COLORS[Math.floor(Math.random() * PRESET_COLORS.length)];
}

export function TagAutocomplete({
  assignedTags,
  allTags,
  onAssignTag,
  onRemoveTag,
  onCreateTag,
  disabled = false,
}: TagAutocompleteProps) {
  const [inputValue, setInputValue] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filter available tags (not already assigned)
  const availableTags = allTags.filter(
    (tag) => !assignedTags.some((assigned) => assigned.id === tag.id)
  );

  // Filter by search input
  const filteredTags = inputValue
    ? availableTags.filter((tag) =>
        tag.name.toLowerCase().includes(inputValue.toLowerCase())
      )
    : availableTags;

  // Check if exact match exists
  const exactMatch = allTags.find(
    (tag) => tag.name.toLowerCase() === inputValue.toLowerCase()
  );

  // Show create option if no exact match and has input
  const showCreateOption = inputValue.trim() && !exactMatch;

  // Total items in dropdown
  const dropdownItems = [
    ...filteredTags.map((tag) => ({ type: "tag" as const, tag })),
    ...(showCreateOption
      ? [{ type: "create" as const, name: inputValue.trim() }]
      : []),
  ];

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    const shouldOpenDropdown =
      e.key === "ArrowDown" ||
      e.key === "ArrowUp" ||
      (e.key === "Enter" && inputValue);

    if (!isOpen && e.key !== "Escape" && shouldOpenDropdown) {
      setIsOpen(true);
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < dropdownItems.length - 1 ? prev + 1 : 0
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev > 0 ? prev - 1 : dropdownItems.length - 1
        );
        break;
      case "Enter":
        e.preventDefault();
        if (
          dropdownItems.length > 0 &&
          highlightedIndex < dropdownItems.length
        ) {
          handleSelect(dropdownItems[highlightedIndex]);
        }
        break;
      case "Escape":
        setIsOpen(false);
        setInputValue("");
        break;
      case "Backspace":
        if (!inputValue && assignedTags.length > 0) {
          // Remove last tag
          const lastTag = assignedTags.at(-1);
          if (lastTag) {
            handleRemoveTag(lastTag.id);
          }
        }
        break;
      default:
        break;
    }
  };

  const handleSelect = async (
    item: { type: "tag"; tag: CustomerTag } | { type: "create"; name: string }
  ) => {
    setIsLoading(true);
    try {
      if (item.type === "tag") {
        await onAssignTag(item.tag.id);
      } else {
        await onCreateTag(item.name, getRandomColor());
      }
      setInputValue("");
      setIsOpen(false);
      setHighlightedIndex(0);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveTag = async (tagId: string) => {
    setIsLoading(true);
    try {
      await onRemoveTag(tagId);
    } finally {
      setIsLoading(false);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Reset highlighted index when filtered items change
  useEffect(() => {
    setHighlightedIndex(0);
  }, [filteredTags.length]);

  const inputId = useId();

  return (
    <div className="space-y-3">
      {/* Current Tags */}
      <div>
        <label className="mb-2 block font-medium text-sm" htmlFor={inputId}>
          目前標籤
        </label>
        <div className="flex min-h-[40px] flex-wrap gap-2">
          {assignedTags.length > 0 ? (
            assignedTags.map((tag) => (
              <Badge
                className="flex items-center gap-1 px-3 py-1.5 text-white"
                key={tag.id}
                style={{ backgroundColor: tag.color }}
              >
                {tag.name}
                <button
                  className="ml-1 hover:opacity-80"
                  disabled={isLoading || disabled}
                  onClick={() => handleRemoveTag(tag.id)}
                  type="button"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))
          ) : (
            <span className="text-gray-400 text-sm">尚未指派標籤</span>
          )}
        </div>
      </div>

      {/* Autocomplete Input */}
      <div className="relative">
        <div className="relative">
          <Search className="absolute top-3 left-3 h-4 w-4 text-gray-400" />
          <Input
            className="pl-10"
            disabled={disabled || isLoading}
            id={inputId}
            onChange={(e) => {
              setInputValue(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder="搜尋或建立標籤…"
            ref={inputRef}
            value={inputValue}
          />
        </div>

        {/* Dropdown */}
        {isOpen && dropdownItems.length > 0 ? (
          <div
            className="absolute top-full right-0 left-0 z-50 mt-1 max-h-60 overflow-auto rounded-md border bg-white shadow-lg"
            ref={dropdownRef}
          >
            {dropdownItems.map((item, index) => {
              const isHighlighted = index === highlightedIndex;
              if (item.type === "tag") {
                return (
                  <button
                    className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-gray-100 ${
                      isHighlighted ? "bg-gray-100" : ""
                    }`}
                    key={item.tag.id}
                    onClick={() => handleSelect(item)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    type="button"
                  >
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: item.tag.color }}
                    />
                    {item.tag.name}
                  </button>
                );
              }
              return (
                <button
                  className={`flex w-full items-center gap-2 border-gray-200 border-t px-3 py-2 text-left text-sm hover:bg-gray-100 ${
                    isHighlighted ? "bg-gray-100" : ""
                  }`}
                  key="create"
                  onClick={() => handleSelect(item)}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  type="button"
                >
                  <Plus className="h-3 w-3 text-green-600" />
                  <span>
                    建立「<span className="font-medium">{item.name}</span>」
                  </span>
                </button>
              );
            })}
          </div>
        ) : null}

        {/* Empty state when dropdown open but no results */}
        {isOpen && Boolean(inputValue) && dropdownItems.length === 0 ? (
          <div
            className="absolute top-full right-0 left-0 z-50 mt-1 rounded-md border bg-white p-3 text-center text-gray-500 text-sm shadow-lg"
            ref={dropdownRef}
          >
            按 Enter 建立新標籤
          </div>
        ) : null}
      </div>
    </div>
  );
}
