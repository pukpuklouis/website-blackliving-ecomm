import { useState, useEffect, useCallback } from 'react';
import type {
  FullUserProfile,
  ProfileUpdateRequest,
  ApiResponse,
  User,
  UserProfile,
  CustomerProfile,
} from '@blackliving/types';

interface UseProfileOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
  cacheTimeout?: number;
}

interface ProfileState {
  profile: FullUserProfile | null;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

const API_BASE = '/api/customers/profile';

// Simple cache implementation
const profileCache = new Map<string, { data: any; timestamp: number; ttl: number }>();

function getCache<T>(key: string): T | null {
  const cached = profileCache.get(key);
  if (!cached) return null;

  if (Date.now() - cached.timestamp > cached.ttl) {
    profileCache.delete(key);
    return null;
  }

  return cached.data;
}

function setCache<T>(key: string, data: T, ttl: number = 300000): void {
  profileCache.set(key, { data, timestamp: Date.now(), ttl });
}

export function useProfile(options: UseProfileOptions = {}) {
  const {
    autoRefresh = false,
    refreshInterval = 60000, // 1 minute
    cacheTimeout = 300000 // 5 minutes
  } = options;

  const [state, setState] = useState<ProfileState>({
    profile: null,
    loading: false,
    error: null,
    lastUpdated: null
  });

  const [isDirty, setIsDirty] = useState(false);
  const [originalData, setOriginalData] = useState<FullUserProfile | null>(null);

  // Load full profile
  const loadProfile = useCallback(async (force = false) => {
    const cacheKey = 'profile:full';

    if (!force) {
      const cached = getCache<FullUserProfile>(cacheKey);
      if (cached) {
        setState(prev => ({ ...prev, profile: cached }));
        setOriginalData(cached);
        return cached;
      }
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response = await fetch(API_BASE, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: ApiResponse<any> = await response.json();

      if (result.success && result.data) {
        // Transform the flat data structure to the nested FullUserProfile structure
        const [firstName, ...lastName] = (result.data.name || '').split(' ');
        const transformedData: FullUserProfile = {
          user: {
            id: result.data.id,
            email: result.data.email,
            firstName: firstName,
            lastName: lastName.join(' '),
            createdAt: '', // Not available in the response
            updatedAt: '' // Not available in the response
          },
          userProfile: {
            userId: result.data.id,
            avatarUrl: result.data.image,
            bio: '', // Not available in the response
            birthday: result.data.birthday,
            gender: result.data.gender,
            contactPreference: result.data.contactPreference
          },
          customerProfile: {
            customerId: '', // Not available in the response
            userId: result.data.id,
            companyName: '', // Not available in the response
            phone: result.data.phone
          },
          addresses: [] // Not available in the response
        };

        setCache(cacheKey, transformedData, cacheTimeout);
        setState(prev => ({
          ...prev,
          profile: transformedData,
          loading: false,
          lastUpdated: new Date()
        }));
        setOriginalData(transformedData);
        return transformedData;
      } else {
        throw new Error(result.error || 'Failed to load profile');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setState(prev => ({ ...prev, error: errorMessage, loading: false }));
      return null;
    }
  }, [cacheTimeout]);

  // Update profile
  const updateProfile = useCallback(async (updateData: ProfileUpdateRequest) => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const requestBody: Record<string, any> = {};

      if (updateData.firstName !== undefined) requestBody.firstName = updateData.firstName;
      if (updateData.lastName !== undefined) requestBody.lastName = updateData.lastName;
      if (updateData.phone !== undefined) requestBody.phone = updateData.phone;
      if (updateData.birthday !== undefined) requestBody.birthday = updateData.birthday;
      if (updateData.gender !== undefined) requestBody.gender = updateData.gender;
      if (updateData.contactPreference !== undefined) requestBody.contactPreference = updateData.contactPreference;

      const response = await fetch(API_BASE, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: ApiResponse<FullUserProfile> = await response.json();

      if (result.success) {
        // Clear cache to force refresh
        profileCache.delete('profile:full');

        // Reload profile data
        await loadProfile(true);
        setIsDirty(false);

        return { success: true, message: result.message };
      } else {
        throw new Error(result.error || 'Failed to update profile');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setState(prev => ({ ...prev, error: errorMessage, loading: false }));
      return { success: false, error: errorMessage };
    }
  }, [loadProfile]);

  // Check if form data is dirty
  const checkDirty = useCallback((currentData: Partial<ProfileUpdateRequest>) => {
    if (!originalData || !originalData.user || !originalData.userProfile || !originalData.customerProfile) return false;

    const originalFirstName = originalData.user.firstName || '';
    const originalLastName = originalData.user.lastName || '';
    const originalPhone = originalData.customerProfile.phone || '';
    const originalBirthday = originalData.userProfile.birthday || '';
    const originalGender = originalData.userProfile.gender || 'unspecified';
    const originalContactPreference = originalData.userProfile.contactPreference || 'email';

    const dirty =
      (currentData.firstName !== undefined && currentData.firstName !== originalFirstName) ||
      (currentData.lastName !== undefined && currentData.lastName !== originalLastName) ||
      (currentData.phone !== undefined && currentData.phone !== originalPhone && !(currentData.phone === '' && originalPhone === null)) ||
      (currentData.birthday !== undefined && currentData.birthday !== originalBirthday && !(currentData.birthday === '' && originalBirthday === null)) ||
      (currentData.gender !== undefined && currentData.gender !== originalGender) ||
      (currentData.contactPreference !== undefined && currentData.contactPreference !== originalContactPreference);

    setIsDirty(dirty);
    return dirty;
  }, [originalData]);

  // Reset form to original data
  const resetForm = useCallback(() => {
    setIsDirty(false);
    return originalData;
  }, [originalData]);

  // Auto-refresh setup
  useEffect(() => {
    if (autoRefresh && refreshInterval > 0) {
      const interval = setInterval(() => {
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
      setState(prev => ({ ...prev, lastUpdated: null }));
    }
  };
}
