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

# Prisma commands
npx prisma generate              # Generate Prisma Client after schema changes
npx prisma migrate dev --name <migration-name>  # Create and apply migration
npx prisma migrate status        # Check migration status
npx prisma migrate reset         # Reset database (dev only - WARNING: deletes all data)
npx prisma studio                # Open Prisma Studio to view/edit data
```

## Tech Stack

- **Framework**: Next.js 16.1.6 (App Router)
- **React**: 19.2.3
- **TypeScript**: 5.x with strict mode enabled
- **Styling**: Tailwind CSS v4 (using PostCSS)
- **Authentication**: Clerk (@clerk/nextjs)
- **Database**: PostgreSQL (Neon DB) with Prisma ORM 7.3.0
- **Media Storage**: Cloudinary (for video and image uploads)
- **Fonts**: Geist Sans and Geist Mono (via next/font)
- **Icons**: Lucide React

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
  - **Private routes**: Require authentication; unauthenticated users are redirected to `/sign-in` with a `redirect_url` parameter
    - Pages: `/dashboard`, `/video-upload`, `/image-upload`, `/social-share`
    - API routes: `/api/video`, `/api/image`, `/api/video-upload`, `/api/image-upload`
- Authentication pages use Clerk's pre-built `<SignIn />` and `<SignUp />` components with catch-all routes (`[[...sign-in]]` and `[[...sign-up]]`)
- The middleware runs on all routes except Next.js internals and static files, and always runs on API/tRPC routes
- The application runs in Keyless mode during development (`.clerk/` directory is auto-generated and should not be committed)
- `ClerkProvider` wraps the entire app in the root layout (`app/layout.tsx`)

### Database with Prisma

- **Database**: Neon DB (PostgreSQL) hosted on Neon's serverless platform
- **ORM**: Prisma 7.3.0 with custom configuration
- **Schema location**: `prisma/schema.prisma`
- **Prisma Client output**: `app/generated/prisma/` (custom location, gitignored)
- **Configuration**: `prisma.config.ts` at project root loads environment variables from `.env.local` (not `.env`)
- **Current models**:
  - `Video`: Stores video metadata (id, title, description, publicId, userId, originalSize, compressedSize, duration, timestamps)
  - `Image`: Stores image metadata (id, title, description, publicId, userId, originalSize, timestamps)
- **Important notes**:
  - Prisma Client is generated to `app/generated/prisma/` (not default `node_modules/.prisma/client`)
  - **Import Prisma client instance**: `import prisma from '@/lib/prisma'` (singleton pattern with PrismaPg adapter)
  - **Import Prisma types**: `import { PrismaClient } from '@/app/generated/prisma'`
  - The Prisma client uses `@prisma/adapter-pg` for PostgreSQL connection pooling
  - Always run `npx prisma generate` after schema changes to regenerate the client
  - Database connection string (`DATABASE_URL`) must be in `.env.local`, not `.env`
  - Migration files in `prisma/migrations/` should be committed to git
  - The `@@map("table_name")` attribute maps model names to database table names (e.g., `Video` model → `videos` table)
  - Both models include `userId` field with index for user-scoped queries (filtering by Clerk user ID)

### Media Storage with Cloudinary

- **Configuration**: `lib/cloudinary.ts` initializes the Cloudinary client with API credentials
- **Usage**: Videos and images are uploaded to Cloudinary via API routes
- **API endpoints**:
  - `POST /api/video-upload`: Upload videos (max 20MB, supports mp4, mpeg, mov, avi, webm, mkv)
  - `POST /api/image-upload`: Upload images
  - `GET /api/video`: Fetch current user's videos (ordered by createdAt desc)
  - `GET /api/image`: Fetch current user's images (ordered by createdAt desc)
- **Data flow**: Files → Cloudinary → Metadata stored in Prisma/Neon DB (with publicId reference to Cloudinary asset)
- **Important**: The `publicId` field in the database links to the Cloudinary asset
- **Dashboard**: Displays user's media with filtering tabs (all/videos/images)

### TypeScript Configuration

- Target: ES2017
- Module resolution: bundler
- Path alias: `@/*` maps to the root directory
- Strict mode enabled
- JSX: react-jsx (React 19 automatic runtime)

## Important Notes

### Authentication Flow

- Unauthenticated users attempting to access protected routes (dashboard, upload pages, API routes) are redirected to `/sign-in` with a `redirect_url` parameter
- Authenticated users attempting to access `/sign-in` or `/sign-up` are redirected to `/dashboard`
- The home page (`/`) is accessible to all users regardless of authentication status
- After successful authentication, users are redirected to `/dashboard`

### Route Structure

- Authentication pages use Next.js catch-all routes: `app/sign-in/[[...sign-in]]/page.tsx` and `app/sign-up/[[...sign-up]]/page.tsx`
- All authentication pages are client components (marked with `'use client'`) since Clerk components require client-side interactivity
- Route group `app/(app)/` contains protected application pages (accessible after authentication):
  - `/dashboard`: Main dashboard
  - `/video-upload`: Video upload interface
  - `/image-upload`: Image upload interface
  - `/social-share`: Social sharing features

### Environment Variables

- All environment variables are stored in `.env.local` (not `.env`)
- Required Clerk environment variables:
  - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`: Clerk publishable key
  - `CLERK_SECRET_KEY`: Clerk secret key
  - `NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in`
  - `NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up`
  - `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard`
  - `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard`
- Required Database environment variables:
  - `DATABASE_URL`: PostgreSQL connection string from Neon DB
- Required Cloudinary environment variables:
  - `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`: Your Cloudinary cloud name
  - `CLOUDINARY_API_KEY`: Cloudinary API key
  - `CLOUDINARY_API_SECRET`: Cloudinary API secret
- All `.env*` files are gitignored by default
- Never commit the `.clerk/` directory as it contains secret keys in development mode

### Path Aliases

- Use `@/` prefix to import from the root directory (e.g., `import { Component } from '@/components/Component'`)

### Styling

- Tailwind CSS v4 uses the new PostCSS architecture
- Global styles are in `app/globals.css`
- Dark mode is configured and supported

### Common Code Patterns

- **Authentication in API routes**: Use `auth()` from `@clerk/nextjs/server` to get `userId`
- **Prisma client**: Import the singleton instance from `@/lib/prisma` (don't instantiate new clients)
- **Cloudinary client**: Import from `@/lib/cloudinary` for media uploads
- **User-scoped queries**: Filter database queries by `userId` from Clerk (e.g., `prisma.video.findMany({ where: { userId } })`)
- **File uploads**: API routes handle multipart form data, upload to Cloudinary, then save metadata to database

## Next.js App Router Patterns

- Server Components are the default (components in `app/` are Server Components unless marked with `'use client'`)
- Use `layout.tsx` for shared layouts across routes
- Use `page.tsx` for route pages
- Metadata is exported from layouts and pages (see `app/layout.tsx` for example)
