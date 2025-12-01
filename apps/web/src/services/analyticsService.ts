import type { SearchAnalyticsEvent } from '@blackliving/types/search';

class AnalyticsService {
  private sessionId: string;
  private userId?: string;

  constructor() {
    // Generate or retrieve session ID
    this.sessionId = this.getOrCreateSessionId();
  }

  private getOrCreateSessionId(): string {
    const storage = globalThis.localStorage;
    if (!storage) {
      return `session_${Date.now()}_${Math.random()}`;
    }

    let sessionId = storage.getItem('search_session_id');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random()}`;
      storage.setItem('search_session_id', sessionId);
      // Clear session after 24 hours
      storage.setItem('search_session_expires', String(Date.now() + 24 * 60 * 60 * 1000));
    }

    // Check if session expired
    const expires = storage.getItem('search_session_expires');
    if (expires && Date.now() > parseInt(expires)) {
      sessionId = `session_${Date.now()}_${Math.random()}`;
      storage.setItem('search_session_id', sessionId);
      storage.setItem('search_session_expires', String(Date.now() + 24 * 60 * 60 * 1000));
    }

    return sessionId;
  }

  setUserId(userId: string) {
    this.userId = userId;
  }

  private async sendEvent(event: Omit<SearchAnalyticsEvent, 'id' | 'userId' | 'sessionId'>) {
    try {
      const fullEvent: SearchAnalyticsEvent = {
        id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: this.userId,
        sessionId: this.sessionId,
        ...event,
      };

      const response = await fetch('/api/analytics/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(fullEvent),
      });

      if (!response.ok) {
        console.warn('Failed to send analytics event:', response.status);
      }
    } catch (error) {
      // Silently fail analytics - don't break user experience
      console.warn('Analytics error:', error);
    }
  }

  // Track search queries
  trackSearchQuery(query: string, filters?: Record<string, any>) {
    this.sendEvent({
      type: 'search_query',
      timestamp: new Date().toISOString(),
      query,
      filters,
    });
  }

  // Track result clicks
  trackResultClick(
    query: string,
    resultId: string,
    resultType: 'product' | 'post' | 'page',
    position: number,
    filters?: Record<string, any>
  ) {
    this.sendEvent({
      type: 'search_result_click',
      timestamp: new Date().toISOString(),
      query,
      resultId,
      resultType,
      position,
      filters,
    });
  }

  // Track no results
  trackNoResults(query: string, filters?: Record<string, any>) {
    this.sendEvent({
      type: 'search_no_results',
      timestamp: new Date().toISOString(),
      query,
      filters,
    });
  }

  // Track search errors
  trackSearchError(query: string, error: string, filters?: Record<string, any>) {
    this.sendEvent({
      type: 'search_error',
      timestamp: new Date().toISOString(),
      query,
      filters,
      metadata: { error },
    });
  }

  // Get analytics summary (for admin/debugging)
  async getAnalyticsSummary() {
    try {
      const response = await fetch('/api/analytics/search/summary');
      if (!response.ok) {
        throw new Error('Failed to fetch analytics summary');
      }
      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Failed to get analytics summary:', error);
      return null;
    }
  }
}

// Export singleton instance
export const analyticsService = new AnalyticsService();
export default analyticsService;
