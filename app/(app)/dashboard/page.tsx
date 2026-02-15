/**
 * DASHBOARD PAGE - Main page where users see all their uploaded videos and images
 *
 * FLOW:
 * 1. Component loads → Fetches videos & images from database (via API)
 * 2. User sees their media in cards (with thumbnails from Cloudinary)
 * 3. User can filter by "All", "Videos", or "Images"
 * 4. User clicks a video card → Modal opens with video player
 * 5. Video plays from Cloudinary (streaming, like YouTube)
 */

"use client"; // This makes it a Client Component (can use useState, onClick, etc.)

import Link from "next/link";
import { useUser, UserButton } from "@clerk/nextjs"; // Clerk = Authentication
import { useEffect, useState } from "react";
import {
  formatFileSize, // Converts bytes → "2 MB"
  formatDuration, // Converts seconds → "2:05"
  getCloudinaryThumbnailUrl, // Generates Cloudinary thumbnail URL
} from "@/lib/format";
import Image from "next/image";
import VideoPreviewModal from "./VideoPreviewModal"; // Modal that plays videos
import DeleteConfirmDialog from "./DeleteConfirmDialog"; // Delete confirmation dialog
import { Trash2 } from "lucide-react"; // Trash icon

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================
// These define the shape of data we get from the database

type Video = {
  id: string; // Unique ID in database
  title: string; // Video title (user input)
  description: string | null; // Optional description
  publicId: string; // Address of video on Cloudinary (like "videos/user_123/12345")
  originalSize: number; // Original file size in bytes
  compressedSize: number; // Compressed size in bytes (after Cloudinary optimization)
  duration: number; // Length of video in seconds
  createdAt: string; // When it was uploaded
  updatedAt: string; // Last updated
};

type Image = {
  id: string;
  title: string;
  description: string | null;
  publicId: string; // Address of image on Cloudinary
  originalSize: number;
  createdAt: string;
  updatedAt: string;
};

type FilterTab = "all" | "videos" | "images"; // Filter options

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export default function DashboardPage() {
  // ---------------------------------------------------------------------------
  // STATE MANAGEMENT
  // ---------------------------------------------------------------------------
  // State = data that can change and triggers re-renders when updated

  const { user, isLoaded } = useUser(); // Get logged-in user from Clerk

  // Arrays to store videos and images fetched from database
  const [videos, setVideos] = useState<Video[]>([]);
  const [images, setImages] = useState<Image[]>([]);

  // Which filter tab is active? (all/videos/images)
  const [activeFilter, setActiveFilter] = useState<FilterTab>("all");

  // Loading state - shows "Loading..." while fetching data
  const [loading, setLoading] = useState(true);

  // Error state - stores error message if fetch fails
  const [error, setError] = useState<string | null>(null);

  // Which video is currently being previewed in the modal? (null = no video selected)
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);

  // Delete functionality state
  const [itemToDelete, setItemToDelete] = useState<{
    id: string;
    title: string;
    type: "video" | "image";
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // ---------------------------------------------------------------------------
  // DATA FETCHING
  // ---------------------------------------------------------------------------
  // useEffect runs when component first loads (like componentDidMount)
  // The empty array [] means "run once on mount"

  useEffect(() => {
    const fetchMedia = async () => {
      try {
        // STEP 1: Fetch videos and images from API routes (in parallel for speed)
        // These API routes query the database and return JSON
        const [videosResponse, imagesResponse] = await Promise.all([
          fetch("/api/video"), // GET /api/video → Returns user's videos from database
          fetch("/api/image"), // GET /api/image → Returns user's images from database
        ]);

        // STEP 2: Check if both requests succeeded
        if (!videosResponse.ok || !imagesResponse.ok) {
          throw new Error("Failed to fetch media");
        }

        // STEP 3: Convert responses from JSON to JavaScript objects
        const videosData = await videosResponse.json();
        const imagesData = await imagesResponse.json();

        // STEP 4: Update state with fetched data
        // This triggers a re-render, showing the media cards
        setVideos(videosData);
        setImages(imagesData);
      } catch (err) {
        // If anything goes wrong, store error message
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        // Always set loading to false (whether success or error)
        setLoading(false);
      }
    };

    // Actually call the function to fetch data
    fetchMedia();
  }, []); // Empty array = run only once when component mounts

  // ---------------------------------------------------------------------------
  // DELETE FUNCTIONALITY
  // ---------------------------------------------------------------------------

  /**
   * handleDelete - Deletes a video or image
   *
   * Flow:
   * 1. User confirms deletion in dialog
   * 2. Call DELETE API endpoint
   * 3. Remove item from local state (videos or images array)
   * 4. Close dialog
   */
  const handleDelete = async () => {
    if (!itemToDelete) return;

    setIsDeleting(true);

    try {
      // Call DELETE API endpoint
      const endpoint =
        itemToDelete.type === "video"
          ? `/api/video/${itemToDelete.id}`
          : `/api/image/${itemToDelete.id}`;

      const response = await fetch(endpoint, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete");
      }

      // Remove from local state to update UI immediately
      if (itemToDelete.type === "video") {
        setVideos((prev) => prev.filter((v) => v.id !== itemToDelete.id));
      } else {
        setImages((prev) => prev.filter((i) => i.id !== itemToDelete.id));
      }

      // Close dialog
      setItemToDelete(null);
    } catch (err) {
      console.error("Delete error:", err);
      alert(
        err instanceof Error
          ? err.message
          : "Failed to delete. Please try again.",
      );
    } finally {
      setIsDeleting(false);
    }
  };

  // ---------------------------------------------------------------------------
  // FILTERING LOGIC
  // ---------------------------------------------------------------------------
  // This function returns the filtered content based on active tab

  const getFilteredContent = () => {
    if (activeFilter === "videos") return videos; // Show only videos
    if (activeFilter === "images") return images; // Show only images

    // "all" - combine videos and images, then sort by newest first
    return [...videos, ...images].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  };

  const filteredContent = getFilteredContent(); // Get the filtered items to display
  const totalCount = videos.length + images.length; // Total number of items

  // ---------------------------------------------------------------------------
  // LOADING STATE
  // ---------------------------------------------------------------------------
  // If user info hasn't loaded yet from Clerk, show loading screen

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
    <div className="min-h-screen bg-linear-to-b from-zinc-900 via-zinc-800 to-zinc-900">
      {/* ===================================================================== */}
      {/* NAVIGATION BAR */}
      {/* ===================================================================== */}
      <nav className="border-b border-zinc-700 bg-zinc-900/50 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Left side - Logo and nav links */}
            <div className="flex items-center gap-8">
              <Link href="/dashboard">
                <h1 className="text-2xl font-bold text-white">VideoStore</h1>
              </Link>
              <div className="hidden md:flex gap-4">
                <Link
                  href="/dashboard"
                  className="rounded-md px-3 py-2 text-sm font-medium text-white bg-zinc-800"
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
                  className="rounded-md px-3 py-2 text-sm font-medium text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors"
                >
                  Social Share
                </Link>
              </div>
            </div>

            {/* Right side - User info and sign out button */}
            <div className="flex items-center gap-3">
              <div className="hidden md:flex flex-col items-end">
                <p className="text-sm font-medium text-white">
                  {user?.fullName || user?.firstName || "User"}
                </p>
                <p className="text-xs text-zinc-400">
                  {user?.primaryEmailAddress?.emailAddress}
                </p>
              </div>
              {/* Clerk's pre-built sign-out button */}
              <UserButton afterSignOutUrl="/" />
            </div>
          </div>
        </div>
      </nav>

      {/* ===================================================================== */}
      {/* MAIN CONTENT AREA */}
      {/* ===================================================================== */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-white">
            Welcome back, {user?.firstName || "User"}!
          </h2>
          <p className="mt-2 text-zinc-400">
            Manage your media library and explore new content
          </p>
        </div>

        {/* ================================================================= */}
        {/* QUICK ACTION CARDS */}
        {/* ================================================================= */}
        <div className="mb-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {/* Upload Video Card */}
          <Link
            href="/video-upload"
            className="group rounded-lg border border-zinc-700 bg-zinc-800/50 p-6 transition-all hover:border-blue-500 hover:bg-zinc-800"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-600 group-hover:bg-blue-500 transition-colors">
              <svg
                className="h-6 w-6 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
            </div>
            <h3 className="mt-4 text-lg font-semibold text-white">
              Upload Video
            </h3>
            <p className="mt-2 text-sm text-zinc-400">
              Upload and share your videos with the world
            </p>
          </Link>

          {/* Upload Image Card */}
          <Link
            href="/image-upload"
            className="group rounded-lg border border-zinc-700 bg-zinc-800/50 p-6 transition-all hover:border-blue-500 hover:bg-zinc-800"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-600 group-hover:bg-blue-500 transition-colors">
              <svg
                className="h-6 w-6 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h3 className="mt-4 text-lg font-semibold text-white">
              Upload Image
            </h3>
            <p className="mt-2 text-sm text-zinc-400">
              Upload and share your images with the world
            </p>
          </Link>

          {/* Social Share Card */}
          <Link
            href="/social-share"
            className="group rounded-lg border border-zinc-700 bg-zinc-800/50 p-6 transition-all hover:border-blue-500 hover:bg-zinc-800"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-600 group-hover:bg-blue-500 transition-colors">
              <svg
                className="h-6 w-6 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                />
              </svg>
            </div>
            <h3 className="mt-4 text-lg font-semibold text-white">
              Share Socially
            </h3>
            <p className="mt-2 text-sm text-zinc-400">
              Share your content across social platforms
            </p>
          </Link>

          {/* Total Media Count Card */}
          <div className="rounded-lg border border-zinc-700 bg-zinc-800/50 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-zinc-700">
              <svg
                className="h-6 w-6 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <h3 className="mt-4 text-lg font-semibold text-white">
              Total Media
            </h3>
            <p className="mt-2 text-3xl font-bold text-white">{totalCount}</p>
            <p className="mt-1 text-xs text-zinc-500">
              {videos.length} videos • {images.length} images
            </p>
          </div>
        </div>

        {/* ================================================================= */}
        {/* MEDIA LIBRARY SECTION */}
        {/* ================================================================= */}
        <div>
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-2xl font-bold text-white">Media Library</h3>

            {/* Filter Tabs - Click to filter by all/videos/images */}
            <div className="flex items-center gap-2 rounded-lg bg-zinc-800/50 p-1">
              {/* "All" tab */}
              <button
                onClick={() => setActiveFilter("all")} // When clicked, update activeFilter state
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeFilter === "all"
                    ? "bg-blue-600 text-white" // Active styling
                    : "text-zinc-400 hover:text-white" // Inactive styling
                }`}
              >
                All ({totalCount})
              </button>

              {/* "Videos" tab */}
              <button
                onClick={() => setActiveFilter("videos")}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeFilter === "videos"
                    ? "bg-blue-600 text-white"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                Videos ({videos.length})
              </button>

              {/* "Images" tab */}
              <button
                onClick={() => setActiveFilter("images")}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeFilter === "images"
                    ? "bg-blue-600 text-white"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                Images ({images.length})
              </button>
            </div>
          </div>

          {/* =============================================================== */}
          {/* CONDITIONAL RENDERING - Show different UI based on state */}
          {/* =============================================================== */}

          {/* CASE 1: Still loading data */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-zinc-400">Loading media...</div>
            </div>
          ) : /* CASE 2: Error occurred */
          error ? (
            <div className="rounded-lg border border-red-500/50 bg-red-500/10 p-4">
              <p className="text-red-400">Error: {error}</p>
            </div>
          ) : /* CASE 3: No media to show (empty state) */
          filteredContent.length === 0 ? (
            <div className="rounded-lg border border-zinc-700 bg-zinc-800/50 p-12 text-center">
              <svg
                className="mx-auto h-12 w-12 text-zinc-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
                />
              </svg>
              <h3 className="mt-4 text-lg font-semibold text-white">
                No {activeFilter === "all" ? "media" : activeFilter} yet
              </h3>
              <p className="mt-2 text-zinc-400">
                Upload your first{" "}
                {activeFilter === "all"
                  ? "media files"
                  : activeFilter === "videos"
                    ? "video"
                    : "image"}{" "}
                to get started
              </p>
              {/* Upload buttons */}
              <div className="mt-6 flex items-center justify-center gap-3">
                {(activeFilter === "all" || activeFilter === "videos") && (
                  <Link
                    href="/video-upload"
                    className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
                  >
                    Upload Video
                  </Link>
                )}
                {(activeFilter === "all" || activeFilter === "images") && (
                  <Link
                    href="/image-upload"
                    className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
                  >
                    Upload Image
                  </Link>
                )}
              </div>
            </div>
          ) : (
            /* CASE 4: Show the media grid */
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {/*
                Loop through each item in filteredContent and create a card
                .map() is like a for loop that returns JSX for each item
              */}
              {filteredContent.map((item) => {
                // Check if this item is a video or image
                // Videos have a "duration" field, images don't
                const isVideo = "duration" in item;

                // Generate Cloudinary thumbnail URL using the publicId
                // Example: "https://res.cloudinary.com/cloud-name/video/upload/w_400,h_300/videos/user_123/12345.jpg"
                const thumbnailUrl = getCloudinaryThumbnailUrl(
                  item.publicId, // Address on Cloudinary
                  isVideo ? "video" : "image", // Type determines the URL format
                );

                return (
                  <div
                    key={item.id} // Unique key for React's rendering optimization
                    className={`group rounded-lg border border-zinc-700 bg-zinc-800/50 overflow-hidden transition-all hover:border-zinc-600 hover:shadow-lg hover:shadow-blue-500/10 ${
                      isVideo ? "cursor-pointer" : "" // Videos are clickable (cursor changes to pointer)
                    }`}
                    // CLICK HANDLER - When video card is clicked, open modal
                    onClick={() => isVideo && setSelectedVideo(item as Video)}
                  >
                    {/* ================================================== */}
                    {/* THUMBNAIL SECTION */}
                    {/* ================================================== */}
                    <div className="relative aspect-video bg-zinc-900 overflow-hidden">
                      {/* Show thumbnail if URL exists */}
                      {thumbnailUrl ? (
                        <Image
                          src={thumbnailUrl} // Cloudinary thumbnail URL
                          alt={item.title}
                          fill // Fill the parent container
                          className="object-cover transition-transform duration-300 group-hover:scale-105" // Zoom on hover
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        />
                      ) : (
                        // Fallback icon if no thumbnail
                        <div className="flex items-center justify-center h-full">
                          <svg
                            className="h-12 w-12 text-zinc-600"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                        </div>
                      )}

                      {/* Media Type Badge (top-left corner) */}
                      <div className="absolute top-2 left-2">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium backdrop-blur-sm ${
                            isVideo
                              ? "bg-purple-500/90 text-white" // Purple for videos
                              : "bg-green-500/90 text-white" // Green for images
                          }`}
                        >
                          {isVideo ? (
                            <>
                              <svg
                                className="w-3 h-3"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                                />
                              </svg>
                              Video
                            </>
                          ) : (
                            <>
                              <svg
                                className="w-3 h-3"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                />
                              </svg>
                              Image
                            </>
                          )}
                        </span>
                      </div>

                      {/* Play Button Overlay (only for videos, shows on hover) */}
                      {isVideo && (
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30">
                          <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center transform group-hover:scale-110 transition-transform">
                            <svg
                              className="w-8 h-8 text-white ml-1"
                              fill="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path d="M8 5v14l11-7z" />
                            </svg>
                          </div>
                        </div>
                      )}

                      {/* Duration Badge (bottom-right corner, only for videos) */}
                      {isVideo && (
                        <div className="absolute bottom-2 right-2">
                          <span className="inline-flex items-center gap-1 rounded bg-black/75 backdrop-blur-sm px-2 py-1 text-xs font-medium text-white">
                            {/* Format duration from seconds to "2:05" */}
                            {formatDuration((item as Video).duration)}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* ================================================== */}
                    {/* CARD CONTENT SECTION */}
                    {/* ================================================== */}
                    <div className="p-4">
                      {/* Title and Delete Button */}
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-semibold text-white line-clamp-1 flex-1">
                          {item.title}
                        </h4>
                        {/* Delete Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent card click (video preview)
                            setItemToDelete({
                              id: item.id,
                              title: item.title,
                              type: isVideo ? "video" : "image",
                            });
                          }}
                          className="p-1.5 rounded-md text-zinc-400 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                          aria-label="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Description (optional) */}
                      {item.description && (
                        <p className="mt-2 text-sm text-zinc-400 line-clamp-2">
                          {item.description}
                        </p>
                      )}

                      {/* Metadata (file size, duration, upload date) */}
                      <div className="mt-3 space-y-1">
                        <div className="flex items-center gap-3 text-xs text-zinc-500">
                          {/* File Size */}
                          <span className="flex items-center gap-1">
                            <svg
                              className="w-3 h-3"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4"
                              />
                            </svg>
                            {/* Format bytes to "2 MB" */}
                            {formatFileSize(
                              isVideo
                                ? (item as Video).compressedSize // Use compressed size for videos
                                : item.originalSize, // Use original size for images
                            )}
                          </span>

                          {/* Duration (only for videos) */}
                          {isVideo && (
                            <>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <svg
                                  className="w-3 h-3"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                  />
                                </svg>
                                {formatDuration((item as Video).duration)}
                              </span>
                            </>
                          )}
                        </div>

                        {/* Upload Date */}
                        <div className="flex items-center gap-1 text-xs text-zinc-500">
                          <svg
                            className="w-3 h-3"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                          {/* Format date to "Jan 15, 2024" */}
                          {new Date(item.createdAt).toLocaleDateString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            },
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ===================================================================== */}
      {/* VIDEO PREVIEW MODAL */}
      {/* ===================================================================== */}
      {/*
        This modal is ALWAYS rendered, but only shows when selectedVideo is not null
        When you click a video card:
        1. setSelectedVideo(item) updates state with the video data
        2. VideoPreviewModal receives the video data as a prop
        3. Modal appears (it checks if video is null before showing)
        4. Click close button → setSelectedVideo(null) → Modal disappears
      */}
      <VideoPreviewModal
        video={selectedVideo} // Pass the selected video (or null)
        onClose={() => setSelectedVideo(null)} // Function to close modal
      />

      {/* ===================================================================== */}
      {/* DELETE CONFIRMATION DIALOG */}
      {/* ===================================================================== */}
      {/*
        Delete flow:
        1. User clicks delete button (trash icon) on card
        2. setItemToDelete({ id, title, type }) → Dialog opens
        3. User clicks "Delete" → handleDelete() is called
        4. API DELETE request → Remove from Cloudinary & Database
        5. Update local state (remove from videos/images array)
        6. Dialog closes
      */}
      <DeleteConfirmDialog
        isOpen={itemToDelete !== null}
        onClose={() => setItemToDelete(null)}
        onConfirm={handleDelete}
        title={itemToDelete?.title || ""}
        type={itemToDelete?.type || "video"}
      />
    </div>
  );
}
