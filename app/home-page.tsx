/**
 * This is the home page of the application, showing the feed of posts and
 * the ability to create new posts.
 *
 * This is a Client Component, so it can use React hooks (useState, useRef)
 * and the tRPC hooks. It is rendered by the server component in `page.tsx`,
 * which checks that the user is logged in and passes the user in as a prop.
 *
 * @author Ajay Gandecha <agandecha@unc.edu>
 * @license MIT
 * @see https://comp426-25f.github.io/
 */

"use client";

import PostFeed from "@/components/feed";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Subject } from "@/server/models/auth";
import { Profile } from "@/server/models/responses";
import { createSupabaseComponentClient } from "@/utils/supabase/clients/component";
import { uploadPostFileToSupabase } from "@/utils/supabase/storage";
import { api } from "@/utils/trpc/api";
import {
  ChevronsDown,
  ChevronsLeft,
  ImagePlus,
  Loader2Icon,
  RotateCcw,
  Send,
  X,
} from "lucide-react";
import { useRef, useState } from "react";
import z from "zod";

// Define the tabs for the home page as a enum for easy comparisons.
enum HomePageTab {
  FEED = "Feed",
  FOLLOWING = "Following",
  LIKED = "Liked",
}

type HomePageProps = { user: Subject };
export default function HomePage({ user }: HomePageProps) {
  // Create necessary hooks for clients and providers.
  const apiUtils = api.useUtils();
  const supabase = createSupabaseComponentClient();

  // Create state for the selected tab.
  const [activeTab, setActiveTab] = useState<string>(HomePageTab.FEED);

  // Create states for posting.
  const [expandPostDraft, setExpandPostDraft] = useState<boolean>(true);
  const [postDraftText, setPostDraftText] = useState<string>("");

  // Create states to handle selecting and uploading files.

  // The input ref points to the hidden HTML file input element that
  // can be "clicked" to open the file picker.
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  // The selected file is the file that the user has selected to upload.
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Fetch details about the currently signed in user's profile
  const { data: profile } = api.profiles.getAuthedUserProfile.useQuery();

  // Determine which data fetching function should be used in the post loader
  // based on the actively selected tab.
  const fetchDataRoute =
    activeTab === HomePageTab.FEED
      ? api.posts.getFeed
      : activeTab === HomePageTab.FOLLOWING
        ? api.posts.getFollowingFeed
        : api.posts.getLikesFeed;

  // Infinite query to fetch the posts from the server.

  // Each page holds up to 25 posts. A page with fewer than 25 posts is the
  // last one, so there is no next page to fetch (`undefined`). Otherwise, the
  // next cursor is the number of posts loaded so far.
  const {
    data: posts,
    isLoading: postsLoading,
    fetchNextPage,
  } = fetchDataRoute.useInfiniteQuery(
    {},
    {
      initialCursor: 0,
      getNextPageParam: (lastPage, pages) =>
        lastPage.length < 25 ? undefined : pages.length * 25,
    },
  );

  // -----------------------------------------------------------------------------------

  // Function to hard refresh all React Query queries to get the latest data.
  // NOTE: This is not best practice. Later, we will use a tool talled `tRPC`
  // whose APIs make this a bit easier to do and also to follow.
  const refresh = () => {
    return apiUtils.invalidate();
  };

  // Create the mutations for uploading a file and creating a post.
  const { mutate: createPost } = api.posts.createPost.useMutation();

  // State used to show the loading spinner on the post button
  const [isPosting, setIsPosting] = useState(false);

  // Function to publish a post.
  // Publishing a post also should clear any post draft text, remove any selected
  // file, and hard refresh the feed.
  const publishPost = async () => {
    setIsPosting(true);
    const onPostSuccess = () => {
      setPostDraftText("");
      setSelectedFile(null);
      refresh().then(() => setIsPosting(false));
    };
    if (selectedFile) {
      uploadPostFileToSupabase(
        supabase,
        user,
        selectedFile,
        (attachmentUrl) => {
          createPost(
            { content: postDraftText, attachmentUrl: attachmentUrl },
            {
              onSuccess: onPostSuccess,
            },
          );
        },
      );
    } else {
      createPost({ content: postDraftText }, { onSuccess: onPostSuccess });
    }
  };

  return (
    <div className="flex w-full flex-row justify-center px-3">
      <div className="mt-4 mb-12 w-full md:w-[600px]">
        {/* Write a Post Card */}
        <Card>
          <CardHeader className="pt-3 pb-3">
            <div className="flex flex-row items-center justify-between">
              <CardTitle>Write a Post</CardTitle>
              {expandPostDraft ? (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setExpandPostDraft(false)}
                >
                  <ChevronsDown />
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setExpandPostDraft(true)}
                >
                  <ChevronsLeft />
                </Button>
              )}
            </div>
          </CardHeader>
          {/* Only show the body of the card if the post draft is expanded. */}
          {expandPostDraft && (
            <>
              <CardContent className="space-y-2 pb-3">
                <div className="flex w-full flex-row gap-3">
                  <Avatar className="mt-1">
                    <AvatarImage
                      src={
                        profile?.avatarUrl
                          ? supabase.storage
                              .from("avatars")
                              .getPublicUrl(profile?.avatarUrl).data.publicUrl
                          : undefined
                      }
                    />
                    <AvatarFallback>
                      {profile?.name.slice(0, 2).toUpperCase() ?? ""}
                    </AvatarFallback>
                  </Avatar>
                  <Textarea
                    value={postDraftText}
                    onChange={(e) => setPostDraftText(e.target.value)}
                    className="h-28"
                    placeholder="Post your thoughts here!"
                  ></Textarea>
                </div>
              </CardContent>
              <CardFooter className="pb-3">
                <div className="ml-auto flex flex-row gap-3">
                  {/* File inputs are handled here. */}
                  {/* 
                  This hidden input provides us the functionality to handle selecting
                  new  pages. This input only accepts images, and when a file is selected,
                  the file is stored in the `selectedFile` state.
                  */}
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
                  {selectedFile ? (
                    <Button
                      variant="secondary"
                      onClick={() => setSelectedFile(null)}
                    >
                      <ImagePlus />
                      <p className="max-w-[300px] overflow-hidden text-sm text-ellipsis">
                        {selectedFile.name}
                      </p>
                      <X />
                    </Button>
                  ) : (
                    <Button
                      variant="secondary"
                      size="icon"
                      onClick={() => {
                        if (fileInputRef && fileInputRef.current)
                          fileInputRef.current.click();
                      }}
                    >
                      <ImagePlus />
                    </Button>
                  )}
                  {/* The button to publish the post is only enabled when tex
                   has been entered into the text area. */}
                  <Button
                    onClick={publishPost}
                    disabled={postDraftText.length === 0 || isPosting}
                  >
                    {isPosting ? (
                      <>
                        <Loader2Icon className="animate-spin" /> Posting...
                      </>
                    ) : (
                      <>
                        <Send /> Post
                      </>
                    )}
                  </Button>
                </div>
              </CardFooter>
            </>
          )}
        </Card>

        {/* Display all three tabs for each feed + the refresh button. */}
        {/* Update the `activeTab` state when the tab changes. */}
        <Tabs
          value={activeTab.toString()}
          onValueChange={(tab) => setActiveTab(tab)}
          className="mt-8 w-full"
        >
          <div className="flex w-100 flex-row gap-2">
            <TabsList className="grid w-full grow grid-cols-3">
              <TabsTrigger value={HomePageTab.FEED}>Feed</TabsTrigger>
              <TabsTrigger value={HomePageTab.FOLLOWING}>Following</TabsTrigger>
              <TabsTrigger value={HomePageTab.LIKED}>Liked</TabsTrigger>
            </TabsList>
            <Button
              className="rounded-lg"
              variant="secondary"
              size="icon"
              onClick={refresh}
            >
              <RotateCcw />
            </Button>
          </div>
        </Tabs>

        {/* Scroll area containing the feed. */}
        <div className="bg-card text-card-foreground mt-6 rounded-xl border shadow">
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
