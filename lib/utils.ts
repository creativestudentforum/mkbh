import imageCompression from "browser-image-compression";
import { createClient } from "./supabase";

export function cn(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(" ");
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export async function compressAndUploadImage(
  file: File,
  bucket: string,
  path: string
): Promise<string | null> {
  try {
    const options = {
      maxSizeMB: 0.5,
      maxWidthOrHeight: 800,
      useWebWorker: true,
    };
    const compressedFile = await imageCompression(file, options);

    const supabase = createClient();
    const { error } = await supabase.storage
      .from(bucket)
      .upload(path, compressedFile, {
        upsert: true,
        contentType: compressedFile.type,
      });

    if (error) throw error;

    const {
      data: { publicUrl },
    } = supabase.storage.from(bucket).getPublicUrl(path);

    return publicUrl;
  } catch (err: any) {
    console.error("Image upload failed:", err);
    throw err;
  }
}

export function getAvatarUrl(url: string | null): string {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  const supabase = createClient();
  const {
    data: { publicUrl },
  } = supabase.storage.from("avatars").getPublicUrl(url);
  return publicUrl;
}
