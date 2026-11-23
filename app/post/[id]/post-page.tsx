/**
 * This page shows individual posts to the user based on its ID.
 *
 * This is a Client Component rendered by the server component in `page.tsx`,
 * which checks that the user is logged in and passes in the user and the
 * post ID from the URL as props.
 *
 * @author Ajay Gandecha <agandecha@unc.edu>
 * @license MIT
 * @see https://comp426-25f.github.io/
 */

"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import PostCard from "@/components/post";
import { Card } from "@/components/ui/card";
import { api } from "@/utils/trpc/api";
import { Subject } from "@/server/models/auth";

type PostPageProps = { user: Subject; postId: number };

export default function PostPage({ user, postId }: PostPageProps) {
  // Create necessary hooks for clients and providers.
  const router = useRouter();

  // Fetch the data for the single post using the post ID.
  const { data: post } = api.posts.getPost.useQuery({ postId });

  return (
    <div className="flex w-full flex-row justify-center px-3">
      <div className="mt-4 mb-12 w-full md:w-[600px]">
        <div className="pb-3">
          <Button variant="ghost" onClick={() => router.push("/")}>
            <ArrowLeft /> Back to Feed
          </Button>
        </div>
        {post && (
          <Card>
            <PostCard user={user} post={post} />
          </Card>
        )}
      </div>
    </div>
  );
}
