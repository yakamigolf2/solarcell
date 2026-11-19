import { index, jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

// Generic document store: the UI keeps its data as JSON "records" grouped by collection
// (solarpro_jobs, solarpro_users, bge_company_settings).
export const records = pgTable(
  'records',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    collection: text('collection').notNull(),
    value: jsonb('value').$type<Record<string, any>>().notNull(),
    idempotencyKey: text('idempotency_key').unique(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('records_collection_idx').on(t.collection, t.createdAt)],
);
