import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Textarea,
} from "@blackliving/ui";
import { useState } from "react";
import BlockNoteEditor from "../../components/editor/block-note-editor";

export default function EditorPlayground() {
  const [md, setMd] = useState<string>(
    `# 測試 BlockNote 編輯器\n\n- 支援粗體、斜體、清單\n- 以 Markdown 形式儲存\n\n> 這是引用區塊\n\n\`\`\`ts\nconsole.log('Hello BlockNote');\n\`\`\``
  );

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(md);
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);
      // TODO: Show user-friendly error message (e.g., toast notification)
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Editor Playground</CardTitle>
          <CardDescription>
            獨立測試 BlockNoteEditor（Markdown 讀寫）
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <BlockNoteEditor onChange={setMd} value={md} />
          <div className="flex items-center gap-2">
            <Button onClick={copy} size="sm" type="button">
              複製 Markdown
            </Button>
          </div>
          <div>
            <p className="mb-1 text-gray-700 text-sm">即時 Markdown 輸出</p>
            <Textarea readOnly rows={10} value={md} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
