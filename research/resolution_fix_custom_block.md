# Resolution Report: BlockNote "Cannot find node position"

## Problem

Custom `ImageLinkBlock` crashed with `Error: Cannot find node position` when loading pages with existing image blocks.

## Root Cause

The error occurred in **BlockNote's internal `ReactNodeViewRenderer`** when using `createReactBlockSpec`:

```
Error: Cannot find node position

    at ReactNodeViewRenderer.className (chunk-FRHJINFY.js:7580)
```

**Why this happened:**

1. `createReactBlockSpec` wraps your component in `ReactNodeViewRenderer`
2. `ReactNodeViewRenderer` calls `getBlockFromPos()` to get the block's position in ProseMirror
3. During initial render or when loading `initialContent`, the position lookup fails because the node isn't fully indexed yet
4. This happens **before** your component code runs, so defensive checks inside the component are useless

## Solution: Switch to `createBlockSpec`

Changed from:

```
import { createReactBlockSpec } from "@blocknote/react";

export const ImageLinkBlock = createReactBlockSpec(...)
```

To:

```
import { createBlockSpec } from "@blocknote/core";

export const ImageLinkBlock = createBlockSpec(...)
```

**Why this works:**

- `createBlockSpec` uses **vanilla DOM** rendering, not React
- It bypasses `ReactNodeViewRenderer` entirely
- No position lookup during render cycle
- Returns `{ dom: wrapper }` directly to ProseMirror
- ProseMirror handles the DOM lifecycle, not React

## Key Differences

| Aspect            | `createReactBlockSpec` | `createBlockSpec`      |
| :---------------- | :--------------------- | :--------------------- |
| Rendering         | React component        | Vanilla DOM            |
| Position tracking | Required (crashes)     | Not required           |
| Return format     | JSX Element            | `{ dom: HTMLElement }` |
| Render signature  | ({ block, editor }) => | (block, editor) =>     |
| Best for          | Simple blocks          | Complex/custom blocks  |

## Full Implementation

See: 

ImageLinkBlock.tsx



## Lesson Learned

When custom BlockNote blocks crash with position-related errors, **switch from React-based to DOM-based rendering** using `createBlockSpec`. This is the same pattern BlockNote uses internally for its `Code` block.