import { drizzle } from 'drizzle-orm/d1';
import type { D1Database } from '@cloudflare/workers-types';
import * as schema from './schema';

// Create database client for Cloudflare D1
export function createDB(d1Database: D1Database) {
  return drizzle(d1Database, { schema });
}

// For development/local testing with a local SQLite file
export function createLocalDB() {
  // This will only be used in development
  const { drizzle: drizzleLocal } = require('drizzle-orm/libsql');
  const { createClient } = require('@libsql/client');

  const client = createClient({
    url: process.env.DATABASE_URL || 'file:./dev.db',
    authToken: process.env.TURSO_AUTH_TOKEN,
  });

  return drizzleLocal(client, { schema });
}

// Export all schema tables for convenience
export * from './schema';

// Export types
export type Users = typeof schema.users.$inferSelect;
export type NewUser = typeof schema.users.$inferInsert;
export type Products = typeof schema.products.$inferSelect;
export type NewProduct = typeof schema.products.$inferInsert;
export type ProductCategories = typeof schema.productCategories.$inferSelect;
export type NewProductCategory = typeof schema.productCategories.$inferInsert;
export type Orders = typeof schema.orders.$inferSelect;
export type NewOrder = typeof schema.orders.$inferInsert;
export type Appointments = typeof schema.appointments.$inferSelect;
export type NewAppointment = typeof schema.appointments.$inferInsert;
export type Reservations = typeof schema.reservations.$inferSelect;
export type NewReservation = typeof schema.reservations.$inferInsert;
export type Posts = typeof schema.posts.$inferSelect;
export type NewPost = typeof schema.posts.$inferInsert;
export type Reviews = typeof schema.reviews.$inferSelect;
export type NewReview = typeof schema.reviews.$inferInsert;
export type Newsletters = typeof schema.newsletters.$inferSelect;
export type NewNewsletter = typeof schema.newsletters.$inferInsert;
export type Contacts = typeof schema.contacts.$inferSelect;
export type NewContact = typeof schema.contacts.$inferInsert;
