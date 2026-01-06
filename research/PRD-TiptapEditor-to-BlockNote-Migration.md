# TiptapEditor → BlockNote Migration PRD

## 🎯 Project Overview

Replace the current `TiptapEditor` with a BlockNote-based editor in the admin app while preserving Markdown storage and the existing blog workflow. The new editor must use the shared Shadcn/ui design system and keep the public site rendering pipeline unchanged (`marked` on the web app).

## 🔧 Current State

- Editor lives in `apps/admin/app/components/editor/TiptapEditor.tsx` and is consumed by `apps/admin/app/components/BlogComposer.tsx` and `apps/admin/app/routes/dashboard/editor-playground.tsx`.
- Admin stores and edits content as Markdown. Conversion chain is: Markdown ⇄ HTML (via `marked`/`turndown`) ⇄ Tiptap DOM.
- Web app renders Markdown to HTML with `marked` in `apps/web/src/components/blog/BlogContent.astro`.

### Issues with Current Tiptap Implementation
- Complex conversion layers (Markdown ↔ HTML ↔ Tiptap), harder to reason about and test.
- Larger dependency surface (`@tiptap/*`, `marked`, `turndown`) in admin for editing only.
- Custom toolbar and syncing logic add maintenance burden.

## ✅ Goals
- Keep storage format as Markdown (no DB or API changes).
- Achieve feature parity: headings, emphasis, lists, quote, code block, divider, undo/redo.
- Use BlockNote with Shadcn/ui and adhere to workspace conventions.
- Preserve current props contract: `value`, `onChange`, `placeholder`, `className`, `disabled`.
- Minimal impact to web rendering pipeline and SEO.

## ⛔ Non‑Goals
- Changing the web app’s Markdown rendering approach.
- Adding collaborative editing or AI features in this PRD.
- Changing BlogComposer form schema or validation rules.

## 📦 Dependencies Strategy

Important: This monorepo uses PNPM workspaces. Run commands from the repo root and target the admin app with `--filter ./apps/admin`.

Phase A (minimal-risk replacement):
- Add BlockNote + Shadcn wrapper.
- Keep `marked` and `turndown` in admin temporarily for Markdown compatibility where needed.

Phase B (follow-up clean-up):
- Evaluate BlockNote’s Markdown import/export utilities. If satisfactory, remove `turndown` usage in admin. `marked` remains in web.

Commands (Phase A):
```bash
pnpm -w --filter ./apps/admin add @blocknote/core @blocknote/react @blocknote/shadcn
pnpm -w --filter ./apps/admin remove @tiptap/react @tiptap/starter-kit @tiptap/pm
# retain (Phase A): marked, turndown
```

## 🧩 Component Design (Shadcn)

File: `apps/admin/app/components/editor/BlockNoteEditor.tsx`

```ts
import React, { useEffect } from 'react'
import { useCreateBlockNote } from '@blocknote/react'
import { BlockNoteView } from '@blocknote/shadcn'
import '@blocknote/core/fonts/inter.css'
import '@blocknote/shadcn/style.css'

type BlockNoteEditorProps = {
  value?: string; // Markdown input/output
  onChange?: (markdown: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export default function BlockNoteEditor({
  value = '',
  onChange,
  placeholder = '在這裡編寫你的文章內容...',
  className,
  disabled = false,
}: BlockNoteEditorProps) {
  const editor = useCreateBlockNote({
    // Phase A: hydrate with Markdown converted to blocks.
    // Start simple: let BlockNote accept plain text and rely on markdown shortcuts/paste.
    // Optionally replace with Markdown → blocks import once validated.
  })

  useEffect(() => {
    if (!editor) return
    // Phase A: for external value changes, set as plain text then let user format.
    // Phase B: switch to Markdown → blocks import.
  }, [value, editor])

  return (
    <div className={className}>
      <BlockNoteView
        editor={editor}
        editable={!disabled}
        formattingToolbar={true}
        sideMenu={true}
        linkToolbar={true}
        placeholder={placeholder}
      />
    </div>
  )
}
```

Notes:
- Phase A optimizes for a safe replacement. We keep Markdown I/O contract; where exact Markdown fidelity is required, we may retain `turndown` as a fallback (e.g., convert BlockNote HTML `editor.domElement.innerHTML` → Markdown) until BlockNote Markdown import/export is validated.
- Phase B replaces the fallback with BlockNote’s official Markdown import/export utilities if they meet accuracy requirements.

## 🔁 Markdown Strategy

Storage stays Markdown. Two options for conversions:

1) Phase A – Fallback via HTML:
- Outbound (onChange): take editor HTML → `turndown` → Markdown → `onChange(md)`.
- Inbound (value): current Markdown value can be provided as plain text or converted via `marked` → HTML → blocks (if a reliable HTML→blocks bridge is available). Otherwise hydrate as plain text; formatting occurs during edit.

2) Phase B – Native Markdown import/export:
- Use BlockNote’s Markdown helpers to import Markdown → blocks and export blocks → Markdown, removing reliance on `turndown` in admin.

Acceptance will verify that generated Markdown renders equivalently on the web app.

## 🧱 Feature Parity Map

- Bold/Italic/Underline/Strike → built-in formatting toolbar/shortcuts
- Headings H2/H3 → heading blocks
- Bullet/Ordered lists → list blocks
- Blockquote → quote block
- Code block → code block
- Divider → horizontal rule
- Undo/Redo → built-in history

## 🛠 Implementation Steps

1) Create `apps/admin/app/components/editor/BlockNoteEditor.tsx` (as above).
2) Update `apps/admin/app/components/editor/index.ts` to export `BlockNoteEditor`.
3) Replace usage:
   - `apps/admin/app/components/BlogComposer.tsx` → swap `TiptapEditor` for `BlockNoteEditor` with same props.
   - `apps/admin/app/routes/dashboard/editor-playground.tsx` → use `BlockNoteEditor`.
4) Keep a rollback copy: rename `apps/admin/app/components/editor/TiptapEditor.tsx` → `TiptapEditor.backup.tsx` for one release.
5) Dependencies (Phase A) per commands above.
6) Build config: adjust `apps/admin/vite.config.ts` manualChunks to remove Tiptap bucket and (optionally) add BlockNote bucket.

Example (manualChunks):
```ts
// apps/admin/vite.config.ts
manualChunks(id) {
  if (id.includes('node_modules')) {
    if (id.includes('@blocknote')) return 'blocknote'
    if (id.includes('@blackliving/ui')) return 'ui'
    if (id.includes('lucide-react')) return 'icons'
    return 'vendor'
  }
}
```

## 🧪 Test Plan

Unit/Component (Vitest + React Testing Library where applicable):
- Renders with initial `value` and displays placeholder when empty.
- Emits `onChange` with Markdown after formatting actions (Phase A: via HTML→Markdown fallback).
- Respects `disabled` state (read-only).

E2E (Playwright):
- BlogComposer happy path: type formatted content, save, navigate away/back, content persists; preview renders correctly on web site using existing `marked` flow.
- Keyboard shortcuts (bold, italic, lists) work.
- Pasting Markdown produces expected structure.
- Mobile viewport sanity checks for toolbar usability.

Manual checklist:
- [ ] Headings, lists, quote, code block, divider work
- [ ] Markdown fidelity acceptable in web rendering
- [ ] Chinese input and IME composition stable
- [ ] Undo/redo works across formatting

## 📋 Acceptance Criteria

- Admin continues to store and load Markdown strings for posts without API/schema changes.
- `BlogComposer` uses `BlockNoteEditor` with the same props and no UX regressions.
- Web app rendering (`apps/web`) shows no visible differences for equivalent content.
- Tiptap dependencies are removed from admin; `marked`/`turndown` remain only if required for Phase A.
- Build succeeds with updated manual chunks; bundle size does not increase by more than 10% for the admin app.
- Basic E2E scenarios pass in CI.

## 🚀 Rollout & Rollback

Rollout:
- Ship Phase A behind a small feature flag in `BlogComposer` if desired (env or local toggle).
- Monitor admin bundle size and runtime errors.

Rollback:
- Revert imports to `TiptapEditor.backup.tsx`.
- Re-install `@tiptap/*` if removed.
- No data migration needed (Markdown storage invariant).

## ⚠️ Risks & Mitigations

- Markdown fidelity differences between BlockNote export and current web rendering.
  - Mitigation: keep `turndown` fallback in Phase A; verify parity on sample posts.
- Bundle size regression.
  - Mitigation: manualChunks + analyze build; remove unused BlockNote packages.
- Editor behavior differences (IME, copy/paste).
  - Mitigation: targeted E2E + manual QA in zh-TW locale.

## ⏱ Timeline

- Week 1: Implement `BlockNoteEditor`, swap consumers, Phase A conversions, unit tests.
- Week 2: E2E tests, QA, performance check, ship to staging.
- Week 3: Evaluate Phase B (native Markdown import/export). If acceptable, remove `turndown` usage in admin.

## 📚 References

- BlockNote docs (React, Shadcn, Markdown)
- Existing code paths:
  - `apps/admin/app/components/editor/TiptapEditor.tsx`
  - `apps/admin/app/components/BlogComposer.tsx`
  - `apps/admin/app/routes/dashboard/editor-playground.tsx`
  - `apps/admin/vite.config.ts`

