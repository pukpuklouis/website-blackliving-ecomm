import React from 'react';
import { Editor } from 'novel';

interface NovelEditorProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export default function NovelEditor({
  value = '',
  onChange,
  placeholder = '在這裡編寫你的文章內容...',
  className,
  disabled = false,
}: NovelEditorProps) {
  return (
    <div className={className}>
      <Editor
        defaultValue={value}
        onUpdate={(editor: any) => {
          const html = editor?.getHTML() || '';
          onChange?.(html);
        }}
        disableLocalStorage={true}
        className="min-h-[300px] w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-background placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        editorProps={{
          attributes: {
            class: 'prose prose-sm max-w-none focus:outline-none min-h-[300px] py-4',
          },
        }}
        editable={!disabled}
      />
    </div>
  );
}