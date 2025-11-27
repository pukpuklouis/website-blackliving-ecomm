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

    return (
        <div className={className}>
            <BlockNoteView editor={editor} editable={false} theme="light" />
        </div>
    );
}
