import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@blackliving/ui';
import { BlockNoteEditor } from '../../components/editor';
import { Button, Textarea } from '@blackliving/ui';

export default function EditorPlayground() {
  const [md, setMd] = useState<string>(
    `# 測試 BlockNote 編輯器\n\n- 支援粗體、斜體、清單\n- 以 Markdown 形式儲存\n\n> 這是引用區塊\n\n\`\`\`ts\nconsole.log('Hello BlockNote');\n\`\`\``
  );

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(md);
    } catch {}
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Editor Playground</CardTitle>
          <CardDescription>獨立測試 BlockNoteEditor（Markdown 讀寫）</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <BlockNoteEditor value={md} onChange={setMd} />
          <div className="flex items-center gap-2">
            <Button type="button" onClick={copy} size="sm">
              複製 Markdown
            </Button>
          </div>
          <div>
            <p className="text-sm text-gray-700 mb-1">即時 Markdown 輸出</p>
            <Textarea value={md} readOnly rows={10} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
