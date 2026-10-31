/**
 * Cloudinary image URL optimization helper.
 * Adds dynamic on-the-fly transformations (auto-format, auto-quality, responsive sizing)
 * while safely preserving legacy Supabase or external URLs.
 */

export interface ImageOptimizationOptions {
  width?: number;
  height?: number;
  crop?: "fill" | "limit" | "fit" | "thumb" | "scale";
  quality?: "auto" | number;
  format?: "auto" | "webp" | "avif";
}

export function getOptimizedImageUrl(
  url: string | null | undefined,
  options: ImageOptimizationOptions = {}
): string {
  if (!url) return "";
  if (!url.includes("res.cloudinary.com") || !url.includes("/image/upload/")) {
    return url;
  }

  const {
    width,
    height,
    crop = width && height ? "fill" : "limit",
    quality = "auto",
    format = "auto",
  } = options;

  const parts = url.split("/image/upload/");
  if (parts.length !== 2) return url;

  const transforms: string[] = [`f_${format}`, `q_${quality}`];
  if (width) transforms.push(`w_${width}`);
  if (height) transforms.push(`h_${height}`);
  if (width || height) transforms.push(`c_${crop}`);

  const transformString = transforms.join(",");

  // Strip existing transformation segment if present
  let rest = parts[1];
  const match = rest.match(/^(?:(?:[a-z]_[a-zA-Z0-9]+,?)+\/)?(.*)$/);
  if (match && match[1]) {
    rest = match[1];
  }

  return `${parts[0]}/image/upload/${transformString}/${rest}`;
}
