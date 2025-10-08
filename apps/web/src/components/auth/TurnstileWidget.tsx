import React, { useEffect, useRef, useState } from 'react';

declare global {
  interface Window {
    turnstile?: {
      render: (
        element: HTMLElement,
        options: {
          sitekey: string;
          callback: (token: string) => void;
          'expired-callback'?: () => void;
          'error-callback'?: () => void;
        }
      ) => string;
      reset: (widgetId?: string) => void;
    };
  }
}

interface TurnstileWidgetProps {
  onToken: (token: string | null) => void;
  siteKey: string;
  disabled?: boolean;
}

const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

export function TurnstileWidget({ onToken, siteKey, disabled = false }: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [scriptLoaded, setScriptLoaded] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    if (window.turnstile) {
      setScriptLoaded(true);
      return;
    }

    const existingScript = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT_SRC}"]`);
    if (existingScript) {
      if ((existingScript as any).__turnstileLoaded) {
        setScriptLoaded(true);
        return;
      }

      const handleLoad = () => {
        (existingScript as any).__turnstileLoaded = true;
        setScriptLoaded(true);
      };
      existingScript.addEventListener('load', handleLoad, { once: true });
      return () => existingScript.removeEventListener('load', handleLoad);
    }

    const script = document.createElement('script');
    script.src = SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      (script as any).__turnstileLoaded = true;
      setScriptLoaded(true);
    };
    document.head.appendChild(script);
  }, []);

  useEffect(() => {
    if (!scriptLoaded || !containerRef.current || !window.turnstile) {
      return;
    }

    widgetIdRef.current = window.turnstile.render(containerRef.current, {
      sitekey: siteKey,
      callback: (token) => onToken(token),
      'expired-callback': () => onToken(null),
      'error-callback': () => onToken(null),
    });

    return () => {
      if (widgetIdRef.current) {
        window.turnstile?.reset(widgetIdRef.current);
      }
    };
  }, [scriptLoaded, siteKey, onToken]);

  useEffect(() => {
    if (disabled && widgetIdRef.current && window.turnstile) {
      window.turnstile.reset(widgetIdRef.current);
      onToken(null);
    }
  }, [disabled, onToken]);

  return <div ref={containerRef} className="flex justify-center" />;
}

export default TurnstileWidget;
