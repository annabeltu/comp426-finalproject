/**
 * Helper file that abstracts functionality for uploading images to Supabase storage.
 *
 * @author Ajay Gandecha <agandecha@unc.edu>
 * @license MIT
 * @see https://comp426-25f.github.io/
 */

import { Subject } from "@/server/models/auth";
import { SupabaseClient } from "@supabase/supabase-js";

export const uploadPostFileToSupabase = async (
  supabase: SupabaseClient,
  subject: Subject,
  file: File,
  onSuccess: (attachmentUrl: string) => void
) => {
  const currentTimestamp = Date.now().toLocaleString();
  const { data: fileData, error: uploadError } = await supabase.storage
    .from("images")
    .upload(`upload_${subject.id}_${currentTimestamp}`, file);

  if (uploadError) {
    console.error({
      code: "INTERNAL_SERVER_ERROR",
      message: `Failed to upload file to Supabase: ${uploadError.message}`,
    });
  } else {
    onSuccess(fileData.path);
  }
};

export const uploadAvatarFileToSupabase = async (
  supabase: SupabaseClient,
  subject: Subject,
  file: File,
  onSuccess: (avatarUrl: string) => void
) => {
  // A new path prevents cached avatars from being reused after replacement.
  const avatarPath = `${subject.id}_${crypto.randomUUID()}`;
  const { data: fileData, error: uploadError } = await supabase.storage
    .from(`avatars`)
    .upload(avatarPath, file);

  if (uploadError) {
    console.error({
      code: "INTERNAL_SERVER_ERROR",
      message: `Failed to upload file to Supabase: ${uploadError.message}`,
    });
  } else {
    onSuccess(fileData.path);
  }
};
