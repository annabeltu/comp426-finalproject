/**
 * tRPC APIs that contains all of the functionality for creating,
 * reading, updating, and deleting data in our database relating to
 * profiles.
 *
 * @author Ajay Gandecha <agandecha@unc.edu>
 * @license MIT
 * @see https://comp426-25f.github.io/
 */

import z from "zod";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";
import { Post, Profile } from "@/server/models/responses";
import {
  DraftProfileImage,
  NewUser,
  PaginationParams,
  ProfileIdentity,
} from "@/server/models/inputs";
import { db } from "@/server/db/index";
import { followsTable, profilesTable } from "@/server/db/schema";
import { and, eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

/**
 * TODO: Loads data for a specific profile given its ID.
 *
 * The data returned should match the format of the
 * `Profile` Zod model.
 *
 * If no profile was found, throw a `NOT_FOUND` tRPC error.
 * @see https://trpc.io/docs/server/error-handling
 *
 * You can perform casting and validation of any generic
 * data to a Zod model using: ModelName.parse(data)
 */
const getProfile = publicProcedure
  .input(ProfileIdentity)
  .output(Profile)
  .query(async ({ input }) => {
    const { profileId } = input;

    const profile = await db.query.profilesTable.findFirst({
      where: { id: profileId },
    });

    if (!profile) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Profile not found" });
    }

    return Profile.parse(profile);
  });

/**
 * TODO: Loads data for the currently authenticated user
 * (passed in as the `subject`).
 *
 * The data returned should match the format of the
 * `Profile` Zod model.
 *
 * If no profile was found, throw a `NOT_FOUND` tRPC error.
 * @see https://trpc.io/docs/server/error-handling
 *
 * You can perform casting and validation of any generic
 * data to a Zod model using: ModelName.parse(data)
 */
const getAuthedUserProfile = protectedProcedure
  .output(Profile)
  .query(async ({ ctx }) => {
    const { subject } = ctx;

    const profile = await db.query.profilesTable.findFirst({
      where: { id: subject.id },
    });

    if (!profile) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Profile not found" });
    }

    return Profile.parse(profile);
  });

/**
 * TODO: Toggles whether or not the active user is following
 * another profile.
 *
 * If the user is already following the profile, remove the follow
 * by deleting an entry from the `follow` table.
 *
 * If the user is not already following the profile, add a follow
 * by creating an entry on the `follow` table.
 *
 * This method should succeed silently (return nothing).
 */
const toggleFollowingProfile = protectedProcedure
  .input(ProfileIdentity)
  .mutation(async ({ ctx, input }) => {
    const { subject } = ctx;
    const { profileId } = input;

    const follow = await db.query.followsTable.findFirst({
      where: { followerId: subject.id, followingId: profileId },
    });

    if (follow) {
      await db.delete(followsTable).where(
        and(
          eq(followsTable.followerId, subject.id),
          eq(followsTable.followingId, profileId),
        ),
      );
    } else {
      await db.insert(followsTable).values({
        followerId: subject.id,
        followingId: profileId,
      });
    }
  });

/**
 * TODO: Retrieve all of the accounts that the user is following.
 *
 * The data returned should match the format of an array of
 * `Profile` Zod models. Make sure to select the correct
 * columns and load any relations that are necessary. Note that the
 * data returned by your query might not exactly match the return format
 * above, which sometimes is a common occurrence when working on backend
 * functionality. Make sure to perform any modification to flatten the
 * data into just the expected `Profile[]` return type.
 *
 * HINT: Look at the relations defined for the `profiles` table in
 * `server/db/relations.ts`. You may be able to use one of them to load
 * the followed profiles directly.
 * Ensure to throw errors if present.
 *
 * This method should succeed silently (return nothing).
 */
const getFollowsForProfile = publicProcedure
  .input(ProfileIdentity)
  .output(Profile.array())
  .query(async ({ input }) => {
    const { profileId } = input;

    const follows = await db.query.followsTable.findMany({
      where: { followerId: profileId },
      columns: {},
      with: { following: true },
    });

    return Profile.array().parse(follows.map((follow) => follow.following));
  });

/**
 * TODO: Determine if the given user follows the profile.
 *
 * This function determines if the currently authenticated user (the subject)
 * is following the profile provided in the input. If so, return true - if not,
 * return false.
 */
const getIsUserFollowingProfile = protectedProcedure
  .input(ProfileIdentity)
  .output(z.boolean())
  .query(async ({ ctx, input }) => {
    const { subject } = ctx;
    const { profileId } = input;

    const follow = await db.query.followsTable.findFirst({
      where: { followerId: subject.id, followingId: profileId },
    });

    return follow !== undefined;
  });

/**
 * TODO: Loads data for the user's post feed.
 *
 * This function should get the most recent posts in the
 * `post` database in reverse chronological order
 * (so that the *most recent posts* appear first)
 * that were posted by the profile with the given ID.
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
const getPostsForProfile = publicProcedure
  .input(ProfileIdentity.and(PaginationParams))
  .output(Post.array())
  .query(async ({ input }) => {
    const { profileId, cursor } = input;

    const posts = await db.query.postsTable.findMany({
      where: { authorId: profileId },
      columns: {
        id: true,
        content: true,
        postedAt: true,
        attachmentUrl: true,
      },
      with: {
        author: true,
        likes: { columns: { profileId: true } },
      },
      orderBy: { postedAt: "desc", id: "desc" },
      offset: cursor,
      limit: 25,
    });

    return Post.array().parse(posts);
  });

/**
 * TODO: Create a new user based on the name and handle provided.
 *
 * This endpoint is used whenever a new user authenticates with Supabase Auth
 * so that we can have a profile entry in our database for that user.
 */
const handleNewUser = protectedProcedure
  .input(NewUser)
  .mutation(async ({ ctx, input }) => {
    const { subject } = ctx;
    const { name, handle } = input;

    await db.insert(profilesTable).values({ id: subject.id, name, handle });
  });

/**
 * TODO: Updates a user's avatar URL.
 *
 * This function updates the avatar URL for the currently signed in
 * user to match the attachment URL provided.
 *
 * This method should succeed silently (return nothing).
 */
const updateProfilePicture = protectedProcedure
  .input(DraftProfileImage)
  .mutation(async ({ ctx, input }) => {
    const { subject } = ctx;
    const { avatarUrl } = input;

    await db
      .update(profilesTable)
      .set({ avatarUrl: avatarUrl ?? null })
      .where(eq(profilesTable.id, subject.id));
  });

/**
 * Router for all profile-related APIs.
 */
export const profilesApiRouter = createTRPCRouter({
  getProfile: getProfile,
  getAuthedUserProfile: getAuthedUserProfile,
  toggleFollowingProfile: toggleFollowingProfile,
  getFollowsForProfile: getFollowsForProfile,
  getIsUserFollowingProfile: getIsUserFollowingProfile,
  getPostsForProfile: getPostsForProfile,
  handleNewUser: handleNewUser,
  updateProfilePicture: updateProfilePicture,
});
