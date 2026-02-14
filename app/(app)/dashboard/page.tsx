'use client';

import Link from 'next/link';
import { useUser, UserButton } from '@clerk/nextjs';
import { useEffect, useState } from 'react';

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

type FilterTab = 'all' | 'videos' | 'images';

export default function DashboardPage() {
  const { user, isLoaded } = useUser();
  const [videos, setVideos] = useState<Video[]>([]);
  const [images, setImages] = useState<Image[]>([]);
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMedia = async () => {
      try {
        // Fetch both videos and images in parallel
        const [videosResponse, imagesResponse] = await Promise.all([
          fetch('/api/video'),
          fetch('/api/image'),
        ]);

        if (!videosResponse.ok || !imagesResponse.ok) {
          throw new Error('Failed to fetch media');
        }

        const videosData = await videosResponse.json();
        const imagesData = await imagesResponse.json();

        setVideos(videosData);
        setImages(imagesData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchMedia();
  }, []);

  // Filter content based on active tab
  const getFilteredContent = () => {
    if (activeFilter === 'videos') return videos;
    if (activeFilter === 'images') return images;
    // 'all' - combine and sort by date
    return [...videos, ...images].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  };

  const filteredContent = getFilteredContent();
  const totalCount = videos.length + images.length;

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-900">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-900 via-zinc-800 to-zinc-900">
      {/* Navigation */}
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
            <div className="flex items-center gap-3">
              <div className="hidden md:flex flex-col items-end">
                <p className="text-sm font-medium text-white">
                  {user?.fullName || user?.firstName || 'User'}
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

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-white">
            Welcome back, {user?.firstName || 'User'}!
          </h2>
          <p className="mt-2 text-zinc-400">
            Manage your media library and explore new content
          </p>
        </div>

        {/* Quick Actions */}
        <div className="mb-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
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
            <h3 className="mt-4 text-lg font-semibold text-white">Upload Video</h3>
            <p className="mt-2 text-sm text-zinc-400">
              Upload and share your videos with the world
            </p>
          </Link>

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
            <h3 className="mt-4 text-lg font-semibold text-white">Upload Image</h3>
            <p className="mt-2 text-sm text-zinc-400">
              Upload and share your images with the world
            </p>
          </Link>

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
            <h3 className="mt-4 text-lg font-semibold text-white">Share Socially</h3>
            <p className="mt-2 text-sm text-zinc-400">
              Share your content across social platforms
            </p>
          </Link>

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
            <h3 className="mt-4 text-lg font-semibold text-white">Total Media</h3>
            <p className="mt-2 text-3xl font-bold text-white">{totalCount}</p>
            <p className="mt-1 text-xs text-zinc-500">
              {videos.length} videos • {images.length} images
            </p>
          </div>
        </div>

        {/* Media Library Section */}
        <div>
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-2xl font-bold text-white">Media Library</h3>

            {/* Filter Tabs */}
            <div className="flex items-center gap-2 rounded-lg bg-zinc-800/50 p-1">
              <button
                onClick={() => setActiveFilter('all')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeFilter === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                All ({totalCount})
              </button>
              <button
                onClick={() => setActiveFilter('videos')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeFilter === 'videos'
                    ? 'bg-blue-600 text-white'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Videos ({videos.length})
              </button>
              <button
                onClick={() => setActiveFilter('images')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeFilter === 'images'
                    ? 'bg-blue-600 text-white'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Images ({images.length})
              </button>
            </div>
          </div>

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
                No {activeFilter === 'all' ? 'media' : activeFilter} yet
              </h3>
              <p className="mt-2 text-zinc-400">
                Upload your first {activeFilter === 'all' ? 'media files' : activeFilter === 'videos' ? 'video' : 'image'} to get started
              </p>
              <div className="mt-6 flex items-center justify-center gap-3">
                {(activeFilter === 'all' || activeFilter === 'videos') && (
                  <Link
                    href="/video-upload"
                    className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
                  >
                    Upload Video
                  </Link>
                )}
                {(activeFilter === 'all' || activeFilter === 'images') && (
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
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredContent.map((item) => {
                const isVideo = 'duration' in item;
                return (
                  <div
                    key={item.id}
                    className="rounded-lg border border-zinc-700 bg-zinc-800/50 p-6 transition-all hover:border-zinc-600"
                  >
                    {/* Media Type Badge */}
                    <div className="mb-3 flex items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${
                          isVideo
                            ? 'bg-purple-500/10 text-purple-400'
                            : 'bg-green-500/10 text-green-400'
                        }`}
                      >
                        {isVideo ? (
                          <>
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                            Video
                          </>
                        ) : (
                          <>
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            Image
                          </>
                        )}
                      </span>
                    </div>

                    {/* Title and Description */}
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-white line-clamp-1">
                          {item.title}
                        </h4>
                        {item.description && (
                          <p className="mt-2 text-sm text-zinc-400 line-clamp-2">
                            {item.description}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Metadata */}
                    <div className="mt-4 flex items-center gap-4 text-xs text-zinc-500">
                      {isVideo ? (
                        <>
                          <span>{((item as Video).duration / 60).toFixed(1)} min</span>
                          <span>•</span>
                          <span>{((item as Video).compressedSize / 1024 / 1024).toFixed(1)} MB</span>
                        </>
                      ) : (
                        <span>{(item.originalSize / 1024 / 1024).toFixed(2)} MB</span>
                      )}
                    </div>
                    <div className="mt-2 text-xs text-zinc-500">
                      {new Date(item.createdAt).toLocaleDateString()}
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
