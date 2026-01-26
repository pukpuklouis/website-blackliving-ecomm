import type {
  ApiResponse,
  FullUserProfile,
  ProfileUpdateRequest,
} from "@blackliving/types";
import { useCallback, useEffect, useState } from "react";
import { getApiUrl } from "../lib/api";

type UseProfileOptions = {
  autoRefresh?: boolean;
  refreshInterval?: number;
  cacheTimeout?: number;
};

type ProfileState = {
  profile: FullUserProfile | null;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
};

const PROFILE_ENDPOINT = "/api/customers/profile";

// Note: Caching is handled at the API layer using Cloudflare KV (cacheMiddleware)
// No client-side Map caching needed to avoid dual-cache inconsistency

// Valid gender values for type-safe validation
const VALID_GENDERS = ["male", "female", "other", "unspecified"] as const;
const VALID_CONTACT_PREFERENCES = ["email", "phone", "sms"] as const;

// Allowed fields for profile update
const ALLOWED_UPDATE_FIELDS = [
  "phone",
  "birthday",
  "gender",
  "contactPreference",
] as const;

/**
 * Build request body for profile update API
 * Extracted to reduce cognitive complexity of updateProfile
 */
function buildRequestBody(
  updateData: ProfileUpdateRequest
): Record<string, unknown> | null {
  const requestBody: Record<string, unknown> = {};

  // Combine firstName and lastName into 'name' for API
  if (updateData.firstName !== undefined || updateData.lastName !== undefined) {
    const firstName = updateData.firstName ?? "";
    const lastName = updateData.lastName ?? "";
    const combinedName = `${firstName} ${lastName}`.trim();
    if (combinedName) {
      requestBody.name = combinedName;
    }
  }

  // Add allowed fields
  for (const field of ALLOWED_UPDATE_FIELDS) {
    if (updateData[field] !== undefined) {
      requestBody[field] = updateData[field];
    }
  }

  // Return null if nothing to update
  if (Object.keys(requestBody).length === 0) {
    return null;
  }

  return requestBody;
}

function transformApiResponseToProfile(data: {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  phone: string | null;
  birthday: string | null;
  gender: string | null;
  contactPreference: string | null;
}): FullUserProfile {
  const [firstName, ...lastName] = (data.name || "").split(" ");

  // Type-safe gender validation
  const gender = VALID_GENDERS.includes(
    data.gender as (typeof VALID_GENDERS)[number]
  )
    ? (data.gender as (typeof VALID_GENDERS)[number])
    : undefined;

  // Type-safe contactPreference validation
  const contactPreference = VALID_CONTACT_PREFERENCES.includes(
    data.contactPreference as (typeof VALID_CONTACT_PREFERENCES)[number]
  )
    ? (data.contactPreference as (typeof VALID_CONTACT_PREFERENCES)[number])
    : undefined;

  return {
    user: {
      id: data.id,
      email: data.email,
      firstName,
      lastName: lastName.join(" "),
      role: "customer", // Default role for profile API
      createdAt: "", // Not available in the response
      updatedAt: "", // Not available in the response
    },
    userProfile: {
      userId: data.id,
      avatarUrl: data.image ?? undefined,
      bio: "", // Not available in the response
      birthday: data.birthday ?? undefined,
      gender,
      contactPreference,
    },
    customerProfile: {
      customerId: "", // Not available in the response
      userId: data.id,
      companyName: "", // Not available in the response
      phone: data.phone ?? undefined,
    },
    addresses: [], // Not available in the response
  };
}

async function fetchProfileFromApi(): Promise<{
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  phone: string | null;
  birthday: string | null;
  gender: string | null;
  contactPreference: string | null;
}> {
  const response = await fetch(getApiUrl(PROFILE_ENDPOINT), {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const result: ApiResponse<{
    id: string;
    email: string;
    name: string | null;
    image: string | null;
    phone: string | null;
    birthday: string | null;
    gender: string | null;
    contactPreference: string | null;
  }> = await response.json();

  if (result.success && result.data) {
    return result.data;
  }

  throw new Error(result.error || "Failed to load profile");
}

export function useProfile(options: UseProfileOptions = {}) {
  const {
    autoRefresh = false,
    refreshInterval = 60_000, // 1 minute
    // cacheTimeout removed - caching is handled at API layer
  } = options;

  const [state, setState] = useState<ProfileState>({
    profile: null,
    loading: false,
    error: null,
    lastUpdated: null,
  });

  const [isDirty, setIsDirty] = useState(false);
  const [originalData, setOriginalData] = useState<FullUserProfile | null>(
    null
  );

  // Load full profile
  const loadProfile = useCallback(async (_force = false) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const apiData = await fetchProfileFromApi();
      const transformedData = transformApiResponseToProfile(apiData);

      setState((prev) => ({
        ...prev,
        profile: transformedData,
        loading: false,
        lastUpdated: new Date(),
      }));
      setOriginalData(transformedData);
      return transformedData;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      setState((prev) => ({ ...prev, error: errorMessage, loading: false }));
      return null;
    }
  }, []);

  // Update profile
  const updateProfile = useCallback(
    async (updateData: ProfileUpdateRequest) => {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const requestBody = buildRequestBody(updateData);

        // Fail early if nothing to update
        if (!requestBody) {
          console.log("[useProfile] requestBody is empty, failing early");
          setState((prev) => ({ ...prev, loading: false }));
          return { success: false, error: "沒有任何資料需要更新" };
        }

        console.log(
          "[useProfile] Sending PATCH request with body:",
          requestBody
        );

        const response = await fetch(getApiUrl(PROFILE_ENDPOINT), {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody),
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result: ApiResponse<FullUserProfile> = await response.json();

        if (result.success) {
          // Reload profile data from server (API cache will be cleared by backend)
          await loadProfile(true);
          setIsDirty(false);
          return { success: true, message: result.message };
        }

        throw new Error(result.error || "Failed to update profile");
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        setState((prev) => ({ ...prev, error: errorMessage, loading: false }));
        return { success: false, error: errorMessage };
      }
    },
    [loadProfile]
  );

  // Check if form data is dirty
  const checkDirty = useCallback(
    (currentData: Partial<ProfileUpdateRequest>) => {
      if (
        !(
          originalData?.user &&
          originalData.userProfile &&
          originalData.customerProfile
        )
      ) {
        return false;
      }

      const hasFieldChanged = <T>(
        current: T | undefined,
        original: T | null | undefined,
        defaultValue: T
      ): boolean => {
        if (current === undefined) {
          return false;
        }
        const normalizedOriginal = original ?? defaultValue;
        // Handle empty string vs null equivalence
        if (current === "" && original === null) {
          return false;
        }
        return current !== normalizedOriginal;
      };

      const dirty =
        hasFieldChanged(
          currentData.firstName,
          originalData.user.firstName,
          ""
        ) ||
        hasFieldChanged(currentData.lastName, originalData.user.lastName, "") ||
        hasFieldChanged(
          currentData.phone,
          originalData.customerProfile.phone,
          ""
        ) ||
        hasFieldChanged(
          currentData.birthday,
          originalData.userProfile.birthday,
          ""
        ) ||
        hasFieldChanged(
          currentData.gender,
          originalData.userProfile.gender,
          "unspecified"
        ) ||
        hasFieldChanged(
          currentData.contactPreference,
          originalData.userProfile.contactPreference,
          "email"
        );

      setIsDirty(dirty);
      return dirty;
    },
    [originalData]
  );

  // Reset form to original data
  const resetForm = useCallback(() => {
    setIsDirty(false);
    return originalData;
  }, [originalData]);

  // Auto-refresh setup
  useEffect(() => {
    if (autoRefresh && refreshInterval > 0) {
      const interval = window.setInterval(() => {
        loadProfile(true);
      }, refreshInterval);

      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval, loadProfile]);

  // Initial load
  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  return {
    // State
    ...state,
    isDirty,

    // Actions
    loadProfile,
    updateProfile,
    checkDirty,
    resetForm,

    // Utilities
    refresh: () => loadProfile(true),
  };
}
