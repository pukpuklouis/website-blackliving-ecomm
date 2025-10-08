import React, { createContext, useContext } from 'react';

interface EnvironmentConfig {
  PUBLIC_API_URL: string;
  PUBLIC_API_BASE_URL: string;
  PUBLIC_IMAGE_CDN_URL: string;
  PUBLIC_SITE_URL: string;
  PUBLIC_WEB_URL: string;
  NODE_ENV: string;
}

const EnvironmentContext = createContext<EnvironmentConfig>({
  PUBLIC_API_URL: '',
  PUBLIC_API_BASE_URL: '',
  PUBLIC_IMAGE_CDN_URL: '',
  PUBLIC_SITE_URL: '',
  PUBLIC_WEB_URL: '',
  NODE_ENV: 'development',
});

interface EnvironmentProviderProps {
  children: React.ReactNode;
  env?: Partial<EnvironmentConfig>;
}

export function EnvironmentProvider({ children, env = {} }: EnvironmentProviderProps) {
  // Fallback to import.meta.env for development or when env is not provided
  const config: EnvironmentConfig = {
    PUBLIC_API_URL: env.PUBLIC_API_URL || import.meta.env.PUBLIC_API_URL || 'http://localhost:8787',
    PUBLIC_API_BASE_URL:
      env.PUBLIC_API_BASE_URL || import.meta.env.PUBLIC_API_BASE_URL || 'http://localhost:8787',
    PUBLIC_IMAGE_CDN_URL:
      env.PUBLIC_IMAGE_CDN_URL ||
      import.meta.env.PUBLIC_IMAGE_CDN_URL ||
      'http://localhost:8787/media',
    PUBLIC_SITE_URL:
      env.PUBLIC_SITE_URL || import.meta.env.PUBLIC_SITE_URL || 'http://localhost:5173',
    PUBLIC_WEB_URL: env.PUBLIC_WEB_URL || import.meta.env.PUBLIC_WEB_URL || 'http://localhost:4321',
    NODE_ENV: env.NODE_ENV || import.meta.env.NODE_ENV || 'development',
  };

  return <EnvironmentContext.Provider value={config}>{children}</EnvironmentContext.Provider>;
}

export function useEnvironment(): EnvironmentConfig {
  const context = useContext(EnvironmentContext);
  if (!context) {
    throw new Error('useEnvironment must be used within an EnvironmentProvider');
  }
  return context;
}

// Backward compatibility helper for easy migration
export function useApiUrl(): string {
  const { PUBLIC_API_URL } = useEnvironment();
  return PUBLIC_API_URL;
}
