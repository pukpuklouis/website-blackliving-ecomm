/**
 * Address management hook
 * Handles CRUD operations for customer addresses with caching
 */

import { useState, useCallback, useEffect } from 'react';
import type {
  CustomerAddress,
  AddressCreateRequest,
  AddressUpdateRequest,
  AddressesApiResponse,
  AddressApiResponse,
} from '@blackliving/types/profile';

interface UseAddressesOptions {
  autoLoad?: boolean;
  cacheTimeout?: number;
}

interface AddressesState {
  addresses: CustomerAddress[];
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

const API_BASE = '/api/customers/profile/addresses';

export function useAddresses(options: UseAddressesOptions = {}) {
  const {
    autoLoad = true,
    cacheTimeout = 180000, // 3 minutes
  } = options;

  const [state, setState] = useState<AddressesState>({
    addresses: [],
    loading: false,
    error: null,
    lastUpdated: null,
  });

  // Load all addresses
  const loadAddresses = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response = await fetch(API_BASE, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      const result: AddressesApiResponse = await response.json();

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      if (result.success && result.data) {
        setState(prev => ({
          ...prev,
          addresses: result.data!,
          loading: false,
          lastUpdated: new Date(),
        }));
        return result.data;
      } else {
        throw new Error(result.error || 'Failed to load addresses');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('[useAddresses] Error loading addresses:', errorMessage);
      setState(prev => ({ ...prev, error: errorMessage, loading: false }));
      return null;
    }
  }, []);

  // Create new address
  const createAddress = useCallback(async (addressData: AddressCreateRequest) => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addressData),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: AddressApiResponse = await response.json();

      if (result.success && result.data) {
        // Add new address to state
        setState(prev => ({
          ...prev,
          addresses: [...prev.addresses, result.data!],
          loading: false,
          lastUpdated: new Date(),
        }));

        return { success: true, data: result.data, message: result.message };
      } else {
        throw new Error(result.error || 'Failed to create address');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setState(prev => ({ ...prev, error: errorMessage, loading: false }));
      return { success: false, error: errorMessage };
    }
  }, []);

  // Update existing address
  const updateAddress = useCallback(async (addressId: string, updateData: AddressUpdateRequest) => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response = await fetch(`${API_BASE}/${addressId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: AddressApiResponse = await response.json();

      if (result.success && result.data) {
        // Update address in state
        setState(prev => ({
          ...prev,
          addresses: prev.addresses.map(addr => (addr.id === addressId ? result.data! : addr)),
          loading: false,
          lastUpdated: new Date(),
        }));

        return { success: true, data: result.data, message: result.message };
      } else {
        throw new Error(result.error || 'Failed to update address');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setState(prev => ({ ...prev, error: errorMessage, loading: false }));
      return { success: false, error: errorMessage };
    }
  }, []);

  // Delete address
  const deleteAddress = useCallback(async (addressId: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response = await fetch(`${API_BASE}/${addressId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        // Remove address from state
        setState(prev => ({
          ...prev,
          addresses: prev.addresses.filter(addr => addr.id !== addressId),
          loading: false,
          lastUpdated: new Date(),
        }));

        return { success: true, message: result.message };
      } else {
        throw new Error(result.error || 'Failed to delete address');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setState(prev => ({ ...prev, error: errorMessage, loading: false }));
      return { success: false, error: errorMessage };
    }
  }, []);

  // Set address as default
  const setDefaultAddress = useCallback(async (addressId: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response = await fetch(`${API_BASE}/${addressId}/default`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: AddressApiResponse = await response.json();

      if (result.success && result.data) {
        // Update addresses: set the selected as default, others as not default
        setState(prev => ({
          ...prev,
          addresses: prev.addresses.map(addr => ({
            ...addr,
            isDefault: addr.id === addressId,
          })),
          loading: false,
          lastUpdated: new Date(),
        }));

        return { success: true, data: result.data, message: result.message };
      } else {
        throw new Error(result.error || 'Failed to set default address');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setState(prev => ({ ...prev, error: errorMessage, loading: false }));
      return { success: false, error: errorMessage };
    }
  }, []);

  // Get default address
  const getDefaultAddress = useCallback(() => {
    return state.addresses.find(addr => addr.isDefault) || null;
  }, [state.addresses]);

  // Get addresses by type
  const getAddressesByType = useCallback(
    (type: 'shipping' | 'billing' | 'both') => {
      return state.addresses.filter(addr => addr.type === type || addr.type === 'both');
    },
    [state.addresses]
  );

  // Auto-load addresses
  useEffect(() => {
    if (autoLoad) {
      loadAddresses();
    }
  }, [autoLoad, loadAddresses]);

  return {
    // State
    ...state,

    // Computed values
    defaultAddress: getDefaultAddress(),
    shippingAddresses: getAddressesByType('shipping'),
    billingAddresses: getAddressesByType('billing'),
    isEmpty: state.addresses.length === 0,

    // Actions
    loadAddresses,
    createAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress,
    getAddressesByType,

    // Utilities
    refresh: loadAddresses,
    findById: (id: string) => state.addresses.find(addr => addr.id === id) || null,
  };
}
