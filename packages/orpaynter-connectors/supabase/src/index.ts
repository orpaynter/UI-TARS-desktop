/**
 * @orpaynter/connector-supabase
 * 
 * Complete Supabase connector for database operations and authentication.
 * Provides type-safe access to Supabase services including auth, database,
 * real-time subscriptions, and storage.
 */

import { createClient, SupabaseClient, User, Session, AuthError } from '@supabase/supabase-js';

/**
 * Configuration options for Supabase connector
 */
export interface SupabaseConfig {
  /** Supabase project URL */
  url: string;
  /** Supabase anonymous key */
  anonKey: string;
  /** Optional service role key for admin operations */
  serviceRoleKey?: string;
}

/**
 * Filter options for database queries
 */
export interface QueryFilter {
  [key: string]: any;
}

/**
 * Subscription callback type
 */
export type SubscriptionCallback = (payload: any) => void;

/**
 * Creates a Supabase connector instance
 */
export function createSupabaseConnector(config: SupabaseConfig) {
  const client = createClient(config.url, config.anonKey);
  
  return {
    /**
     * Get the underlying Supabase client
     */
    getClient(): SupabaseClient {
      return client;
    },

    // ============================================
    // Authentication Methods
    // ============================================

    /**
     * Sign up a new user with email and password
     */
    async signUp(email: string, password: string, metadata?: Record<string, any>) {
      const { data, error } = await client.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
        },
      });

      if (error) throw error;
      return data;
    },

    /**
     * Sign in an existing user
     */
    async signIn(email: string, password: string) {
      const { data, error } = await client.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      return data;
    },

    /**
     * Sign out the current user
     */
    async signOut() {
      const { error } = await client.auth.signOut();
      if (error) throw error;
    },

    /**
     * Get the current session
     */
    async getSession(): Promise<Session | null> {
      const { data, error } = await client.auth.getSession();
      if (error) throw error;
      return data.session;
    },

    /**
     * Get the current user
     */
    async getUser(): Promise<User | null> {
      const { data, error } = await client.auth.getUser();
      if (error) throw error;
      return data.user;
    },

    /**
     * Send a password reset email
     */
    async resetPassword(email: string) {
      const { error} = await client.auth.resetPasswordForEmail(email);
      if (error) throw error;
    },

    /**
     * Update user metadata
     */
    async updateUser(attributes: { email?: string; password?: string; data?: Record<string, any> }) {
      const { data, error } = await client.auth.updateUser(attributes);
      if (error) throw error;
      return data;
    },

    // ============================================
    // Database Methods
    // ============================================

    /**
     * Select data from a table
     */
    async select<T = any>(
      table: string,
      filter?: QueryFilter,
      options?: {
        columns?: string;
        orderBy?: { column: string; ascending?: boolean };
        limit?: number;
        offset?: number;
      }
    ): Promise<T[]> {
      let query = client.from(table).select(options?.columns || '*');

      // Apply filters
      if (filter) {
        Object.entries(filter).forEach(([key, value]) => {
          query = query.eq(key, value);
        });
      }

      // Apply ordering
      if (options?.orderBy) {
        query = query.order(options.orderBy.column, {
          ascending: options.orderBy.ascending ?? true,
        });
      }

      // Apply limit and offset
      if (options?.limit) {
        query = query.limit(options.limit);
      }
      if (options?.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as T[];
    },

    /**
     * Insert data into a table
     */
    async insert<T = any>(table: string, data: Record<string, any> | Record<string, any>[]): Promise<T[]> {
      const { data: inserted, error } = await client
        .from(table)
        .insert(data)
        .select();

      if (error) throw error;
      return inserted as T[];
    },

    /**
     * Update data in a table
     */
    async update<T = any>(
      table: string,
      data: Record<string, any>,
      filter: QueryFilter
    ): Promise<T[]> {
      let query = client.from(table).update(data);

      // Apply filters
      Object.entries(filter).forEach(([key, value]) => {
        query = query.eq(key, value);
      });

      const { data: updated, error } = await query.select();
      if (error) throw error;
      return updated as T[];
    },

    /**
     * Delete data from a table
     */
    async delete(table: string, filter: QueryFilter): Promise<void> {
      let query = client.from(table).delete();

      // Apply filters
      Object.entries(filter).forEach(([key, value]) => {
        query = query.eq(key, value);
      });

      const { error } = await query;
      if (error) throw error;
    },

    /**
     * Execute a stored procedure (RPC)
     */
    async rpc<T = any>(functionName: string, params?: Record<string, any>): Promise<T> {
      const { data, error } = await client.rpc(functionName, params);
      if (error) throw error;
      return data as T;
    },

    // ============================================
    // Real-time Subscriptions
    // ============================================

    /**
     * Subscribe to real-time changes on a table
     */
    subscribe(
      table: string,
      event: 'INSERT' | 'UPDATE' | 'DELETE' | '*',
      callback: SubscriptionCallback,
      filter?: QueryFilter
    ) {
      let channel = client
        .channel(`${table}-changes`)
        .on(
          'postgres_changes',
          {
            event,
            schema: 'public',
            table,
            filter: filter ? `${Object.keys(filter)[0]}=eq.${Object.values(filter)[0]}` : undefined,
          },
          callback
        )
        .subscribe();

      return {
        unsubscribe: () => channel.unsubscribe(),
      };
    },

    // ============================================
    // Storage Methods
    // ============================================

    /**
     * Upload a file to storage
     */
    async uploadFile(bucket: string, path: string, file: File | Blob) {
      const { data, error } = await client.storage.from(bucket).upload(path, file);
      if (error) throw error;
      return data;
    },

    /**
     * Download a file from storage
     */
    async downloadFile(bucket: string, path: string) {
      const { data, error } = await client.storage.from(bucket).download(path);
      if (error) throw error;
      return data;
    },

    /**
     * Get public URL for a file
     */
    getPublicUrl(bucket: string, path: string): string {
      const { data } = client.storage.from(bucket).getPublicUrl(path);
      return data.publicUrl;
    },

    /**
     * Delete a file from storage
     */
    async deleteFile(bucket: string, paths: string | string[]) {
      const pathArray = Array.isArray(paths) ? paths : [paths];
      const { error } = await client.storage.from(bucket).remove(pathArray);
      if (error) throw error;
    },

    /**
     * List files in a storage bucket
     */
    async listFiles(bucket: string, path?: string) {
      const { data, error } = await client.storage.from(bucket).list(path);
      if (error) throw error;
      return data;
    },
  };
}

/**
 * Type helper for Supabase connector
 */
export type SupabaseConnector = ReturnType<typeof createSupabaseConnector>;
