/**
 * This file contains all of the Zod validation models
 * used to ensure that our tRPC API functions ultimately
 * return data in the correct format.
 *
 * Zod is the industry standard for schema validation.
 * It allows for easy casting of and validation of data.
 *
 * Zod types are defined as objects that contains fields.
 * We can compose Zod types as well as shown below.
 *
 * To access the pure type of any Zod model, we can use:
 * z.infer<typeof Model>
 *
 * In the future, we will use Zod in many more places, so
 * it is good to introduce it here.
 *
 * @author Ajay Gandecha <agandecha@unc.edu>
 * @license MIT
 * @see https://comp426-25f.github.io/
 */

import { z } from "zod";

/** Defines the schema for profile and author data. */
export const Profile = z.object({
  id: z.string(),
  name: z.string(),
  handle: z.string(),
  avatarUrl: z.string().nullish(),
});

/** Defines the schema for individual likes. */
export const PostLikes = z.object({
  profileId: z.string(),
});

/** Defines the schema for posts. */
export const Post = z.object({
  id: z.number(),
  content: z.string(),
  postedAt: z.date({ coerce: true }),
  author: Profile,
  likes: PostLikes.array(),
  attachmentUrl: z.string().nullish(),
});

/** Defines thes schema for following data. */
export const Following = z.object({
  following: Profile,
});

// Placeholder to prevent errors in the build step for students.
export const placeholder = {};