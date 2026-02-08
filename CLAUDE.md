# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js 16 video store application using the App Router architecture. The project uses TypeScript, Tailwind CSS v4, and Clerk for authentication.

## Development Commands

```bash
# Start development server (runs on http://localhost:3000)
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint
```

## Tech Stack

- **Framework**: Next.js 16.1.6 (App Router)
- **React**: 19.2.3
- **TypeScript**: 5.x with strict mode enabled
- **Styling**: Tailwind CSS v4 (using PostCSS)
- **Authentication**: Clerk (@clerk/nextjs)
- **Fonts**: Geist Sans and Geist Mono (via next/font)

## Architecture

### Next.js App Router Structure

- Uses the App Router (`app/` directory) - all pages and layouts are defined here
- The root layout (`app/layout.tsx`) wraps the entire application with `ClerkProvider` for authentication
- Custom fonts (Geist Sans and Geist Mono) are configured in the root layout

### Authentication with Clerk

- Clerk middleware is implemented in `proxy.ts` at the root level
- The middleware handles three types of routes:
  - **Public routes** (`/`): Accessible to everyone
  - **Auth routes** (`/sign-in`, `/sign-up`): Only accessible when NOT logged in; logged-in users are redirected to `/dashboard`
  - **Private routes** (`/dashboard`, `/api/videos`): Require authentication; unauthenticated users are redirected to `/sign-in` with a `redirect_url` parameter
- Authentication pages use Clerk's pre-built `<SignIn />` and `<SignUp />` components with catch-all routes (`[[...sign-in]]` and `[[...sign-up]]`)
- The middleware runs on all routes except Next.js internals and static files, and always runs on API/tRPC routes
- The application runs in Keyless mode during development (`.clerk/` directory is auto-generated and should not be committed)
- `ClerkProvider` wraps the entire app in the root layout (`app/layout.tsx`)

### TypeScript Configuration

- Target: ES2017
- Module resolution: bundler
- Path alias: `@/*` maps to the root directory
- Strict mode enabled
- JSX: react-jsx (React 19 automatic runtime)

## Important Notes

### Authentication Flow

- Unauthenticated users attempting to access `/dashboard` or `/api/videos` are redirected to `/sign-in`
- Authenticated users attempting to access `/sign-in` or `/sign-up` are redirected to `/dashboard`
- The home page (`/`) is accessible to all users regardless of authentication status

### Route Structure

- Authentication pages use Next.js catch-all routes: `app/sign-in/[[...sign-in]]/page.tsx` and `app/sign-up/[[...sign-up]]/page.tsx`
- All authentication pages are client components (marked with `'use client'`) since Clerk components require client-side interactivity

### Environment Variables

- Clerk configuration requires environment variables (stored in `.env.local`)
- Required Clerk environment variables:
  - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`: Clerk publishable key
  - `CLERK_SECRET_KEY`: Clerk secret key
  - `NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in`
  - `NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up`
  - `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard`
  - `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard`
- All `.env*` files are gitignored by default
- Never commit the `.clerk/` directory as it contains secret keys in development mode

### Path Aliases

- Use `@/` prefix to import from the root directory (e.g., `import { Component } from '@/components/Component'`)

### Styling

- Tailwind CSS v4 uses the new PostCSS architecture
- Global styles are in `app/globals.css`
- Dark mode is configured and supported

## Next.js App Router Patterns

- Server Components are the default (components in `app/` are Server Components unless marked with `'use client'`)
- Use `layout.tsx` for shared layouts across routes
- Use `page.tsx` for route pages
- Metadata is exported from layouts and pages (see `app/layout.tsx` for example)
