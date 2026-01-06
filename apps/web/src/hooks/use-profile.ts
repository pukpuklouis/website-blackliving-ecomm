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

const profileCache = new Map<
  string,
  { data: unknown; timestamp: number; ttl: number }
>();

function getCache<T>(key: string): T | null {
  const cached = profileCache.get(key);
  if (!cached) {
    return null;
  }

  if (Date.now() - cached.timestamp > cached.ttl) {
    profileCache.delete(key);
    return null;
  }

  return cached.data as T;
}

function setCache<T>(key: string, data: T, ttl = 300_000): void {
  profileCache.set(key, { data, timestamp: Date.now(), ttl });
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

  return {
    user: {
      id: data.id,
      email: data.email,
      firstName,
      lastName: lastName.join(" "),
      createdAt: "", // Not available in the response
      updatedAt: "", // Not available in the response
    },
    userProfile: {
      userId: data.id,
      avatarUrl: data.image ?? undefined,
      bio: "", // Not available in the response
      birthday: data.birthday ?? undefined,
      gender:
        (data.gender as "male" | "female" | "other" | "unspecified") ??
        undefined,
      contactPreference:
        (data.contactPreference as "email" | "phone" | "sms") ?? undefined,
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
    cacheTimeout = 300_000, // 5 minutes
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
  const loadProfile = useCallback(
    async (force = false) => {
      const cacheKey = "profile:full";

      if (!force) {
        const cached = getCache<FullUserProfile>(cacheKey);
        if (cached) {
          setState((prev) => ({ ...prev, profile: cached }));
          setOriginalData(cached);
          return cached;
        }
      }

      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const apiData = await fetchProfileFromApi();
        const transformedData = transformApiResponseToProfile(apiData);

        setCache(cacheKey, transformedData, cacheTimeout);
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
    },
    [cacheTimeout]
  );

  // Update profile
  const updateProfile = useCallback(
    async (updateData: ProfileUpdateRequest) => {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const allowedFields = [
          "firstName",
          "lastName",
          "phone",
          "birthday",
          "gender",
          "contactPreference",
        ] as const;

        const requestBody: Record<string, unknown> = {};
        for (const field of allowedFields) {
          if (updateData[field] !== undefined) {
            requestBody[field] = updateData[field];
          }
        }

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
          // Clear cache to force refresh
          profileCache.delete("profile:full");

          // Reload profile data
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
    clearCache: () => {
      profileCache.clear();
      setState((prev) => ({ ...prev, lastUpdated: null }));
    },
  };
}
