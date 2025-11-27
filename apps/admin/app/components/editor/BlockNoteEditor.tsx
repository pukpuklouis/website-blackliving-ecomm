import React, { useCallback, useEffect, useRef, useState } from 'react';
import { BlockNoteSchema, defaultBlockSpecs, filterSuggestionItems } from '@blocknote/core';
import {
  useCreateBlockNote,
  useEditorChange,
  SideMenuController,
  SuggestionMenuController,
  getDefaultReactSlashMenuItems,
} from '@blocknote/react';
import {
  ColumnBlock,
  ColumnListBlock,
  multiColumnDropCursor,
  getMultiColumnSlashMenuItems,
  locales as multiColumnLocales,
} from '@blocknote/xl-multi-column';
import { BlockNoteView } from '@blocknote/shadcn';
import '@blocknote/core/fonts/inter.css';
import '@blackliving/tailwind-config/styles.css';
import '@blocknote/shadcn/style.css';
import { en } from '@blocknote/core/locales';
import { MediaLibraryDialog } from './MediaLibraryDialog';
import { MediaSideMenu } from './MediaSideMenu';
import type { MediaLibraryItem } from '../../services/mediaLibrary';

export type BlockNoteEditorProps = {
  initialContent?: any[]; // JSON blocks
  value?: string; // Markdown string
  onChange?: (markdown: string) => void;
  onChangeBlocks?: (blocks: any[]) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
};

export default function BlockNoteEditor({
  initialContent,
  value = '',
  onChange,
  onChangeBlocks,
  placeholder = '在這裡編寫文章內容...',
  className = 'bn-editor-style',
  disabled = false,
}: BlockNoteEditorProps) {
  // Track last outbound markdown to avoid feedback loops
  const lastMarkdownRef = useRef<string>('');
  const applyingExternalRef = useRef<boolean>(false);
  const pendingPickerRef = useRef<{
    resolve: () => void;
    blockId?: string;
    category: 'images' | 'files';
  } | null>(null);

  const [mediaDialogOpen, setMediaDialogOpen] = useState(false);
  const [mediaCategory, setMediaCategory] = useState<'images' | 'files'>('images');

  const schema = BlockNoteSchema.create({
    blockSpecs: {
      ...defaultBlockSpecs,
      column: ColumnBlock,
      columnList: ColumnListBlock,
    },
  });

  const editor = useCreateBlockNote({
    schema,
    initialContent: initialContent && initialContent.length > 0 ? initialContent : undefined,
    // Localize placeholders
    dictionary: {
      ...en,
      slash_menu: {
        ...en.slash_menu,
        ...multiColumnLocales.en.slash_menu,
      },
      multi_column: {
        slash_menu: multiColumnLocales.en.slash_menu,
      } as any,
      placeholders: {
        ...en.placeholders,
        // Only show a placeholder when the entire document is empty.
        // Per-block placeholders are disabled to avoid overlapping once users start typing.
        emptyDocument: placeholder,
        default: '',
        heading: '',
      },
    },
    dropCursor: multiColumnDropCursor,
  });

  const runWithSideMenuFrozen = useCallback(
    async <T,>(operation: () => Promise<T>): Promise<T> => {
      const sideMenu = (editor as typeof editor & { sideMenu?: any })?.sideMenu;
      const canFreeze =
        !!sideMenu &&
        typeof sideMenu.freezeMenu === 'function' &&
        typeof sideMenu.unfreezeMenu === 'function' &&
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
          console.warn('BlockNote side menu freeze failed', error);
          return operation();
        }

        return await operation();
      } finally {
        if (shouldUnfreeze) {
          try {
            sideMenu.unfreezeMenu();
          } catch (error) {
            console.warn('BlockNote side menu unfreeze failed', error);
          }
        }
      }
    },
    [editor]
  );

  const insertAssetBlock = useCallback(
    (asset: MediaLibraryItem, category: 'images' | 'files', blockId?: string) => {
      const blockType = category === 'images' || asset.isImage ? 'image' : 'file';
      const blockProps = {
        url: asset.url,
        name: asset.name ?? asset.key,
      } as Record<string, unknown>;

      const blocks = [{ type: blockType, props: blockProps } as any];
      const referenceBlock = (blockId ? editor.getBlock(blockId) : undefined) || editor.getTextCursorPosition().block;
      const inserted = editor.insertBlocks(blocks, referenceBlock, 'after')[0];

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
        insertAssetBlock(asset, pending.category, pending.blockId);
        pending.resolve();
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
      pending.resolve();
    }
    pendingPickerRef.current = null;
    setMediaDialogOpen(false);
  }, [mediaDialogOpen]);

  const openMediaPicker = useCallback(async (category: 'images' | 'files', blockId?: string) => {
    setMediaCategory(category);
    setMediaDialogOpen(true);

    await new Promise<void>((resolve) => {
      pendingPickerRef.current = { resolve, blockId, category };
    });
  }, []);

  // Push changes up as Markdown (lossy, which is fine for our use-case)
  const handleChange = useCallback(async () => {
    if (applyingExternalRef.current) return; // skip if we are applying external value
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
    void handleChange();
  }, editor);

  // Hydrate from external Markdown value
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!editor) return;

      // If we have initial content (JSON), we shouldn't hydrate from Markdown
      // because Markdown is lossy and will destroy advanced blocks like columns.
      if (initialContent && initialContent.length > 0) return;

      const currentMd = await editor.blocksToMarkdownLossy();
      if (currentMd === (value || '')) return; // already in sync

      applyingExternalRef.current = true;
      try {
        await runWithSideMenuFrozen(async () => {
          const blocks = await editor.tryParseMarkdownToBlocks(value || '');
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
  }, [value, editor, runWithSideMenuFrozen]);

  return (
    <div className={className}>
      <BlockNoteView
        editor={editor}
        editable={!disabled}
        formattingToolbar
        sideMenu={false}
        slashMenu={false}
        linkToolbar
        theme="light"
        className="min-h-[24rem] w-full rounded-md border border-input bg-background px-4 py-3"
      >
        <SideMenuController
          sideMenu={(props) => <MediaSideMenu {...props} onLaunchPicker={openMediaPicker} />}
        />
        <SuggestionMenuController
          triggerCharacter={'/'}
          getItems={async (query) => {
            const items = [];

            try {
              items.push(...getDefaultReactSlashMenuItems(editor));
            } catch (e) {
              console.error('Error getting default slash menu items:', e);
            }

            try {
              items.push(...getMultiColumnSlashMenuItems(editor));
            } catch (e) {
            }

            try {
              const filtered = filterSuggestionItems(items, query);
              return filtered;
            } catch (e) {
              return items;
            }
          }}
        />
      </BlockNoteView>
      <div className="mt-2 text-xs text-foreground/30">輸入 / 開啟指令選單</div>
      <MediaLibraryDialog
        open={mediaDialogOpen}
        initialCategory={mediaCategory}
        onSelect={handleMediaSelect}
        onClose={closeMediaPicker}
      />
    </div>
  );
}
