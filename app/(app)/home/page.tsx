'use client';

import Link from 'next/link';
import { useUser } from '@clerk/nextjs';

export default function HomePage() {
  const { isSignedIn, isLoaded } = useUser();

  return (
    <div className="min-h-screen bg-linear-to-b from-zinc-900 via-zinc-800 to-zinc-900">
      {/* Navigation */}
      <nav className="border-b border-zinc-700 bg-zinc-900/50 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-white">VideoStore</h1>
            </div>
            <div className="flex items-center gap-4">
              {isLoaded && (
                <>
                  {isSignedIn ? (
                    <Link
                      href="/dashboard"
                      className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
                    >
                      Go to Dashboard
                    </Link>
                  ) : (
                    <>
                      <Link
                        href="/sign-in"
                        className="rounded-md px-4 py-2 text-sm font-medium text-zinc-300 hover:text-white transition-colors"
                      >
                        Sign In
                      </Link>
                      <Link
                        href="/sign-up"
                        className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
                      >
                        Sign Up
                      </Link>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-5xl font-bold tracking-tight text-white sm:text-6xl">
            Your Ultimate Video Store
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-zinc-300">
            Discover, rent, and enjoy thousands of movies and TV shows. From classic films to the latest releases, find everything you love in one place.
          </p>
          <div className="mt-10 flex items-center justify-center gap-6">
            {isLoaded && !isSignedIn ? (
              <>
                <Link
                  href="/sign-up"
                  className="rounded-md bg-blue-600 px-6 py-3 text-base font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors"
                >
                  Get Started
                </Link>
                <Link
                  href="/sign-in"
                  className="rounded-md border border-zinc-600 px-6 py-3 text-base font-semibold text-white hover:bg-zinc-800 transition-colors"
                >
                  Sign In
                </Link>
              </>
            ) : (
              <Link
                href="/dashboard"
                className="rounded-md bg-blue-600 px-6 py-3 text-base font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors"
              >
                Browse Videos
              </Link>
            )}
          </div>
        </div>

        {/* Features */}
        <div className="mt-32 grid grid-cols-1 gap-8 sm:grid-cols-3">
          <div className="rounded-lg bg-zinc-800/50 p-8 backdrop-blur">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-600">
              <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
              </svg>
            </div>
            <h3 className="mt-6 text-xl font-semibold text-white">Massive Library</h3>
            <p className="mt-2 text-zinc-400">
              Access thousands of movies and TV shows across all genres and decades.
            </p>
          </div>

          <div className="rounded-lg bg-zinc-800/50 p-8 backdrop-blur">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-600">
              <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="mt-6 text-xl font-semibold text-white">HD Quality</h3>
            <p className="mt-2 text-zinc-400">
              Stream in high definition with crystal clear picture and sound quality.
            </p>
          </div>

          <div className="rounded-lg bg-zinc-800/50 p-8 backdrop-blur">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-600">
              <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="mt-6 text-xl font-semibold text-white">Watch Anytime</h3>
            <p className="mt-2 text-zinc-400">
              Rent for 48 hours and watch on your schedule, on any device.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
