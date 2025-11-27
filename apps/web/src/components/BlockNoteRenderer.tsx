import React, { useEffect } from 'react';
import { useCreateBlockNote } from '@blocknote/react';
import { BlockNoteView } from '@blocknote/shadcn';
import '@blocknote/core/fonts/inter.css';
import '@blocknote/shadcn/style.css';

interface BlockNoteRendererProps {
    content: any[]; // JSON blocks
    className?: string;
}

export default function BlockNoteRenderer({ content, className }: BlockNoteRendererProps) {
    const editor = useCreateBlockNote();

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
