'use client';

import { useEffect } from 'react';

/**
 * VisitorTracker component that tracks page visits
 * This component runs on the client side and sends a PAGE_VISIT event
 * to the analytics API when the page loads.
 */
export default function VisitorTracker() {
  useEffect(() => {
    // Generate or retrieve visitor ID from localStorage
    const getVisitorId = (): string => {
      const storedId = localStorage.getItem('visitorId');
      if (storedId) {
        return storedId;
      }
      // Generate a unique ID for this visitor
      const newId = `visitor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('visitorId', newId);
      return newId;
    };

    // Track page visit
    const trackVisit = async () => {
      try {
        const visitorId = getVisitorId();
        const metadata = {
          visitorId,
          userAgent: navigator.userAgent,
          language: navigator.language,
          screenWidth: window.screen.width,
          screenHeight: window.screen.height,
          referrer: document.referrer || 'direct',
          timestamp: new Date().toISOString(),
        };

        await fetch('/api/stats', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            eventType: 'PAGE_VISIT',
            metadata,
          }),
        });
      } catch (error) {
        // Silently fail - don't interrupt user experience
        console.error('Failed to track page visit:', error);
      }
    };

    // Track visit after a short delay to ensure page is loaded
    const timeoutId = setTimeout(trackVisit, 1000);

    return () => {
      clearTimeout(timeoutId);
    };
  }, []);

  // This component doesn't render anything
  return null;
}
