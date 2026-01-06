import {
  type BlockNoteEditor as BlockNoteEditorType,
  BlockNoteSchema,
  type BlockSpec,
  defaultBlockSpecs,
  type PartialBlock,
} from "@blocknote/core";
import { filterSuggestionItems } from "@blocknote/core/extensions";
import {
  getDefaultReactSlashMenuItems,
  SideMenuController,
  SuggestionMenuController,
  useCreateBlockNote,
  useEditorChange,
} from "@blocknote/react";
import { BlockNoteView } from "@blocknote/shadcn";
import {
  ColumnBlock,
  ColumnListBlock,
  getMultiColumnSlashMenuItems,
  multiColumnDropCursor,
  locales as multiColumnLocales,
} from "@blocknote/xl-multi-column";
import React, { useCallback, useEffect, useRef, useState } from "react";
import "@blocknote/core/fonts/inter.css";
import "@blocknote/shadcn/style.css";
import { en } from "@blocknote/core/locales";
import type { MediaLibraryItem } from "../../services/mediaLibrary";
import { ImageLinkBlock } from "./blocks/ImageLinkBlock";
import { MediaLibraryDialog } from "./MediaLibraryDialog";
import { MediaSideMenu } from "./MediaSideMenu";

export type BlockNoteEditorProps = {
  initialContent?: Record<string, unknown>[]; // JSON blocks
  value?: string; // Markdown string
  onChange?: (markdown: string) => void;
  onChangeBlocks?: (blocks: Record<string, unknown>[]) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
};

export default function BlockNoteEditor({
  initialContent,
  value = "",
  onChange,
  onChangeBlocks,
  placeholder = "在這裡編寫文章內容...",
  className = "bn-editor-style",
  disabled = false,
}: BlockNoteEditorProps) {
  // Track last outbound markdown to avoid feedback loops
  const lastMarkdownRef = useRef<string>("");
  const applyingExternalRef = useRef<boolean>(false);
  const pendingPickerRef = useRef<{
    resolve: (item?: MediaLibraryItem) => void;
    blockId?: string;
    category: "images" | "files";
  } | null>(null);

  const [mediaDialogOpen, setMediaDialogOpen] = useState(false);
  const [mediaCategory, setMediaCategory] = useState<"images" | "files">(
    "images"
  );

  const schema = BlockNoteSchema.create({
    blockSpecs: {
      ...defaultBlockSpecs,
      column: ColumnBlock as BlockSpec,
      columnList: ColumnListBlock as BlockSpec,
      imageLink: ImageLinkBlock(),
    },
  });

  const editor = useCreateBlockNote({
    schema,
    initialContent:
      initialContent && initialContent.length > 0 ? initialContent : undefined,
    // Localize placeholders
    dictionary: {
      ...en,
      slash_menu: {
        ...en.slash_menu,
        ...multiColumnLocales.en.slash_menu,
      },
      multi_column: {
        slash_menu: multiColumnLocales.en.slash_menu,
      },
      placeholders: {
        ...en.placeholders,
        // Only show a placeholder when the entire document is empty.
        // Per-block placeholders are disabled to avoid overlapping once users start typing.
        emptyDocument: placeholder,
        default: "",
        heading: "",
      },
    },
    dropCursor: multiColumnDropCursor,
  });

  const runWithSideMenuFrozen = useCallback(
    async <T,>(operation: () => Promise<T>): Promise<T> => {
      const sideMenu = (
        editor as typeof editor & {
          sideMenu?: {
            freezeMenu: () => void;
            unfreezeMenu: () => void;
            state: unknown;
          };
        }
      )?.sideMenu;
      const canFreeze =
        !!sideMenu &&
        typeof sideMenu.freezeMenu === "function" &&
        typeof sideMenu.unfreezeMenu === "function" &&
        sideMenu.state;

      if (!canFreeze) {
        return operation();
      }

      let shouldUnfreeze = false;
      try {
        try {
          sideMenu.freezeMenu();
          shouldUnfreeze = true;
        } catch (error) {
          console.warn("BlockNote side menu freeze failed", error);
          return operation();
        }

        return await operation();
      } finally {
        if (shouldUnfreeze) {
          try {
            sideMenu.unfreezeMenu();
          } catch (error) {
            console.warn("BlockNote side menu unfreeze failed", error);
          }
        }
      }
    },
    [editor]
  );

  const insertAssetBlock = useCallback(
    (
      asset: MediaLibraryItem,
      category: "images" | "files",
      blockId?: string
    ) => {
      const blockType =
        category === "images" || asset.isImage ? "image" : "file";
      const blockProps = {
        url: asset.url,
        name: asset.name ?? asset.key,
      } as Record<string, unknown>;

      const blocks: PartialBlock[] = [{ type: blockType, props: blockProps }];
      const referenceBlock =
        (blockId ? editor.getBlock(blockId) : undefined) ||
        editor.getTextCursorPosition().block;
      const inserted = editor.insertBlocks(blocks, referenceBlock, "after")[0];

      if (inserted) {
        editor.setTextCursorPosition(inserted);
      }
      editor.focus();
    },
    [editor]
  );

  const handleMediaSelect = useCallback(
    (asset: MediaLibraryItem) => {
      const pending = pendingPickerRef.current;
      if (pending) {
        // Only auto-insert if we have a blockId (Side Menu case)
        if (pending.blockId) {
          insertAssetBlock(asset, pending.category, pending.blockId);
        }
        pending.resolve(asset);
      }
      pendingPickerRef.current = null;
      setMediaDialogOpen(false);
    },
    [insertAssetBlock]
  );

  const closeMediaPicker = useCallback(() => {
    if (!mediaDialogOpen) {
      pendingPickerRef.current = null;
      return;
    }
    const pending = pendingPickerRef.current;
    if (pending) {
      pending.resolve(undefined);
    }
    pendingPickerRef.current = null;
    setMediaDialogOpen(false);
  }, [mediaDialogOpen]);

  const openMediaPicker = useCallback(
    (category: "images" | "files", blockId?: string) => {
      setMediaCategory(category);
      setMediaDialogOpen(true);

      return new Promise<MediaLibraryItem | undefined>((resolve) => {
        pendingPickerRef.current = { resolve, blockId, category };
      });
    },
    []
  );

  // Expose openMediaPicker to custom blocks implementation
  useEffect(() => {
    if (editor) {
      type ExtendedEditor = BlockNoteEditorType & {
        openMediaPicker: (
          category: "images" | "files",
          blockId?: string
        ) => Promise<MediaLibraryItem | undefined>;
      };
      (editor as unknown as ExtendedEditor).openMediaPicker = openMediaPicker;
    }
  }, [editor, openMediaPicker]);

  // Push changes up as Markdown (lossy, which is fine for our use-case)
  const handleChange = useCallback(async () => {
    if (applyingExternalRef.current) {
      return; // skip if we are applying external value
    }
    await runWithSideMenuFrozen(async () => {
      const md = await editor.blocksToMarkdownLossy();
      if (md !== lastMarkdownRef.current) {
        lastMarkdownRef.current = md;
        onChange?.(md);
      }
      onChangeBlocks?.(editor.document);
    });
  }, [editor, onChange, onChangeBlocks, runWithSideMenuFrozen]);

  // Subscribe to editor changes
  useEditorChange(() => {
    handleChange();
  }, editor);

  // Hydrate from external Markdown value
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!editor) {
        return;
      }

      // If we have initial content (JSON), we shouldn't hydrate from Markdown
      // because Markdown is lossy and will destroy advanced blocks like columns.
      if (initialContent && initialContent.length > 0) {
        return;
      }

      const currentMd = await editor.blocksToMarkdownLossy();
      if (currentMd === (value || "")) {
        return; // already in sync
      }

      applyingExternalRef.current = true;
      try {
        await runWithSideMenuFrozen(async () => {
          const blocks = await editor.tryParseMarkdownToBlocks(value || "");
          if (!cancelled) {
            // Replace all existing top-level blocks with parsed ones (can be empty for blank docs)
            editor.replaceBlocks(editor.document, blocks);
            // Align last outbound snapshot so the next onChange isn't treated as user edit
            lastMarkdownRef.current = await editor.blocksToMarkdownLossy();
          }
        });
      } finally {
        applyingExternalRef.current = false;
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [value, editor, runWithSideMenuFrozen, initialContent]);

  return (
    <div className={className}>
      <BlockNoteView
        className="min-h-[24rem] w-full rounded-md border border-input bg-background px-4 py-3"
        editable={!disabled}
        editor={editor}
        formattingToolbar
        linkToolbar
        sideMenu={false}
        slashMenu={false}
        theme="light"
      >
        <SideMenuController
          sideMenu={(props) => (
            <MediaSideMenu {...props} onLaunchPicker={openMediaPicker} />
          )}
        />
        <SuggestionMenuController
          getItems={(query: string) => {
            const items: unknown[] = [];

            try {
              items.push(...getDefaultReactSlashMenuItems(editor));
            } catch (_e) {
              console.error("Error getting default slash menu items:", _e);
            }

            try {
              items.push(
                ...getMultiColumnSlashMenuItems(editor as BlockNoteEditorType)
              );
            } catch (_e) {
              // Silently ignore multi-column menu errors for now
            }

            // Custom Image Link Block
            items.push({
              title: "圖片連結 (Image Link)",
              onItemClick: () => {
                const currentBlock = editor.getTextCursorPosition().block;
                editor.insertBlocks(
                  [{ type: "imageLink", props: {} }],
                  currentBlock,
                  "after"
                );
              },
              aliases: [
                "image link",
                "imagelink",
                "banner",
                "photo",
                "picture",
                "tupian",
              ],
              group: "Media",
              icon: (
                <svg
                  fill="none"
                  height="20"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  width="20"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <title>Image Link Icon</title>
                  <rect height="18" rx="2" ry="2" width="18" x="3" y="3" />
                  <circle cx="9" cy="9" r="2" />
                  <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                </svg>
              ),
              subtext: "插入帶連結的圖片",
            });

            try {
              const filtered = filterSuggestionItems(
                items as {
                  title: string;
                  aliases?: readonly string[] | undefined;
                }[],
                query
              );
              return Promise.resolve(filtered);
            } catch (_e) {
              return Promise.resolve(items);
            }
          }}
          onItemClick={(item: unknown) => {
            if (
              typeof item === "object" &&
              item !== null &&
              "onItemClick" in item
            ) {
              const onClick = (item as Record<string, unknown>).onItemClick;
              if (typeof onClick === "function") {
                (onClick as () => void)();
              }
            }
          }}
          suggestionMenuComponent={({ items, onItemClick }) => (
            <div className="suggestion-menu max-h-64 overflow-y-auto rounded-md border border-border bg-background p-1 shadow-lg">
              {items.map((item: unknown, index) => {
                const i = item as {
                  title: string;
                  icon?: React.ReactNode;
                  subtext?: string;
                };
                return (
                  <button
                    className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground"
                    key={`${typeof i.title === "string" ? i.title : "unknown"}-${index}`}
                    onClick={() => onItemClick?.(item)}
                    type="button"
                  >
                    {i.icon !== null && React.isValidElement(i.icon) ? (
                      <span className="flex-shrink-0">{i.icon}</span>
                    ) : null}
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium">
                        {typeof i.title === "string" ? i.title : ""}
                      </div>
                      {i.subtext !== null && typeof i.subtext === "string" && (
                        <div className="truncate text-muted-foreground text-xs">
                          {i.subtext}
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
          triggerCharacter="/"
        />
      </BlockNoteView>
      <div className="mt-2 text-foreground/30 text-xs">輸入 / 開啟指令選單</div>
      <MediaLibraryDialog
        initialCategory={mediaCategory}
        onClose={closeMediaPicker}
        onSelect={handleMediaSelect}
        open={mediaDialogOpen}
      />
    </div>
  );
}
