import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';

export const wins = sqliteTable('wins', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  // Type: 'work', 'personal', 'health', etc.
  category: text('category').default('general'), 
  // Storing as ISO string usually works best for Drizzle/SQLite compatibility
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
});