/**
 * @orpaynter/connector-clarity
 * 
 * Microsoft Clarity connector for session replay and user behavior analytics.
 * Provides type-safe access to Clarity tracking features including heatmaps,
 * session recordings, and custom event tracking.
 */

/**
 * Configuration options for Clarity connector
 */
export interface ClarityConfig {
  /** Clarity project ID */
  projectId: string;
  /** Optional cookie consent configuration */
  cookieConsent?: boolean;
  /** Optional custom upload URL */
  uploadUrl?: string;
}

/**
 * Custom event properties
 */
export interface EventProperties {
  [key: string]: string | number | boolean;
}

/**
 * User identification metadata
 */
export interface UserMetadata {
  [key: string]: string | number | boolean;
}

/**
 * Creates a Microsoft Clarity connector instance
 */
export function createClarityConnector(config: ClarityConfig) {
  let clarityLoaded = false;
  let eventQueue: Array<() => void> = [];

  /**
   * Initialize Clarity script
   */
  function initializeClarity() {
    if (typeof window === 'undefined') {
      console.warn('Clarity can only be initialized in browser environment');
      return;
    }

    if (clarityLoaded) return;

    // Load Clarity script
    (function(c: any, l: any, a: string, r: string, i: string, t: any, y: any) {
      c[a] = c[a] || function() {
        (c[a].q = c[a].q || []).push(arguments);
      };
      t = l.createElement(r);
      t.async = 1;
      t.src = 'https://www.clarity.ms/tag/' + i;
      y = l.getElementsByTagName(r)[0];
      y.parentNode.insertBefore(t, y);
    })(window, document, 'clarity', 'script', config.projectId);

    clarityLoaded = true;

    // Process queued events
    eventQueue.forEach(fn => fn());
    eventQueue = [];
  }

  /**
   * Execute function when Clarity is loaded
   */
  function whenReady(fn: () => void) {
    if (clarityLoaded && typeof (window as any).clarity !== 'undefined') {
      fn();
    } else {
      eventQueue.push(fn);
    }
  }

  // Auto-initialize in browser
  if (typeof window !== 'undefined') {
    initializeClarity();
  }

  return {
    /**
     * Track a custom event
     */
    trackEvent(eventName: string, properties?: EventProperties): void {
      whenReady(() => {
        if (typeof (window as any).clarity !== 'undefined') {
          (window as any).clarity('event', eventName);
          
          // Track properties as separate events if provided
          if (properties) {
            Object.entries(properties).forEach(([key, value]) => {
              (window as any).clarity('set', `${eventName}_${key}`, String(value));
            });
          }
        }
      });
    },

    /**
     * Tag the current session with custom metadata
     */
    tagSession(key: string, value: string | number | boolean): void {
      whenReady(() => {
        if (typeof (window as any).clarity !== 'undefined') {
          (window as any).clarity('set', key, String(value));
        }
      });
    },

    /**
     * Identify a user with custom metadata
     */
    identifyUser(userId: string, metadata?: UserMetadata): void {
      whenReady(() => {
        if (typeof (window as any).clarity !== 'undefined') {
          (window as any).clarity('identify', userId);
          
          // Set metadata
          if (metadata) {
            Object.entries(metadata).forEach(([key, value]) => {
              (window as any).clarity('set', key, String(value));
            });
          }
        }
      });
    },

    /**
     * Upgrade the current session (for GDPR compliance)
     */
    upgradeSession(): void {
      whenReady(() => {
        if (typeof (window as any).clarity !== 'undefined') {
          (window as any).clarity('upgrade');
        }
      });
    },

    /**
     * Get the current session ID
     */
    getSessionId(): string | null {
      if (typeof window === 'undefined' || typeof (window as any).clarity === 'undefined') {
        return null;
      }
      
      try {
        return (window as any).clarity('sessionId') || null;
      } catch (error) {
        return null;
      }
    },

    /**
     * Check if Clarity is loaded and ready
     */
    isReady(): boolean {
      return clarityLoaded && typeof (window as any).clarity !== 'undefined';
    },

    /**
     * Manually initialize Clarity (useful for delayed initialization)
     */
    initialize(): void {
      initializeClarity();
    },

    /**
     * Track page view
     */
    trackPageView(pageName?: string, properties?: EventProperties): void {
      const name = pageName || (typeof window !== 'undefined' ? window.location.pathname : 'page_view');
      this.trackEvent('page_view', {
        page: name,
        ...properties,
      });
    },

    /**
     * Track button click
     */
    trackClick(elementName: string, properties?: EventProperties): void {
      this.trackEvent('click', {
        element: elementName,
        ...properties,
      });
    },

    /**
     * Track form submission
     */
    trackFormSubmit(formName: string, properties?: EventProperties): void {
      this.trackEvent('form_submit', {
        form: formName,
        ...properties,
      });
    },

    /**
     * Track error
     */
    trackError(errorMessage: string, properties?: EventProperties): void {
      this.trackEvent('error', {
        message: errorMessage,
        ...properties,
      });
    },

    /**
     * Track conversion
     */
    trackConversion(conversionName: string, value?: number, properties?: EventProperties): void {
      this.trackEvent('conversion', {
        name: conversionName,
        value: value ?? 0,
        ...properties,
      });
    },
  };
}

/**
 * Type helper for Clarity connector
 */
export type ClarityConnector = ReturnType<typeof createClarityConnector>;
