import { cn } from '@blackliving/ui';

export interface OverlaySettings {
  enabled?: boolean;
  title?: string;
  placement?: 'bottom-left' | 'bottom-right' | 'bottom-center' | 'top-left' | 'center';
  gradientDirection?: string;
}

export interface OverlayContainerProps {
  settings: OverlaySettings;
  className?: string;
  children?: React.ReactNode;
}

/**
 * OverlayContainer - Reusable component for overlay text positioning
 * Provides consistent overlay rendering with gradient backgrounds and text positioning
 */
export function OverlayContainer({ settings, className, children }: OverlayContainerProps) {
  if (!settings.enabled) {
    return null;
  }

  return (
    <div className={cn(
      'absolute inset-0 flex items-center justify-center text-white',
      settings.placement === 'bottom-left' && 'items-end justify-start p-4 md:p-5',
      settings.placement === 'bottom-right' && 'items-end justify-end p-4 md:p-5 text-right',
      settings.placement === 'bottom-center' && 'items-end justify-center p-4 md:p-5 text-center',
      settings.placement === 'top-left' && 'items-start justify-start p-4 md:p-5',
      settings.placement === 'center' && 'text-center',
      className
    )}>
      {/* Gradient Background */}
      <div className={cn(
        'absolute inset-0 bg-gradient-to-t from-black/95 via-black/90 via-20% to-35% to-transparent',
        settings.gradientDirection === 't' && 'bg-gradient-to-t',
        settings.gradientDirection === 'tr' && 'bg-gradient-to-tr',
        settings.gradientDirection === 'r' && 'bg-gradient-to-r',
        settings.gradientDirection === 'br' && 'bg-gradient-to-br',
        settings.gradientDirection === 'b' && 'bg-gradient-to-b',
        settings.gradientDirection === 'bl' && 'bg-gradient-to-bl',
        settings.gradientDirection === 'l' && 'bg-gradient-to-l',
        settings.gradientDirection === 'tl' && 'bg-gradient-to-tl'
      )} />

      {/* Content */}
      <div className="relative z-10">
        {settings.title && (
          <h2 className="line-clamp-2 text-lg md:text-2xl font-bold drop-shadow whitespace-nowrap line-clamp-1">
            {settings.title}
          </h2>
        )}
        {children}
      </div>
    </div>
  );
}