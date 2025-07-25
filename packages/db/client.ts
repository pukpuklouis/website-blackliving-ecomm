import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import * as schema from './schema';

// Create database client
// In Cloudflare Workers, this will be injected via env.DB
// In development, you can use a local SQLite file or Turso
export function createDB(connectionString?: string) {
  if (connectionString) {
    // For Turso or remote SQLite
    const client = createClient({
      url: connectionString,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
    return drizzle(client, { schema });
  }
  
  // For Cloudflare D1 (will be overridden in Workers environment)
  // This is just a placeholder for type safety
  return drizzle({} as any, { schema });
}

// Export the database instance
export const db = createDB(process.env.DATABASE_URL);

// Export all schema tables for convenience
export * from './schema';

// Export types
export type DB = typeof db;
export type Users = typeof schema.users.$inferSelect;
export type NewUser = typeof schema.users.$inferInsert;
export type Products = typeof schema.products.$inferSelect;
export type NewProduct = typeof schema.products.$inferInsert;
export type Orders = typeof schema.orders.$inferSelect;
export type NewOrder = typeof schema.orders.$inferInsert;
export type Appointments = typeof schema.appointments.$inferSelect;
export type NewAppointment = typeof schema.appointments.$inferInsert;
export type Posts = typeof schema.posts.$inferSelect;
export type NewPost = typeof schema.posts.$inferInsert;