import { ofetch } from 'ofetch';

export interface GA4Config {
  measurementId: string;
  apiSecret: string;
  endpoint?: string;
}

export interface GA4Event {
  name: string;
  params?: Record<string, any>;
}

export interface GA4User {
  client_id: string;
  user_id?: string;
  user_properties?: Record<string, any>;
}

/**
 * Google Analytics 4 Connector
 *
 * Provides methods to send events to GA4 via Measurement Protocol.
 *
 * @example
 * ```typescript
 * const ga4 = new GA4Connector({
 *   measurementId: 'G-XXXXXXXXXX',
 *   apiSecret: 'your_api_secret'
 * });
 *
 * await ga4.trackEvent({
 *   name: 'purchase',
 *   params: {
 *     currency: 'USD',
 *     value: 99.99,
 *     items: [{ item_id: 'SKU_123', item_name: 'Product' }]
 *   }
 * }, {
 *   client_id: 'client_123',
 *   user_id: 'user_456'
 * });
 * ```
 */
export class GA4Connector {
  private config: Required<GA4Config>;
  private http: typeof ofetch;

  constructor(config: GA4Config) {
    this.config = {
      ...config,
      endpoint:
        config.endpoint || 'https://www.google-analytics.com/mp/collect',
    };

    this.http = ofetch.create({
      baseURL: this.config.endpoint,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Track a single event
   */
  async trackEvent(event: GA4Event, user: GA4User): Promise<void> {
    await this.http('', {
      method: 'POST',
      query: {
        measurement_id: this.config.measurementId,
        api_secret: this.config.apiSecret,
      },
      body: {
        client_id: user.client_id,
        user_id: user.user_id,
        user_properties: user.user_properties,
        events: [event],
      },
    });
  }

  /**
   * Track multiple events in a batch
   */
  async trackBatch(events: GA4Event[], user: GA4User): Promise<void> {
    // GA4 allows max 25 events per request
    const chunks = this.chunkArray(events, 25);

    for (const chunk of chunks) {
      await this.http('', {
        method: 'POST',
        query: {
          measurement_id: this.config.measurementId,
          api_secret: this.config.apiSecret,
        },
        body: {
          client_id: user.client_id,
          user_id: user.user_id,
          user_properties: user.user_properties,
          events: chunk,
        },
      });
    }
  }

  /**
   * Track a page view
   */
  async trackPageView(
    params: {
      page_title: string;
      page_location: string;
      page_referrer?: string;
    },
    user: GA4User,
  ): Promise<void> {
    await this.trackEvent(
      {
        name: 'page_view',
        params,
      },
      user,
    );
  }

  /**
   * Track a conversion event
   */
  async trackConversion(
    params: {
      currency: string;
      value: number;
      transaction_id?: string;
      items?: Array<{
        item_id: string;
        item_name: string;
        quantity?: number;
        price?: number;
      }>;
    },
    user: GA4User,
  ): Promise<void> {
    await this.trackEvent(
      {
        name: 'purchase',
        params,
      },
      user,
    );
  }

  /**
   * Track user sign up
   */
  async trackSignUp(method: string, user: GA4User): Promise<void> {
    await this.trackEvent(
      {
        name: 'sign_up',
        params: { method },
      },
      user,
    );
  }

  /**
   * Track user login
   */
  async trackLogin(method: string, user: GA4User): Promise<void> {
    await this.trackEvent(
      {
        name: 'login',
        params: { method },
      },
      user,
    );
  }

  /**
   * Validate the configuration by sending a test event
   */
  async validate(user: GA4User): Promise<boolean> {
    try {
      const validationEndpoint = this.config.endpoint.replace(
        '/collect',
        '/debug/mp/collect',
      );
      const response = await ofetch(validationEndpoint, {
        method: 'POST',
        query: {
          measurement_id: this.config.measurementId,
          api_secret: this.config.apiSecret,
        },
        body: {
          client_id: user.client_id,
          events: [
            {
              name: 'test_event',
              params: { test: true },
            },
          ],
        },
      });

      return (
        !response.validationMessages || response.validationMessages.length === 0
      );
    } catch (error) {
      return false;
    }
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }
}

/**
 * Create a GA4 connector instance
 */
export function createGA4Connector(config: GA4Config): GA4Connector {
  return new GA4Connector(config);
}
