/**
 * Header component appearing at the top of all pages.
 *
 * @author Ajay Gandecha <agandecha@unc.edu>
 * @license MIT
 * @see https://comp426-25f.github.io/
 */

"use client";

import { Bird, LogOut, UserRound } from "lucide-react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { createSupabaseComponentClient } from "@/utils/supabase/clients/component";
import { usePathname, useRouter } from "next/navigation";
import { ModeToggle } from "./ui/mode-toggle";
import { api } from "@/utils/trpc/api";

export default function Header() {
  // Create necessary hooks for clients and providers.
  const supabase = createSupabaseComponentClient();
  const router = useRouter();
  const pathname = usePathname();
  const apiUtils = api.useUtils();

  // Fetch the user profile data so that it can be displayed in the header.
  const { data } = api.profiles.getAuthedUserProfile.useQuery(undefined, {
    enabled: pathname !== "/login" && pathname !== "/signup",
    retry: (failureCount, error) =>
      error.data?.code !== "UNAUTHORIZED" &&
      error.data?.code !== "NOT_FOUND" &&
      failureCount < 3,
  });

  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-2 px-3 pt-3">
      {/* Link on the top left. */}
      <Link href="/" className="flex items-center gap-3">
        <Bird className="h-6 w-6" />
        <p className="text-lg font-bold">Oriole</p>
      </Link>
      {data && (
        <div className="flex items-center gap-3">
          {/* Dark mode / light mode toggle. */}
          <ModeToggle />
          {/* Dropdown menu for the user, if it exists. */}
          <DropdownMenu>
            <DropdownMenuTrigger>
              <Avatar className="mt-1">
                <AvatarImage
                  src={
                    data.avatarUrl
                      ? supabase.storage
                          .from("avatars")
                          .getPublicUrl(data.avatarUrl).data.publicUrl
                      : undefined
                  }
                />
                <AvatarFallback>
                  {data.name!.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => router.push(`/profile/${data.id}`)}
              >
                <UserRound /> My Profile
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={async () => {
                  await supabase.auth.signOut();
                  // Upon signing out, we need to hard-refresh the user profile
                  // query so that the header profile photo updates to indicate
                  // that there is no longer a valid user. We can select this
                  // specific query to refresh in the React Query client by
                  // supplying the query key.
                  apiUtils.profiles.getAuthedUserProfile.invalidate();
                  router.push("/login");
                  router.refresh();
                }}
              >
                <LogOut /> Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </header>
  );
}
