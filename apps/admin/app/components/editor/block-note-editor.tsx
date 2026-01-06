// This file is now a wrapper to ensuring BlockNote only loads on client
// Implementation moved to BlockNoteEditor.client.tsx
import { lazy, Suspense } from "react";
import type { BlockNoteEditorProps } from "./BlockNoteEditor.client";

const BlockNoteEditorClient = lazy(() => import("./BlockNoteEditor.client"));

export default function BlockNoteEditor(props: BlockNoteEditorProps) {
  return (
    <Suspense
      fallback={
        <div className="min-h-[24rem] w-full animate-pulse rounded-md border bg-muted/20" />
      }
    >
      <BlockNoteEditorClient {...props} />
    </Suspense>
  );
}
