---
description: Fix linting issues in a file using Ultracite/Biome until all errors are resolved
---

# Fix Lint Issues Workflow

This workflow systematically fixes linting issues in TypeScript/JavaScript files using Ultracite (Biome-based linting). It iterates until all fixable issues are resolved.

## Prerequisites
- The target file path must be provided by the user
- Ultracite is configured in the project (`bunx ultracite`)

## Workflow Steps

### Step 1: Run Initial Lint Check
// turbo
```bash
bunx ultracite check <target-file-path>
```

Capture and analyze the output to understand which issues exist.

---

### Step 2: Categorize Issues by Priority

Fix issues in this order (safest to most impactful):

1. **Unused Variables** - Prefix with underscore or remove if truly unused
2. **Style Issues** - `forEach` → `for...of`, interfaces → type aliases, block statements
3. **Accessibility** - Add `htmlFor`/`id` to labels, fix aria attributes
4. **React Patterns** - Leaked renders (`&&` → ternary), nested ternaries → helper functions
5. **Security** - Remove `alert()`, `console.log`, use proper error handling
6. **Complexity** - Extract helper functions to reduce cognitive complexity

---

### Step 3: Apply Fixes Following These Principles

#### 3.1 Unused Variables
```typescript
// Before
} catch (error) {
  // unused error
}

// After - prefix with underscore
} catch (_error) {
  // intentionally unused
}
```

#### 3.2 Replace forEach with for...of
```typescript
// Before
items.forEach((item) => {
  doSomething(item);
});

// After
for (const item of items) {
  doSomething(item);
}
```

#### 3.3 Convert Interfaces to Type Aliases
```typescript
// Before
interface Props {
  name: string;
}

// After
type Props = {
  name: string;
};
```

#### 3.4 Add Block Statements to Early Returns
```typescript
// Before
if (condition) return null;

// After
if (condition) {
  return null;
}
```

#### 3.5 Fix Label Accessibility
```typescript
// Before
<label>Name</label>
<input type="text" />

// After
<label htmlFor="name-input">Name</label>
<input id="name-input" type="text" />
```

#### 3.6 Fix Leaked Render Values (React)
```typescript
// Before - dangerous if value can be 0, '', or NaN
{value && <Component />}

// After - explicit boolean check
{value ? <Component /> : null}

// Or for numbers/strings that could be falsy
{value !== null && value !== undefined ? <Component /> : null}
```

#### 3.7 Eliminate Nested Ternaries
```typescript
// Before
{isLoading ? "Loading..." : hasError ? "Error" : "Success"}

// After - extract to IIFE or helper function
{(() => {
  if (isLoading) return "Loading...";
  if (hasError) return "Error";
  return "Success";
})()}
```

#### 3.8 Replace alert() with Proper Error Handling
```typescript
// Before
alert(error.message);

// After - use state-based error display
setErrors({ general: error.message });
// Then render: {errors.general && <ErrorMessage>{errors.general}</ErrorMessage>}
```

#### 3.9 Add Radix to parseInt
```typescript
// Before
Number.parseInt(value)

// After
Number.parseInt(value, 10)
```

#### 3.10 Reduce Cognitive Complexity
Extract helper functions when complexity exceeds 15:
- Error handling logic → `handleError()`
- Search/filter logic → `findItem()`
- Validation logic → `validateInput()`

---

### Step 4: Re-run Lint Check
// turbo
```bash
bunx ultracite check <target-file-path>
```

If errors remain, return to Step 2 and continue fixing.

---

### Step 5: Handle Special Cases

#### Filename Convention Warnings
If `useFilenamingConvention` is triggered:
1. Ask user if they want to rename the file to kebab-case
2. If yes, rename file and update all imports
3. If no, this warning can be ignored (project convention choice)

#### Complex Type Errors
If facing complex generic type issues:
1. Avoid using `any` - prefer `unknown`
2. Use type assertions sparingly and only when necessary
3. Consider extracting complex types to a separate types file

---

## Safeguards

> [!CAUTION]
> **Never auto-fix these without review:**
> - Removing "unused" parameters that may be required by interfaces
> - Changing function signatures that are part of public APIs
> - Renaming files (may break imports across the codebase)

> [!WARNING]
> **Always verify after fixing:**
> - Run the dev server to ensure no runtime errors
> - Check that the component still renders correctly
> - Ensure no TypeScript compilation errors

> [!TIP]
> **Quick fix commands:**
> - `bunx ultracite fix <file>` - Auto-fix safe issues
> - `bunx ultracite check <file>` - Check for issues
> - `bunx ultracite doctor` - Diagnose configuration

---

## Completion Criteria

The workflow is complete when:
1. `bunx ultracite check <file>` returns 0 errors, OR
2. Only intentionally ignored warnings remain (e.g., filename convention by project choice)
