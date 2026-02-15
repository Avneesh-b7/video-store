/**
 * Format file size from bytes to human-readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Format duration from seconds to mm:ss or hh:mm:ss
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Get Cloudinary thumbnail URL
 */
export function getCloudinaryThumbnailUrl(publicId: string, type: 'image' | 'video'): string {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

  if (!cloudName) {
    console.warn('NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME is not set');
    return '';
  }

  // Common transformation for thumbnails: 400px wide, auto quality, auto format
  const transformation = 'w_400,h_300,c_fill,q_auto,f_auto';

  if (type === 'video') {
    // For videos, get the first frame as thumbnail
    return `https://res.cloudinary.com/${cloudName}/video/upload/${transformation}/${publicId}.jpg`;
  }

  // For images
  return `https://res.cloudinary.com/${cloudName}/image/upload/${transformation}/${publicId}`;
}
