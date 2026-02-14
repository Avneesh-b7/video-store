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

export default function DashboardPage() {
  const { user, isLoaded } = useUser();
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const response = await fetch('/api/video');
        if (!response.ok) {
          throw new Error('Failed to fetch videos');
        }
        const data = await response.json();
        setVideos(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchVideos();
  }, []);

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
            Manage your videos and explore new content
          </p>
        </div>

        {/* Quick Actions */}
        <div className="mb-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
            <h3 className="mt-4 text-lg font-semibold text-white">Total Videos</h3>
            <p className="mt-2 text-3xl font-bold text-white">{videos.length}</p>
          </div>
        </div>

        {/* Videos Section */}
        <div>
          <h3 className="mb-6 text-2xl font-bold text-white">Recent Videos</h3>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-zinc-400">Loading videos...</div>
            </div>
          ) : error ? (
            <div className="rounded-lg border border-red-500/50 bg-red-500/10 p-4">
              <p className="text-red-400">Error: {error}</p>
            </div>
          ) : videos.length === 0 ? (
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
                  d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
              <h3 className="mt-4 text-lg font-semibold text-white">No videos yet</h3>
              <p className="mt-2 text-zinc-400">
                Upload your first video to get started
              </p>
              <Link
                href="/video-upload"
                className="mt-6 inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
              >
                Upload Video
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {videos.map((video) => (
                <div
                  key={video.id}
                  className="rounded-lg border border-zinc-700 bg-zinc-800/50 p-6 transition-all hover:border-zinc-600"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-white line-clamp-1">
                        {video.title}
                      </h4>
                      {video.description && (
                        <p className="mt-2 text-sm text-zinc-400 line-clamp-2">
                          {video.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-4 text-xs text-zinc-500">
                    <span>{(video.duration / 60).toFixed(1)} min</span>
                    <span>•</span>
                    <span>{(video.compressedSize / 1024 / 1024).toFixed(1)} MB</span>
                  </div>
                  <div className="mt-2 text-xs text-zinc-500">
                    {new Date(video.createdAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
