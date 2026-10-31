import { createClient } from "./supabase";
import { uploadImage } from "./uploadImage";
import { getOptimizedImageUrl } from "./cloudinary";

export { uploadImage, getOptimizedImageUrl };

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

export function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Something went wrong";
}

export function sanitizeSearchQuery(value: string): string {
  return value.replace(/[,%()]/g, " ").replace(/\s+/g, " ").trim();
}

export async function compressAndUploadImage(
  file: File,
  bucket: string,
  _path?: string
): Promise<string | null> {
  try {
    return await uploadImage(file, {
      folder: `alumni-hub/${bucket}`,
      maxSizeMB: 0.35,
      maxWidthOrHeight: 1200,
    });
  } catch (err: unknown) {
    console.error("Image upload failed:", err);
    throw err;
  }
}

export async function compressAndUploadGalleryImage(
  file: File,
  _path?: string
): Promise<string | null> {
  try {
    return await uploadImage(file, {
      folder: "alumni-hub/gallery",
      maxSizeMB: 0.4,
      maxWidthOrHeight: 1600,
    });
  } catch (err: unknown) {
    console.error("Gallery image upload failed:", err);
    throw err;
  }
}

export function getAvatarUrl(url: string | null): string {
  if (!url) return "";
  if (url.startsWith("http")) {
    if (url.includes("res.cloudinary.com")) {
      return getOptimizedImageUrl(url, { width: 160, height: 160, crop: "fill" });
    }
    return url;
  }
  const supabase = createClient();
  const {
    data: { publicUrl },
  } = supabase.storage.from("avatars").getPublicUrl(url);
  return publicUrl;
}
