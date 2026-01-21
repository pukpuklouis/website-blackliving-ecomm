# Account Settings Implementation Plan

**Date:** 2026-01-21
**Status:** Final - After Type Verification
**Component:** AdminNavUser + AuthContext + Settings Route

---

## Overview

Enable the "帳戶設定" (Account Settings) navigation by connecting Better Auth's built-in user management methods to the existing AuthContext.

---

## Current State Analysis

### What Exists

| Component | File | Status |
|-----------|------|--------|
| **Better Auth** | `packages/auth/package.json` | ✅ v1.3.4 installed |
| **Auth Client** | `packages/auth/client.ts` | ✅ `authClient` exported |
| **AuthContext** | `apps/admin/app/contexts/AuthContext.tsx` | ⚠️ Missing updateProfile/changePassword |
| **Settings Route** | `apps/admin/app/routes/admin.settings.tsx` | ⚠️ Created, needs type fix |
| **AdminNavUser** | `apps/admin/app/components/AdminNavUser.tsx` | ❌ No onClick handler |
| **PasswordModal** | `apps/web/src/components/profile/PasswordModal.tsx` | ✅ UX reference exists |

### Better Auth Actual Return Type (Verified)

```typescript
// From node_modules/better-auth/dist/client/index.d.ts
// Better Auth uses @better-fetch/fetch standard response:

type BetterAuthResponse<T> = {
  data?: T;                    // Success: contains response data
  error: {
    message?: string;          // Error message
    status: number;            // HTTP status code
    statusText: string;        // HTTP status text
  } | null
}
```

### Existing Usage Pattern (from PasswordModal.tsx)

```tsx
// apps/web/src/components/profile/PasswordModal.tsx:210-220
const result = await authClient.changePassword({
  currentPassword: formData.currentPassword,
  newPassword: formData.newPassword,
});

if (result.error) {
  const errorMsg = result.error.message || "密碼更新失敗";
  // handle error
}
```

---

## Problem Statement

1. **Navigation:** The "帳戶設定" menu item has no click handler
2. **AuthContext:** Missing `updateProfile` and `changePassword` methods
3. **Type Mismatch:** `admin.settings.tsx` expects `{ success, error? }` but Better Auth returns `{ data?, error }`
4. **UX:** Settings page lacks password strength indicator (exists in PasswordModal)

---

## Solution Summary

Wrap Better Auth methods in AuthContext with correct types, update settings page to match Better Auth response format, and reference existing PasswordModal UX.

---

## Changes Required

### 1. Modify: `AuthContext.tsx`

**File:** `apps/admin/app/contexts/AuthContext.tsx`

**Add imports:**

```tsx
// Add to existing imports (line ~5):
import { authClient } from "@blackliving/auth/client";
import type { BetterFetchError } from "@better-fetch/fetch";
```

**Update AuthContextType interface (add after line ~30):**

```tsx
interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  loginWithGoogle: () => Promise<boolean>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  // NEW - Return Better Auth's actual type:
  updateProfile: (data: { name?: string; email?: string }) => Promise<{
    data?: { user: User };
    error: BetterFetchError | null;
  }>;
  changePassword: (data: {
    currentPassword: string;
    newPassword: string;
  }) => Promise<{
    data?: unknown;
    error: BetterFetchError | null;
  }>;
}
```

**Add updateProfile function (after logout function, line ~137):**

```tsx
const updateProfile = async (
  data: { name?: string; email?: string }
): Promise<{ data?: { user: User }; error: BetterFetchError | null }> => {
  try {
    const response = await authClient.updateUser(data);

    // Better Auth already returns correct shape
    // Refresh user data after successful update
    if (!response.error) {
      await checkAuth();
    }

    return response;
  } catch (error) {
    console.error("Profile update failed:", error);
    return {
      data: undefined,
      error: {
        message: "更新失敗，請重試",
        status: 500,
        statusText: "Internal Error",
      },
    };
  }
};
```

**Add changePassword function (after updateProfile):**

```tsx
const changePassword = async (
  data: { currentPassword: string; newPassword: string }
): Promise<{ data?: unknown; error: BetterFetchError | null }> => {
  try {
    const response = await authClient.changePassword({
      currentPassword: data.currentPassword,
      newPassword: data.newPassword,
      revokeAllSessions: true, // Security: revoke other sessions
    });

    return response;
  } catch (error) {
    console.error("Password change failed:", error);
    return {
      data: undefined,
      error: {
        message: "密碼更改失敗，請重試",
        status: 500,
        statusText: "Internal Error",
      },
    };
  }
};
```

**Update context value (line ~142):**

```tsx
const value: AuthContextType = {
  user,
  loading,
  login,
  loginWithGoogle,
  logout,
  checkAuth,
  updateProfile,    // NEW
  changePassword,   // NEW
};
```

---

### 2. Modify: `AdminNavUser.tsx`

**File:** `apps/admin/app/components/AdminNavUser.tsx`

**Add navigation handler:**

```tsx
// Add after handleLogout function:

const handleAccountSettings = () => {
  navigate("/admin/settings");
};
```

**Update the "帳戶設定" DropdownMenuItem:**

```tsx
// Find this DropdownMenuItem and add onClick:
<DropdownMenuItem onClick={handleAccountSettings}>
  <User className="mr-2 h-4 w-4" />
  帳戶設定
</DropdownMenuItem>
```

---

### 3. Update: `admin.settings.tsx`

**File:** `apps/admin/app/routes/admin.settings.tsx`

**Update the component to match Better Auth response types:**

```tsx
// Update handleProfileUpdate:
const handleProfileUpdate = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);

  const result = await updateProfile({
    name: formData.name,
    email: formData.email,
  });

  setLoading(false);

  if (result.error) {
    // Use error.status for better error handling
    const userMessage = getUserFriendlyErrorMessage(result.error);
    setMessage({ type: 'error', text: userMessage });
    return;
  }

  // Success - result.data.user contains updated user
  if (result.data?.user) {
    setMessage({ type: 'success', text: '個人資料已更新' });
    setIsEditing(false);
  }
};

// Update handlePasswordChange:
const handlePasswordChange = async (e: React.FormEvent) => {
  e.preventDefault();

  if (formData.newPassword !== formData.confirmPassword) {
    setMessage({ type: 'error', text: '新密碼不一致' });
    return;
  }

  setLoading(true);

  const result = await changePassword({
    currentPassword: formData.currentPassword,
    newPassword: formData.newPassword,
  });

  setLoading(false);

  if (result.error) {
    const userMessage = getPasswordErrorMessage(result.error);
    setMessage({ type: 'error', text: userMessage });
    return;
  }

  // Success - warn user about being logged out
  setMessage({
    type: 'success',
    text: '密碼已更改，即將重新登入...'
  });

  // Delay to show message, then logout
  setTimeout(async () => {
    await logout();
    navigate('/admin/login');
  }, 2000);
};

// Helper function for profile errors:
function getUserFriendlyErrorMessage(error: BetterFetchError): string {
  switch (error.status) {
    case 409:
      return "此電子郵箱已被使用";
    case 400:
      return "請檢查輸入的資料格式";
    case 401:
      return "未授權的操作";
    default:
      return error.message || "更新失敗，請重試";
  }
}

// Helper function for password errors:
function getPasswordErrorMessage(error: BetterFetchError): string {
  switch (error.status) {
    case 401:
      return "目前密碼錯誤";
    case 400:
      return "密碼強度不足，請使用更強的密碼";
    default:
      return error.message || "密碼更改失敗，請重試";
  }
}
```

**Optional: Add Password Strength Indicator**

Reference `apps/web/src/components/profile/PasswordModal.tsx` for the password strength UI pattern including:
- Strength meter bar (弱/中等/強/非常強)
- Visual rules checklist
- Real-time validation feedback

---

## Error Handling Reference (Updated)

Based on Better Auth's `error.status`:

| HTTP Status | User Message (zh-TW) | Error Condition |
|-------------|---------------------|-----------------|
| 401 | "目前密碼錯誤" | Invalid current password |
| 400 | "密碼強度不足" | Weak password |
| 409 | "此電子郵箱已被使用" | Email already exists |
| 403 | "未授權的操作" | Unauthorized |
| 500+ | "網路連線失敗，請重試" | Network/server error |

---

## Implementation Sequence

### Step 1: Update AuthContext
- Add `updateProfile` and `changePassword` functions
- Return Better Auth's actual response type (don't transform)
- Update `AuthContextType` interface

### Step 2: Update AdminNavUser
- Add `handleAccountSettings` navigation handler
- Wire to "帳戶設定" menu item

### Step 3: Update Settings Route
- Modify `admin.settings.tsx` to handle Better Auth response format
- Use `error.status` instead of string matching
- Add logout flow after password change
- (Optional) Add password strength indicator

### Step 4: Test Complete Flow
- Navigation: Click "帳戶設定" → page loads
- Profile update: Edit name/email → submit → verify update
- Password change: Enter passwords → submit → verify logout happens
- Error handling: Test with invalid current password (401)
- Form validation: Test password mismatch (before API call)

---

## Files to Modify

| File | Action | Lines Changed |
|------|--------|---------------|
| `apps/admin/app/contexts/AuthContext.tsx` | Add methods + correct types | ~60 lines |
| `apps/admin/app/components/AdminNavUser.tsx` | Add navigation handler | ~5 lines |
| `apps/admin/app/routes/admin.settings.tsx` | Fix response type handling | ~40 lines |

---

## UX Reference

**Password Strength UI** already implemented in:
```
apps/web/src/components/profile/PasswordModal.tsx
```

Features to reference:
- PasswordStrengthIndicator component (lines 115-154)
- Real-time validation feedback
- Visual rules checklist
- Security tips Alert

---

## Success Criteria

| Criteria | Verification |
|----------|--------------|
| Navigation works | Click "帳戶設定" → `/admin/settings` loads |
| Profile updates | Edit name/email → saves → reflects in UI |
| Password changes | Enter valid passwords → saves → logout happens |
| Error messages | Invalid password (401) shows "目前密碼錯誤" |
| Status-based errors | 409 shows "此電子郵箱已被使用" |
| Form validation | Password mismatch shows error before API call |
| User notification | Password change shows "即將重新登入..." |

---

## Approval Required

Before proceeding with implementation, please confirm:

1. **Approve this plan** - Implement all changes as described
2. **Request modifications** - Specify what to change
3. **Direct implementation** - Proceed with coding immediately

Which option would you like?
