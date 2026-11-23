/**
 * This is the signup page of the application, allowing users to register.
 *
 * @author Ajay Gandecha <agandecha@unc.edu>
 * @license MIT
 * @see https://comp426-25f.github.io/
 */

"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createSupabaseComponentClient } from "@/utils/supabase/clients/component";
import { api } from "@/utils/trpc/api";
import { AtSign, Bird } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SignUpPage() {
  // Create necessary hooks for clients and providers.
  const router = useRouter();
  const supabase = createSupabaseComponentClient();
  const apiUtils = api.useUtils();

  // Create states for each field in the form.
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [handle, setHandle] = useState("");
  const [password, setPassword] = useState("");

  // Creates the mutation function that, when called, calls the tRPC
  // API endpoint for handling a new user sign up.
  const { mutateAsync: handleNewUser } = api.profiles.handleNewUser.useMutation();

  // TODO: Handle the sign up request, alerting the user if there is
  // an error (using window.alert). If the signup is successful:
  // (1) Call the handleNewUser() function, passing in the selected
  //     name and handle, so that a new profile is added to the
  //     `profiles` database table. If this step is not performed, we will
  //     have a user registered with Supabase Auth but not have a profile
  //     for that user in our database.
  // (2) Then, the user should be redirected to the home page
  //     (using `router.push("/")`).
  //
  // Also, all cached results from React Query should be hard refreshed
  // so that the header can correctly display newly logged-in user. Since
  // this is a bit hard to figure out, I will give you the line of code
  // that does this:
  // ```ts
  // apiUtils.invalidate();
  // ```
  const signUp = async () => {
    try {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) {
        window.alert(error.message);
        return;
      }

      if (!data.session) {
        window.alert(
          "Check your email to confirm your account before signing in. No login session was created, so your profile has not been created yet.",
        );
        return;
      }

      await handleNewUser({ name, handle });
      await apiUtils.invalidate();
      router.push("/");
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Sign up failed.");
    }
  };
  
  return (
    <div className="bg-background flex min-h-[calc(100svh-164px)] flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col items-center gap-2">
              <a
                href="#"
                className="flex flex-col items-center gap-2 font-medium"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-md">
                  <Bird className="size-6" />
                </div>
              </a>
              <h1 className="text-xl font-bold">Welcome to Oriole!</h1>
              <div className="text-center text-sm">
                Already have an account?{" "}
                <Link href="/login" className="underline underline-offset-4">
                  Log in here!
                </Link>
              </div>
            </div>
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="m@example.com"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Sample Name"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Handle</Label>
                <div className="relative">
                  <AtSign className="absolute top-2.5 left-2 h-4 w-4" />
                  <Input
                    className="pl-8"
                    value={handle}
                    onChange={(e) => setHandle(e.target.value)}
                    placeholder="ramses"
                    required
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Password</Label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button className="w-full" onClick={signUp}>
                Sign Up
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
