/**
 * Download utilities for videos and images
 */

// ============================================================================
// IMAGE SIZE PRESETS
// ============================================================================
// Different sizes optimized for social media platforms

export const imageSizePresets = {
  "instagram-square": {
    width: 1080,
    height: 1080,
    name: "Instagram Post",
    description: "Square (1080×1080)",
  },
  "instagram-story": {
    width: 1080,
    height: 1920,
    name: "Instagram Story",
    description: "Portrait (1080×1920)",
  },
  "twitter-header": {
    width: 1500,
    height: 500,
    name: "Twitter Header",
    description: "Banner (1500×500)",
  },
  "youtube-thumbnail": {
    width: 1280,
    height: 720,
    name: "YouTube Thumbnail",
    description: "Landscape (1280×720)",
  },
  "facebook-cover": {
    width: 820,
    height: 312,
    name: "Facebook Cover",
    description: "Wide (820×312)",
  },
  "profile-picture": {
    width: 400,
    height: 400,
    name: "Profile Picture",
    description: "Small Square (400×400)",
  },
  thumbnail: {
    width: 400,
    height: 300,
    name: "Thumbnail",
    description: "Small (400×300)",
  },
  original: {
    width: null,
    height: null,
    name: "Original Size",
    description: "Full resolution",
  },
} as const;

export type ImageSizePreset = keyof typeof imageSizePresets;

// ============================================================================
// CLOUDINARY URL GENERATION
// ============================================================================

/**
 * Get Cloudinary download URL for an image with specific dimensions
 */
export function getImageDownloadUrl(
  publicId: string,
  preset: ImageSizePreset,
): string {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

  if (!cloudName) {
    console.error("NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME is not set");
    return "";
  }

  const { width, height } = imageSizePresets[preset];

  // If original size, no transformations (but force download)
  if (!width || !height) {
    return `https://res.cloudinary.com/${cloudName}/image/upload/fl_attachment/${publicId}`;
  }

  // Apply transformations for specific size
  // c_fill = crop to fill the dimensions
  // q_auto = automatic quality optimization
  // f_auto = automatic format selection
  // fl_attachment = force download (don't open in browser)
  const transformation = `w_${width},h_${height},c_fill,q_auto,f_auto,fl_attachment`;

  return `https://res.cloudinary.com/${cloudName}/image/upload/${transformation}/${publicId}`;
}

/**
 * Get Cloudinary download URL for a video
 */
export function getVideoDownloadUrl(publicId: string): string {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

  if (!cloudName) {
    console.error("NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME is not set");
    return "";
  }

  // Download original video with fl_attachment flag to force download
  return `https://res.cloudinary.com/${cloudName}/video/upload/fl_attachment/${publicId}`;
}

// ============================================================================
// DOWNLOAD TRIGGER
// ============================================================================

/**
 * Trigger browser download for a file
 * Creates a temporary <a> tag and clicks it
 */
export function triggerDownload(url: string, filename: string): void {
  // Create temporary link
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.target = "_blank"; // Open in new tab as fallback

  // Append to body, click, and remove
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Download an image with a specific size preset
 */
export function downloadImage(
  publicId: string,
  title: string,
  preset: ImageSizePreset,
): void {
  const url = getImageDownloadUrl(publicId, preset);
  const presetInfo = imageSizePresets[preset];

  // Create filename: "title-instagram-square.jpg"
  const filename = `${title.replace(/\s+/g, "-").toLowerCase()}-${preset}.jpg`;

  triggerDownload(url, filename);
}

/**
 * Download a video
 */
export function downloadVideo(publicId: string, title: string): void {
  const url = getVideoDownloadUrl(publicId);

  // Create filename: "title.mp4"
  const filename = `${title.replace(/\s+/g, "-").toLowerCase()}.mp4`;

  triggerDownload(url, filename);
}
