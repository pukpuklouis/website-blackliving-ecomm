import React, { useEffect } from 'react';
import { useCreateBlockNote } from '@blocknote/react';
import { BlockNoteView } from '@blocknote/shadcn';
import '@blocknote/core/fonts/inter.css';
import '@blocknote/shadcn/style.css';

import { BlockNoteSchema, defaultBlockSpecs } from '@blocknote/core';
import { ColumnBlock, ColumnListBlock } from '@blocknote/xl-multi-column';

interface BlockNoteRendererProps {
    content: any[]; // JSON blocks
    className?: string;
}

export default function BlockNoteRenderer({ content, className }: BlockNoteRendererProps) {
    const schema = BlockNoteSchema.create({
        blockSpecs: {
            ...defaultBlockSpecs,
            column: ColumnBlock,
            columnList: ColumnListBlock,
        },
    });

    const editor = useCreateBlockNote({ schema });

    useEffect(() => {
        if (editor && content) {
            editor.replaceBlocks(editor.document, content);
        }
    }, [editor, content]);

    const proseClasses = [
        'prose-2xl',
        // 'md:prose-lg',
        // // 'prose-base',
        'prose-fluidScale',
        // 'max-w-none',
        'prose-headings:font-semibold',
        'prose-headings:text-foreground',
        // 'prose-headings:scroll-mt-0',
        'md:prose-p:text-xl',
        'prose-p:leading-relaxed',
        // 'prose-a:text-primary',
        // 'prose-a:no-underline',
        // 'prose-a:transition-colors',
        // 'prose-a:hover:text-primary/80',
        'prose-strong:text-foreground',
        // 'prose-li:marker:text-muted-foreground',
        'prose-img:my-0!',
        // 'prose-img:shadow-sm',
        className,
        'max-md:[&_.bn-editor]:px-0!',
    ]
        .filter(Boolean)
        .join(' ');

    return (
        <div className={proseClasses}>
            <BlockNoteView editor={editor} editable={false} theme="light" />
        </div>
    );
}
