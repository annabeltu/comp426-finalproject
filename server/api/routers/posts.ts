/**
 * tRPC APIs that contains all of the functionality for creating,
 * reading, updating, and deleting data in our database relating to
 * posts.
 *
 * @author Ajay Gandecha <agandecha@unc.edu>
 * @license MIT
 * @see https://comp426-25f.github.io/
 */

import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";
import { placeholder, Post } from "@/server/models/responses";
import {
  DraftPost,
  PaginationParams,
  PostIdentity,
} from "@/server/models/inputs";
import { db } from "@/server/db/index"
import { likesTable, postsTable } from "@/server/db/schema"
import { and, eq } from 'drizzle-orm'
import { TRPCError } from "@trpc/server";

/**
 * TODO: Loads data for a specific post given its ID.
 *
 * The data returned should be in the format of a
 * `Post` Zod model. Make sure you select the correct
 * columns and nested relations to match the expected
 * return type. For more details, refer to the Drizzle
 * documentation here:
 * @see https://orm.drizzle.team/docs/rqb-v2
 *
 * If no post was found, throw a `NOT_FOUND` tRPC error.
 * @see https://trpc.io/docs/server/error-handling
 *
 * You can perform casting and validation of any generic
 * data to a Zod model using: ModelName.parse(data)
 */

const getPost = publicProcedure
  .input(PostIdentity)
  .output(Post)
  .query(async ({ input }) => {
    const { postId } = input;

    const post = await db.query.postsTable.findFirst({
      where: { id: postId },
      columns: {
        id: true,
        content: true,
        postedAt: true,
        attachmentUrl: true,
      },
      with: {
        author: {
          columns: { id: true, name: true, handle: true, avatarUrl: true },
        },
        likes: { columns: { profileId: true } },
      },
    });

    if (!post) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Post not found" });
    }

    return Post.parse(post);
  });

/**
 * TODO: Toggles whether or not a user has liked a
 * post with a given ID.
 *
 * If the user has already liked the post, remove the like
 * by deleting an entry from the `likes` table.
 *
 * If the user has not already liked the post, add a like
 * by creating an entry on the `likes` table.
 *
 *
 * This method should succeed silently (return nothing).
 */
const toggleLike = protectedProcedure
  .input(PostIdentity)
  .mutation(async ({ ctx, input }) => {
    const { subject } = ctx;
    const { postId } = input;

    const like = await db.query.likesTable.findFirst({
      where: { postId, profileId: subject.id },
    });

    if (like) {
      await db.delete(likesTable).where(
        and(
          eq(likesTable.postId, postId),
          eq(likesTable.profileId, subject.id),
        ),
      );
    } else {
      await db.insert(likesTable).values({ postId, profileId: subject.id });
    }
  });

/**
 * TODO: Loads data for the user's post feed.
 *
 * This function should get the most recent posts in the
 * `post` database in reverse chronological order
 * (so that the *most recent posts* appear first).
 *
 * This method takes is *paginated* - meaning that it
 * should only load a range of data at a time, but not
 * all of the data at once. The method passes in a
 * `cursor` parameter which should determine the starting
 * index for the post to load. Each page should be a length
 * of 25 posts long. For example, if the database
 * contains 100 posts and the cursor is set to 10, posts
 * 10 through 35 should be loaded.
 *
 * The data returned should be in the format of an array of
 * `Post` Zod models. Make sure you select the correct
 * columns and nested relations to match the expected
 * return type. For more details, refer to the Drizzle
 * documentation here:
 * @see https://orm.drizzle.team/docs/rqb-v2
 *
 * You can perform casting and validation of any generic
 * data to a Zod model using: ModelName.parse(data)
 */
const getFeed = protectedProcedure
  .input(PaginationParams)
  .output(Post.array())
  .query(async ({ input }) => {
    const { cursor } = input;

    const posts = await db.query.postsTable.findMany({
      columns: {
        id: true,
        content: true,
        postedAt: true,
        attachmentUrl: true,
      },
      with: {
        author: {
          columns: { id: true, name: true, handle: true, avatarUrl: true },
        },
        likes: { columns: { profileId: true } },
      },
      orderBy: { postedAt: "desc", id: "desc" },
      offset: cursor,
      limit: 25,
    });

    return Post.array().parse(posts);
  });

/**
 * TODO: Loads data for the user's 'following' post feed.
 *
 * This function should get the most recent posts in the
 * `post` database in reverse chronological order
 * (so that the *most recent posts* appear first) made by
 * accounts that the user follows.
 *
 * HINT: Similar to the likes feed below, you can filter posts
 * based on their related rows. Look at the relations defined
 * for the `posts` and `profiles` tables in
 * `server/db/relations.ts`.
 *
 * This method takes is *paginated* - meaning that it
 * should only load a range of data at a time, but not
 * all of the data at once. The method passes in a
 * `cursor` parameter which should determine the starting
 * index for the post to load. Each page should be a length
 * of 25 posts long. For example, if the database
 * contains 100 posts and the cursor is set to 10, posts
 * 10 through 35 should be loaded.
 *
 * The data returned should be in the format of an array of
 * `Post` Zod models. Make sure you select the correct
 * columns and nested relations to match the expected
 * return type. For more details, refer to the Drizzle
 * documentation here:
 * @see https://orm.drizzle.team/docs/rqb-v2
 *
 * You can perform casting and validation of any generic
 * data to a Zod model using: ModelName.parse(data)
 */
const getFollowingFeed = protectedProcedure
  .input(PaginationParams)
  .output(Post.array())
  .query(async ({ ctx, input }) => {
    const { subject } = ctx;
    const { cursor } = input;

    const posts = await db.query.postsTable.findMany({
      where: { author: { followers: { id: subject.id } } },
      columns: {
        id: true,
        content: true,
        postedAt: true,
        attachmentUrl: true,
      },
      with: {
        author: {
          columns: { id: true, name: true, handle: true, avatarUrl: true },
        },
        likes: { columns: { profileId: true } },
      },
      orderBy: { postedAt: "desc", id: "desc" },
      offset: cursor,
      limit: 25,
    });

    return Post.array().parse(posts);
  });

/**
 * TODO: Loads data for the user's 'likes' post feed.
 *
 * This function should get the most recent posts in the
 * `post` database in reverse chronological order
 * (so that the *most recent posts* appear first) that
 * the user has liked.
 *
 * HINT: Drizzle's relational queries let you filter rows
 * based on their *related* rows. Look at the relations
 * defined for the `posts` table in `server/db/relations.ts`,
 * then read about relation filters here:
 * @see https://orm.drizzle.team/docs/rqb-v2#relations-filters
 *
 * This method takes is *paginated* - meaning that it
 * should only load a range of data at a time, but not
 * all of the data at once. The method passes in a
 * `cursor` parameter which should determine the starting
 * index for the post to load. Each page should be a length
 * of 25 posts long. For example, if the database
 * contains 100 posts and the cursor is set to 10, posts
 * 10 through 35 should be loaded.
 *
 * The data returned should be in the format of an array of
 * `Post` Zod models. Make sure you select the correct
 * columns and nested relations to match the expected
 * return type. For more details, refer to the Drizzle
 * documentation here:
 * @see https://orm.drizzle.team/docs/rqb-v2
 *
 * You can perform casting and validation of any generic
 * data to a Zod model using: ModelName.parse(data)
 */
const getLikesFeed = protectedProcedure
  .input(PaginationParams)
  .output(Post.array())
  .query(async ({ ctx, input }) => {
    const { subject } = ctx;
    const { cursor } = input;

    const posts = await db.query.postsTable.findMany({
      where: { likes: { profileId: subject.id } },
      columns: {
        id: true,
        content: true,
        postedAt: true,
        attachmentUrl: true,
      },
      with: {
        author: {
          columns: { id: true, name: true, handle: true, avatarUrl: true },
        },
        likes: { columns: { profileId: true } },
      },
      orderBy: { postedAt: "desc", id: "desc" },
      offset: cursor,
      limit: 25,
    });

    return Post.array().parse(posts);
  });

/**
 * TODO: Creates a post in the database.
 *
 * This function takes in the content and optional attachment URL
 * for the post and creates a new post in the database, authored
 * by the user and posted at the current time.
 *
 * This method should succeed silently (return nothing).
 *
 * @param supabase: Supabase client to use.
 * @param user: Active user making the request.
 * @param content: The content of the post to make.
 * @param file: The image attachment, if any, with the post.
 */
const createPost = protectedProcedure
  .input(DraftPost)
  .mutation(async ({ ctx, input }) => {
    const { subject } = ctx;
    const { content, attachmentUrl } = input;

    await db.insert(postsTable).values({
      content,
      attachmentUrl,
      authorId: subject.id,
      postedAt: new Date(),
    });
  });

/**
 * Router for all post-related APIs.
 */
export const postsApiRouter = createTRPCRouter({
  getPost: getPost,
  toggleLike: toggleLike,
  getFeed: getFeed,
  getFollowingFeed: getFollowingFeed,
  getLikesFeed: getLikesFeed,
  createPost: createPost,
});
