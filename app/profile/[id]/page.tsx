/**
 * Route for profile pages (`/profile/:id`).
 *
 * This Server Component loads the signed in user (redirecting to the login
 * page if there is none), reads the profile ID from the dynamic URL segment,
 * and renders the interactive profile page (`profile-page.tsx`).
 *
 * @author Ajay Gandecha <agandecha@unc.edu>
 * @license MIT
 * @see https://comp426-25f.github.io/
 */

import PublicProfilePage from "./profile-page";
import { requireUser } from "@/utils/supabase/auth";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;
  return <PublicProfilePage user={user} profileId={id} />;
}
