/**
 * Common image upload utility for Cloudinary.
 * 1. Automatically compresses image on the client (~300KB WebP)
 * 2. Fetches signature from /api/upload-sign (authenticated only)
 * 3. Uploads directly to Cloudinary
 * 4. Returns the secure Cloudinary image URL
 */

export interface UploadImageOptions {
  folder?: string;
  maxSizeMB?: number;
  maxWidthOrHeight?: number;
  initialQuality?: number;
}

export async function uploadImage(
  file: File,
  options: UploadImageOptions = {}
): Promise<string> {
  const {
    folder = "alumni-hub",
    maxSizeMB = 0.35, // ~350KB target size
    maxWidthOrHeight = 1600,
    initialQuality = 0.8,
  } = options;

  // 1. Client-side compression
  let fileToUpload: File | Blob = file;
  try {
    const { default: imageCompression } = await import("browser-image-compression");
    fileToUpload = await imageCompression(file, {
      maxSizeMB,
      maxWidthOrHeight,
      useWebWorker: true,
      fileType: "image/webp",
      initialQuality,
    });
  } catch (compressionError) {
    console.warn("Client-side image compression skipped/failed, using original file:", compressionError);
  }

  // 2. Request signed upload credentials from our secure API
  const signResponse = await fetch("/api/upload-sign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ folder }),
  });

  if (!signResponse.ok) {
    const errData = await signResponse.json().catch(() => ({}));
    throw new Error(errData.error || `Upload signing failed (${signResponse.status})`);
  }

  const { signature, timestamp, apiKey, cloudName, folder: signedFolder } =
    await signResponse.json();

  // 3. Upload directly to Cloudinary
  const formData = new FormData();
  const safeName = file.name.replace(/\.[^.]+$/, "") + ".webp";
  formData.append("file", fileToUpload, safeName);
  formData.append("api_key", apiKey);
  formData.append("timestamp", String(timestamp));
  formData.append("signature", signature);
  if (signedFolder) {
    formData.append("folder", signedFolder);
  }

  const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
  const uploadResponse = await fetch(cloudinaryUrl, {
    method: "POST",
    body: formData,
  });

  if (!uploadResponse.ok) {
    const errData = await uploadResponse.json().catch(() => ({}));
    const message = errData?.error?.message || `Cloudinary upload failed (${uploadResponse.status})`;
    throw new Error(message);
  }

  const data = await uploadResponse.json();
  if (!data.secure_url) {
    throw new Error("Cloudinary upload succeeded but no secure_url was returned.");
  }

  return data.secure_url;
}
