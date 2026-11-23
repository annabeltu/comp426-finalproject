/**
 * This page shows profiles to the user based on its ID. If the profile page
 * is the user's own page, they can change their profile picture.
 *
 * This is a Client Component rendered by the server component in `page.tsx`,
 * which checks that the user is logged in and passes in the user and the
 * profile ID from the URL as props.
 *
 * @author Ajay Gandecha <agandecha@unc.edu>
 * @license MIT
 * @see https://comp426-25f.github.io/
 */

"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ArrowLeft, Bell, BellOff, ImageOff, ImageUp } from "lucide-react";
import { createSupabaseComponentClient } from "@/utils/supabase/clients/component";
import { useRouter } from "next/navigation";
import PostFeed from "@/components/feed";
import { Separator } from "@/components/ui/separator";
import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { api } from "@/utils/trpc/api";
import { uploadAvatarFileToSupabase } from "@/utils/supabase/storage";
import { Subject } from "@/server/models/auth";
import Loading from "@/components/loading";

type PublicProfilePageProps = { user: Subject; profileId: string };

export default function PublicProfilePage({
  user,
  profileId,
}: PublicProfilePageProps) {
  // Create necessary hooks for clients and providers.
  const router = useRouter();
  const supabase = createSupabaseComponentClient();
  const apiUtils = api.useUtils();

  // Load the profile data using the profile ID.
  const { data: profile, isLoading: profileLoading } =
    api.profiles.getProfile.useQuery({ profileId });

  // Create a state to determine if the user is following the profile.
  // This will be updated optimistically when the user clicks the follow button,
  // meaning that the user will not have to wait for the server to respond to
  // see the change on the UI.
  const { data: isFollowing } = api.profiles.getIsUserFollowingProfile.useQuery(
    { profileId },
  );

  // Infinite query to fetch the user's posts from the server.
  const {
    data: posts,
    isLoading: postsLoading,
    fetchNextPage: fetchNextPage,
  } = api.profiles.getPostsForProfile.useInfiniteQuery(
    { profileId },
    {
      initialCursor: 0,
      getNextPageParam: (lastPage, pages) => pages.length * lastPage.length,
    },
  );

  // Mutation for toggling the follow button.
  const { mutate: toggleFollowing } =
    api.profiles.toggleFollowingProfile.useMutation();

  // Handle the follow button press. This will both call to update the
  // database as well as optimistically update the UI to reflect the new state.
  const followButtonPressed = async () => {
    toggleFollowing({ profileId });
    apiUtils.profiles.getIsUserFollowingProfile.setData(
      { profileId },
      (prev) => !prev,
    );
  };

  // Check if the profile is the user's own profile.
  const isPersonalPage = user.id === profileId;

  // The input ref points to the hidden HTML file input element that
  // can be "clicked" to open the file picker.
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  // The selected file is the file that the user has selected to upload.
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Mutations for uploading a profile picture.
  const { mutate: updateProfilePicture } =
    api.profiles.updateProfilePicture.useMutation();

  // When the user selects a file, we will upload it to Supabase and update
  // the profile picture. This will also optimistically update the UI
  // to reflect the new profile picture.
  // The `queryClient.resetQueries()` call will refresh the profile data
  // so that the new profile picture is displayed.
  useEffect(() => {
    if (selectedFile) {
      uploadAvatarFileToSupabase(supabase, user, selectedFile, (avatarUrl) => {
        updateProfilePicture(
          { avatarUrl },
          {
            onSuccess: () => {
              setSelectedFile(null);
              apiUtils.invalidate();
            },
          },
        );
      });
    }
  }, [apiUtils, selectedFile, supabase, updateProfilePicture, user]);

  return (
    <div className="flex w-full flex-row justify-center px-3">
      <div className="mt-4 mb-12 w-full md:w-[600px]">
        <div className="pb-3">
          <Button variant="ghost" onClick={() => router.push("/")}>
            <ArrowLeft /> Back to Feed
          </Button>
        </div>
        {profile && (
          <Card>
            <CardContent className="space-y-2 py-6">
              <div className="flex w-full flex-row items-center justify-between gap-3">
                <div className="flex flex-row items-center gap-3">
                  <Avatar className="mt-1">
                    <AvatarImage
                      src={
                        profile.avatarUrl
                          ? supabase.storage
                              .from("avatars")
                              .getPublicUrl(profile.avatarUrl).data.publicUrl
                          : undefined
                      }
                    />
                    <AvatarFallback>
                      {profile.name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <p className="text-primary font-bold">{profile.name}</p>

                  <p className="text-muted-foreground ml-3">
                    @{profile.handle}
                  </p>
                </div>
                {!isPersonalPage && isFollowing !== undefined && (
                  <Button
                    variant={isFollowing ? "secondary" : "default"}
                    onClick={followButtonPressed}
                  >
                    {isFollowing ? <BellOff /> : <Bell />}{" "}
                    {isFollowing ? "Unfollow" : "Follow"}
                  </Button>
                )}
                {isPersonalPage &&
                  (profile.avatarUrl ? (
                    <Button
                      variant="secondary"
                      size="icon"
                      aria-label="Remove profile picture"
                      onClick={() => {
                        updateProfilePicture(
                          { avatarUrl: null },
                          {
                            onSuccess: () => {
                              apiUtils.invalidate();
                            },
                            onError: (error) => {
                              window.alert(error.message);
                            },
                          },
                        );
                      }}
                    >
                      <ImageOff />
                    </Button>
                  ) : (
                    <>
                      <Input
                        className="hidden"
                        type="file"
                        ref={fileInputRef}
                        accept="image/*"
                        onChange={(e) =>
                          setSelectedFile(
                            (e.target.files ?? []).length > 0
                              ? e.target.files![0]
                              : null,
                          )
                        }
                      />
                      <Button
                        onClick={() => {
                          if (fileInputRef && fileInputRef.current)
                            fileInputRef.current.click();
                        }}
                      >
                        <ImageUp /> Change Avatar
                      </Button>
                    </>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}
        {profileLoading && (
          <Card>
            <CardContent className="space-y-2 py-6">
              <Loading />
            </CardContent>
          </Card>
        )}
        <div className="bg-card text-card-foreground mt-4 w-full rounded-xl border shadow">
          <div className="flex flex-row items-center justify-between px-3 py-4">
            <p className="text-lg font-bold">
              {isPersonalPage ? "Your" : `${profile?.name}'s`} Recent Posts
            </p>
          </div>
          <Separator />
          <PostFeed
            user={user}
            posts={posts}
            postsLoading={postsLoading}
            fetchNext={fetchNextPage}
          />
        </div>
      </div>
    </div>
  );
}
