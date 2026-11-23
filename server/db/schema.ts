/**
 * This file defines the entire database schema (all tables).
 *
 * Relations between these tables are defined separately in `relations.ts`
 * using Drizzle's `defineRelations()` API.
 *
 * To configure the Supabase database using this schema as a guide, use the command:
 * ```
 * npx drizzle-kit push
 * ```
 *
 * @author Ajay Gandecha <agandecha@unc.edu>
 * @license MIT
 * @see https://comp426-25f.github.io/
 */

import {
  integer,
  pgTable,
  primaryKey,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

/**
 * Defines the `profiles` database table with the following fields:
 * - `id` (text, primary key)
 * - `name` (text, required)
 * - `handle` (text, required)
 * - `avatarUrl` (text, optional)
 */
export const profilesTable = pgTable("profiles", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  handle: text("handle").notNull(),
  avatarUrl: text("avatar_url"),
});

/**
 * Defines the `posts` database table with the following fields:
 * - `id` (serial, primary key)
 * - `content` (text, required)
 * - `postedAt` (timestamp, default=now())
 * - `authorId` (text, foreign key to the `profilesTable.id` column)
 * - `attachmentUrl` (text, optional)
 */
export const postsTable = pgTable("posts", {
  id: serial("id").primaryKey(),
  content: text("content"),
  postedAt: timestamp("posted_at").defaultNow(),
  authorId: text("author_id").references(() => profilesTable.id, {
    onDelete: "cascade",
  }),
  attachmentUrl: text("attachment_url"),
});

/**
 * Defines the `likes` database table with the following fields:
 * - `postId` (integer, foreign key to the `postsTable.id` column)
 * - `profileId` (text, foreign key to the `profilesTable.id` column)
 *
 * This table contains a **composite primary key** that combines the `postId` and `profileId` columns.
 * This ensures that each entry is uniquely identifiable by the tuple (postId, profileId).
 *
 * To learn how to set up composite primary keys in Drizzle, check out the official documentation:
 * @see https://orm.drizzle.team/docs/indexes-constraints#composite-primary-key
 */
export const likesTable = pgTable(
  "likes",
  {
    postId: integer("post_id")
      .notNull()
      .references(() => postsTable.id, { onDelete: "cascade" }),
    profileId: text("profile_id")
      .notNull()
      .references(() => profilesTable.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.postId, t.profileId] })],
);

/**
 * Defines the `follows` database table with the following fields:
 * - `followerId` (text, foreign key to the `profilesTable.id` column)
 * - `followingId` (text, foreign key to the `profilesTable.id` column)
 *
 * Like the `likes` table, this table uses a composite primary key.
 */
export const followsTable = pgTable(
  "follows",
  {
    followerId: text("follower_id")
      .notNull()
      .references(() => profilesTable.id, { onDelete: "cascade" }),
    followingId: text("following_id")
      .notNull()
      .references(() => profilesTable.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.followerId, t.followingId] })],
);
