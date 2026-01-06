---
description: How to create a custom block in BlockNote
---

# Create a Custom Block in BlockNote

This guide explains how to create custom block types for your BlockNote editor using React components.

## Prerequisites

-   `@blocknote/core`
-   `@blocknote/react`
-   Access to `createReactBlockSpec`

## Steps

### 1. Define the Block Config (`CustomBlockConfig`)

The Block Config describes the shape of your custom blocks, including its type, properties (props), and content type.

```typescript
type BlockConfig = {
  type: string;
  content: "inline" | "none";
  readonly propSchema: PropSchema;
};
```

-   **`type`**: The identifier for your block (e.g., "alert").
-   **`content`**: `"inline"` for rich text support, `"none"` otherwise.
-   **`propSchema`**: Defines the properties your block supports.

**Example:**

```typescript
{
  type: "alert",
  propSchema: {
    textAlignment: defaultProps.textAlignment,
    textColor: defaultProps.textColor,
    type: {
      default: "warning",
      values: ["warning", "error", "info", "success"],
    },
  },
  content: "inline",
}
```

### 2. Define the Block Implementation (`ReactCustomBlockImplementation`)

This defines how the block is rendered and parsed.

```typescript
type ReactCustomBlockImplementation = {
  render: React.FC<any>; // Component to render
  toExternalHTML?: React.FC<any>; // Optional: for clipboard/export
  parse?: (element: HTMLElement) => PartialBlock["props"] | undefined; // Optional: for parsing HTML
  // ... other meta options
};
```

**`render` Props:**
-   `block`: The block data.
-   `editor`: The BlockNote editor instance.
-   `contentRef`: Ref to mark the editable element (if `content: "inline"`).

**Example:**

```typescript
{
  render: ({ block, editor, contentRef }) => {
    const style = {
      backgroundColor: block.props.type === 'error' ? 'red' : 'yellow',
      /* ... other styles based on props */
    };
    return (
      <div style={style} ref={contentRef}>
         {/* Content goes here */}
      </div>
    );
  },
}
```

### 3. Create the Block Spec

Use `createReactBlockSpec` to combine the config and implementation.

```typescript
import { createReactBlockSpec } from "@blocknote/react";

const createAlert = createReactBlockSpec(
  {
    type: "alert",
    propSchema: { ... }, // Your config from Step 1
    content: "inline",
  },
  {
    render: (props) => { ... }, // Your implementation from Step 2
  }
);
```

### 4. Add Custom Blocks to the Editor Schema

Create a `BlockNoteSchema` that includes your custom block. **Important**: In React, use `useMemo` to ensure the schema is stable and not recreated on every render.

```typescript
import { useMemo } from "react";
import { BlockNoteSchema, defaultBlockSpecs } from "@blocknote/core";

// Inside your component:
const schema = useMemo(() => {
  return BlockNoteSchema.create({
    blockSpecs: {
      // Enable default blocks
      ...defaultBlockSpecs,
      // Add your custom block (note the function call)
      alert: createAlert(),
    },
  });
}, []);
```

### 5. Instantiate the Editor

Pass the custom schema to your BlockNote editor instance.

```typescript
import { useCreateBlockNote } from "@blocknote/react";

const editor = useCreateBlockNote({
  schema: schema,
});
```

### 6. Add to Slash Menu (Optional)

To make your block accessible via the slash menu (`/`), add an item that inserts the block. **Note**: Use `replaceBlocks` to replace the empty slash command block with your custom block.

```typescript
import { filterSuggestionItems } from "@blocknote/react";

const insertAlertItem = (editor) => ({
  title: "Alert",
  onItemClick: () => {
    const currentBlock = editor.getTextCursorPosition().block;
    // Replace the current empty block with the alert block
    editor.replaceBlocks([currentBlock], [{ type: "alert", props: {} }]);
  },
  aliases: ["alert", "notice"],
  group: "Formatting",
  icon: <div />, // Replace with your icon
});
```


## Advanced: Block Config Options

You can make your block config customizable by passing functions instead of objects to `createReactBlockSpec`.

```typescript
const createCustomBlock = createReactBlockSpec(
  createBlockConfig((options: MyOptions) => ({ ... })),
  (options: MyOptions) => ({ render: ... })
);

// Usage
const schema = BlockNoteSchema.create({
  blockSpecs: {
    customBlock: createCustomBlock({ myOption: "value" }),
  },
});
```
