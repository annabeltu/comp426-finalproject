/**
 * Route for individual post pages (`/post/:id`).
 *
 * This Server Component loads the signed in user (redirecting to the login
 * page if there is none), reads the post ID from the dynamic URL segment,
 * and renders the post page (`post-page.tsx`).
 *
 * @author Ajay Gandecha <agandecha@unc.edu>
 * @license MIT
 * @see https://comp426-25f.github.io/
 */

import { notFound } from "next/navigation";
import PostPage from "./post-page";
import { requireUser } from "@/utils/supabase/auth";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;

  // Convert the post ID from the URL into a number.
  const postId = Number(id);
  if (!Number.isInteger(postId)) notFound();

  return <PostPage user={user} postId={postId} />;
}
