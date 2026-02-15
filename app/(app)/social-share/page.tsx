/**
 * SOCIAL SHARE PAGE - Download videos and images in different sizes
 *
 * FLOW:
 * 1. Component loads → Fetches videos & images from database (via API)
 * 2. User sees their media in cards (with thumbnails from Cloudinary)
 * 3. User can filter by "All", "Videos", or "Images"
 * 4. User clicks "Download" button
 *    - For videos: Direct download starts
 *    - For images: Dropdown shows size options → User selects → Download starts
 */

"use client";

import Link from "next/link";
import { useUser, UserButton } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import {
  formatFileSize,
  formatDuration,
  getCloudinaryThumbnailUrl,
} from "@/lib/format";
import Image from "next/image";
import DownloadDropdown from "./DownloadDropdown";
import { Download } from "lucide-react";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

type Video = {
  id: string;
  title: string;
  description: string | null;
  publicId: string;
  originalSize: number;
  compressedSize: number;
  duration: number;
  createdAt: string;
  updatedAt: string;
};

type Image = {
  id: string;
  title: string;
  description: string | null;
  publicId: string;
  originalSize: number;
  createdAt: string;
  updatedAt: string;
};

type FilterTab = "all" | "videos" | "images";

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export default function SocialSharePage() {
  const { user, isLoaded } = useUser();

  // Media data state
  const [videos, setVideos] = useState<Video[]>([]);
  const [images, setImages] = useState<Image[]>([]);

  // Filter state
  const [activeFilter, setActiveFilter] = useState<FilterTab>("all");

  // Loading and error state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ---------------------------------------------------------------------------
  // DATA FETCHING
  // ---------------------------------------------------------------------------

  useEffect(() => {
    const fetchMedia = async () => {
      try {
        const [videosResponse, imagesResponse] = await Promise.all([
          fetch("/api/video"),
          fetch("/api/image"),
        ]);

        if (!videosResponse.ok || !imagesResponse.ok) {
          throw new Error("Failed to fetch media");
        }

        const videosData = await videosResponse.json();
        const imagesData = await imagesResponse.json();

        setVideos(videosData);
        setImages(imagesData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchMedia();
  }, []);

  // ---------------------------------------------------------------------------
  // FILTERING LOGIC
  // ---------------------------------------------------------------------------

  const getFilteredContent = () => {
    if (activeFilter === "videos") return videos;
    if (activeFilter === "images") return images;
    return [...videos, ...images].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  };

  const filteredContent = getFilteredContent();
  const totalCount = videos.length + images.length;

  // ---------------------------------------------------------------------------
  // LOADING STATE
  // ---------------------------------------------------------------------------

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-900">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // MAIN RENDER
  // ---------------------------------------------------------------------------

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-900 via-zinc-800 to-zinc-900">
      {/* ===================================================================== */}
      {/* NAVIGATION BAR */}
      {/* ===================================================================== */}
      <nav className="border-b border-zinc-700 bg-zinc-900/50 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-8">
              <Link href="/dashboard">
                <h1 className="text-2xl font-bold text-white">VideoStore</h1>
              </Link>
              <div className="hidden md:flex gap-4">
                <Link
                  href="/dashboard"
                  className="rounded-md px-3 py-2 text-sm font-medium text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors"
                >
                  Dashboard
                </Link>
                <Link
                  href="/video-upload"
                  className="rounded-md px-3 py-2 text-sm font-medium text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors"
                >
                  Upload Video
                </Link>
                <Link
                  href="/image-upload"
                  className="rounded-md px-3 py-2 text-sm font-medium text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors"
                >
                  Upload Image
                </Link>
                <Link
                  href="/social-share"
                  className="rounded-md px-3 py-2 text-sm font-medium text-white bg-zinc-800"
                >
                  Social Share
                </Link>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden md:flex flex-col items-end">
                <p className="text-sm font-medium text-white">
                  {user?.fullName || user?.firstName || "User"}
                </p>
                <p className="text-xs text-zinc-400">
                  {user?.primaryEmailAddress?.emailAddress}
                </p>
              </div>
              <UserButton afterSignOutUrl="/" />
            </div>
          </div>
        </div>
      </nav>

      {/* ===================================================================== */}
      {/* MAIN CONTENT AREA */}
      {/* ===================================================================== */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-green-600/10">
              <Download className="w-6 h-6 text-green-500" />
            </div>
            <h2 className="text-3xl font-bold text-white">
              Download & Share
            </h2>
          </div>
          <p className="mt-2 text-zinc-400">
            Download your media in perfect sizes for social platforms like Instagram, YouTube, Twitter, and more.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="mb-12 grid grid-cols-1 gap-6 sm:grid-cols-3">
          <div className="rounded-lg border border-zinc-700 bg-zinc-800/50 p-6">
            <h3 className="text-sm font-medium text-zinc-400">Total Media</h3>
            <p className="mt-2 text-3xl font-bold text-white">{totalCount}</p>
          </div>
          <div className="rounded-lg border border-zinc-700 bg-zinc-800/50 p-6">
            <h3 className="text-sm font-medium text-zinc-400">Videos</h3>
            <p className="mt-2 text-3xl font-bold text-white">{videos.length}</p>
          </div>
          <div className="rounded-lg border border-zinc-700 bg-zinc-800/50 p-6">
            <h3 className="text-sm font-medium text-zinc-400">Images</h3>
            <p className="mt-2 text-3xl font-bold text-white">{images.length}</p>
          </div>
        </div>

        {/* Media Library Section */}
        <div>
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-2xl font-bold text-white">Your Media</h3>

            {/* Filter Tabs */}
            <div className="flex items-center gap-2 rounded-lg bg-zinc-800/50 p-1">
              <button
                onClick={() => setActiveFilter("all")}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeFilter === "all"
                    ? "bg-green-600 text-white"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                All ({totalCount})
              </button>
              <button
                onClick={() => setActiveFilter("videos")}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeFilter === "videos"
                    ? "bg-green-600 text-white"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                Videos ({videos.length})
              </button>
              <button
                onClick={() => setActiveFilter("images")}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeFilter === "images"
                    ? "bg-green-600 text-white"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                Images ({images.length})
              </button>
            </div>
          </div>

          {/* Content Grid */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-zinc-400">Loading media...</div>
            </div>
          ) : error ? (
            <div className="rounded-lg border border-red-500/50 bg-red-500/10 p-4">
              <p className="text-red-400">Error: {error}</p>
            </div>
          ) : filteredContent.length === 0 ? (
            <div className="rounded-lg border border-zinc-700 bg-zinc-800/50 p-12 text-center">
              <Download className="mx-auto h-12 w-12 text-zinc-600 mb-4" />
              <h3 className="text-lg font-semibold text-white">
                No {activeFilter === "all" ? "media" : activeFilter} yet
              </h3>
              <p className="mt-2 text-zinc-400">
                Upload some media to start downloading and sharing
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredContent.map((item) => {
                const isVideo = "duration" in item;
                const thumbnailUrl = getCloudinaryThumbnailUrl(
                  item.publicId,
                  isVideo ? "video" : "image"
                );

                return (
                  <div
                    key={item.id}
                    className="group rounded-lg border border-zinc-700 bg-zinc-800/50 transition-all hover:border-green-600/50 hover:shadow-lg hover:shadow-green-500/10"
                  >
                    {/* Thumbnail */}
                    <div className="relative aspect-video bg-zinc-900 overflow-hidden rounded-t-lg">
                      {thumbnailUrl ? (
                        <Image
                          src={thumbnailUrl}
                          alt={item.title}
                          fill
                          className="object-cover"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <Download className="h-12 w-12 text-zinc-600" />
                        </div>
                      )}

                      {/* Media Type Badge */}
                      <div className="absolute top-2 left-2">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium backdrop-blur-sm ${
                            isVideo
                              ? "bg-purple-500/90 text-white"
                              : "bg-green-500/90 text-white"
                          }`}
                        >
                          {isVideo ? "Video" : "Image"}
                        </span>
                      </div>

                      {/* Duration Badge for Videos */}
                      {isVideo && (
                        <div className="absolute bottom-2 right-2">
                          <span className="rounded bg-black/75 backdrop-blur-sm px-2 py-1 text-xs font-medium text-white">
                            {formatDuration((item as Video).duration)}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Card Content */}
                    <div className="p-4">
                      {/* Title */}
                      <h4 className="font-semibold text-white line-clamp-1 mb-3">
                        {item.title}
                      </h4>

                      {/* Metadata */}
                      <div className="flex items-center justify-between gap-3 mb-3">
                        <div className="flex items-center gap-3 text-xs text-zinc-500">
                          <span>
                            {formatFileSize(
                              isVideo
                                ? (item as Video).compressedSize
                                : item.originalSize
                            )}
                          </span>
                          {isVideo && (
                            <>
                              <span>•</span>
                              <span>{formatDuration((item as Video).duration)}</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Download Button */}
                      <DownloadDropdown
                        publicId={item.publicId}
                        title={item.title}
                        type={isVideo ? "video" : "image"}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
