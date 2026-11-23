/**
 * This file defines all of the relations between the tables in our database
 * schema using Drizzle's `defineRelations()` API (Relational Queries v2).
 *
 * Unlike the table definitions in `schema.ts`, relations do *not* change the
 * structure of the database. Instead, they tell Drizzle how tables connect so
 * that we can use the relational query API (`db.query.<table>.findMany(...)`)
 * to load nested data with `with: { ... }` and filter on related tables in
 * `where: { ... }`.
 *
 * All relations live in one place:
 * - `r.one.<table>({ from, to })` defines a relation to *one* row of another table.
 * - `r.many.<table>({ from, to })` defines a relation to *many* rows of another table.
 * - `.through(...)` defines a many-to-many relation that goes through a junction table.
 * - `alias` disambiguates multiple relations between the same pair of tables.
 *
 * @see https://orm.drizzle.team/docs/relations-v2
 *
 * @author Ajay Gandecha <agandecha@unc.edu>
 * @license MIT
 * @see https://comp426-25f.github.io/
 */

import { defineRelations } from "drizzle-orm";
import * as schema from "./schema";

export const relations = defineRelations(schema, (r) => ({
  /**
   * Relations for the `profiles` table:
   * - Each profile (user) may post *many* posts.
   * - Each profile (user) may like *many* posts (through the `likes` table).
   * - Each profile (user) may be following *many* other profiles
   *   (through the `follows` table).
   * - Each profile (user) may be followed by *many* other profiles
   *   (through the `follows` table).
   *
   * NOTE: `following` and `followers` are both relations from the `profiles`
   * table back to itself, so we give each one an `alias` to tell them apart.
   */
  profilesTable: {
    posts: r.many.postsTable({
      from: r.profilesTable.id,
      to: r.postsTable.authorId,
    }),
    likes: r.many.likesTable({
      from: r.profilesTable.id,
      to: r.likesTable.profileId,
    }),
    following: r.many.profilesTable({
      from: r.profilesTable.id.through(r.followsTable.followerId),
      to: r.profilesTable.id.through(r.followsTable.followingId),
      alias: "following",
    }),
    followers: r.many.profilesTable({
      from: r.profilesTable.id.through(r.followsTable.followingId),
      to: r.profilesTable.id.through(r.followsTable.followerId),
      alias: "followers",
    }),
  },

  /**
   * Relations for the `posts` table:
   * - Every post must have *one* associated author (profile).
   * - Every post may have *many* likes associated with it.
   */
  postsTable: {
    author: r.one.profilesTable({
      from: r.postsTable.authorId,
      to: r.profilesTable.id,
      optional: false,
    }),
    likes: r.many.likesTable({
      from: r.postsTable.id,
      to: r.likesTable.postId,
    }),
  },

  /**
   * Relations for the `likes` table:
   * - Every like must have *one* associated profile who liked the post.
   * - Every like must have *one* associated post that was liked.
   */
  likesTable: {
    profile: r.one.profilesTable({
      from: r.likesTable.profileId,
      to: r.profilesTable.id,
      optional: false,
    }),
    post: r.one.postsTable({
      from: r.likesTable.postId,
      to: r.postsTable.id,
      optional: false,
    }),
  },

  /**
   * Relations for the `follows` table:
   * - Every follow relationship has *one* follower (the profile doing the following).
   * - Every follow relationship has *one* profile that is being followed.
   *
   * NOTE: Both relations point to the `profiles` table, so each needs an `alias`.
   */
  followsTable: {
    follower: r.one.profilesTable({
      from: r.followsTable.followerId,
      to: r.profilesTable.id,
      optional: false,
      alias: "follower",
    }),
    following: r.one.profilesTable({
      from: r.followsTable.followingId,
      to: r.profilesTable.id,
      optional: false,
      alias: "followed",
    }),
  },
}));
