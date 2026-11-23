/**
 * This file contains all of the Zod validation models
 * used to ensure that our tRPC API functions accept
 * input data in the correct format.
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

/** Defines the schema for a post identity. */
export const PostIdentity = z.object({
  postId: z.number(),
});

/** Defines pagination parameters for use with useInfiniteQuery. */
export const PaginationParams = z.object({
  cursor: z.number().default(0),
});

/** Defines the schema for a new draft post. */
export const DraftPost = z.object({
  content: z.string(),
  attachmentUrl: z.string().nullish(),
});

/** Defines the schema for a profile identity. */
export const ProfileIdentity = z.object({ profileId: z.string() });

/** Defines the schema for a new draft profile image. */
export const DraftProfileImage = z.object({ avatarUrl: z.string().nullish() });

/** Defines the schema for a new user. */
export const NewUser = z.object({ name: z.string(), handle: z.string() });
