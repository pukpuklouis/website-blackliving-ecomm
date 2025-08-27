/**
 * Profile management hook
 * Centralized state management for user profile data with caching and synchronization
 */

import { useState, useEffect, useCallback } from 'react';
import type { 
  BasicProfile, 
  ExtendedProfile, 
  ProfileAnalytics, 
  ProfileUpdateRequest,
  ProfileApiResponse,
  FullProfileApiResponse,
  AnalyticsApiResponse
} from '@blackliving/types/profile';

interface UseProfileOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
  cacheTimeout?: number;
}

interface ProfileState {
  profile: BasicProfile | null;
  fullProfile: ExtendedProfile | null;
  analytics: ProfileAnalytics | null;
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
    fullProfile: null,
    analytics: null,
    loading: false,
    error: null,
    lastUpdated: null
  });

  const [isDirty, setIsDirty] = useState(false);
  const [originalData, setOriginalData] = useState<BasicProfile | null>(null);

  // Load basic profile
  const loadProfile = useCallback(async (force = false) => {
    const cacheKey = 'profile:basic';
    
    if (!force) {
      const cached = getCache<BasicProfile>(cacheKey);
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

      const result: ProfileApiResponse = await response.json();
      
      if (result.success && result.data) {
        setCache(cacheKey, result.data, cacheTimeout);
        setState(prev => ({ 
          ...prev, 
          profile: result.data!, 
          loading: false,
          lastUpdated: new Date()
        }));
        setOriginalData(result.data);
        return result.data;
      } else {
        throw new Error(result.error || 'Failed to load profile');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setState(prev => ({ ...prev, error: errorMessage, loading: false }));
      return null;
    }
  }, [cacheTimeout]);

  // Load full profile with analytics
  const loadFullProfile = useCallback(async (force = false) => {
    const cacheKey = 'profile:full';
    
    if (!force) {
      const cached = getCache<ExtendedProfile>(cacheKey);
      if (cached) {
        setState(prev => ({ ...prev, fullProfile: cached }));
        return cached;
      }
    }

    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const response = await fetch(`${API_BASE}/full`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: FullProfileApiResponse = await response.json();
      
      if (result.success && result.data) {
        setCache(cacheKey, result.data, cacheTimeout);
        setState(prev => ({ 
          ...prev, 
          fullProfile: result.data!, 
          loading: false,
          lastUpdated: new Date()
        }));
        return result.data;
      } else {
        throw new Error(result.error || 'Failed to load full profile');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setState(prev => ({ ...prev, error: errorMessage, loading: false }));
      return null;
    }
  }, [cacheTimeout]);

  // Load analytics
  const loadAnalytics = useCallback(async (force = false) => {
    const cacheKey = 'profile:analytics';
    
    if (!force) {
      const cached = getCache<ProfileAnalytics>(cacheKey);
      if (cached) {
        setState(prev => ({ ...prev, analytics: cached }));
        return cached;
      }
    }

    try {
      const response = await fetch(`${API_BASE}/analytics`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: AnalyticsApiResponse = await response.json();
      
      if (result.success && result.data) {
        setCache(cacheKey, result.data, cacheTimeout);
        setState(prev => ({ 
          ...prev, 
          analytics: result.data!, 
          lastUpdated: new Date()
        }));
        return result.data;
      } else {
        throw new Error(result.error || 'Failed to load analytics');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setState(prev => ({ ...prev, error: errorMessage }));
      return null;
    }
  }, [cacheTimeout]);

  // Update profile
  const updateProfile = useCallback(async (updateData: ProfileUpdateRequest) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const response = await fetch(API_BASE, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: ProfileApiResponse = await response.json();
      
      if (result.success) {
        // Clear cache to force refresh
        profileCache.delete('profile:basic');
        profileCache.delete('profile:full');
        profileCache.delete('profile:analytics');
        
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
  const checkDirty = useCallback((currentData: Partial<BasicProfile>) => {
    if (!originalData) return false;
    
    const dirty = Object.keys(currentData).some(key => {
      const currentValue = currentData[key as keyof BasicProfile];
      const originalValue = originalData[key as keyof BasicProfile];
      return currentValue !== originalValue && !(currentValue === '' && originalValue === null);
    });
    
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
    loadFullProfile,
    loadAnalytics,
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