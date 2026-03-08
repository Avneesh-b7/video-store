#!/bin/bash

# Docker Build Script for VideoStore App
# This script reads NEXT_PUBLIC_* variables from .env.local and passes them as build arguments

set -e  # Exit on error

# Accept optional image name/tag as first argument
IMAGE_NAME="${1:-video-store-app}"

echo "🐳 Building Docker Image: $IMAGE_NAME"
echo ""

# Check if .env.local exists
if [ ! -f .env.local ]; then
  echo "❌ Error: .env.local file not found!"
  echo "Please create .env.local with your environment variables."
  exit 1
fi

# Load environment variables from .env.local
source .env.local

# Check required variables exist
if [ -z "$NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY" ]; then
  echo "❌ Error: NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY not found in .env.local"
  exit 1
fi

if [ -z "$NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME" ]; then
  echo "❌ Error: NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME not found in .env.local"
  exit 1
fi

echo "✅ Found required environment variables"
echo ""
echo "Building with:"
echo "  - Clerk Publishable Key: ${NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:0:20}..."
echo "  - Cloudinary Cloud Name: $NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME"
echo ""

# Build Docker image
docker build \
  --build-arg NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="$NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY" \
  --build-arg NEXT_PUBLIC_CLERK_SIGN_IN_URL="${NEXT_PUBLIC_CLERK_SIGN_IN_URL:-/sign-in}" \
  --build-arg NEXT_PUBLIC_CLERK_SIGN_UP_URL="${NEXT_PUBLIC_CLERK_SIGN_UP_URL:-/sign-up}" \
  --build-arg NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL="${NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL:-/dashboard}" \
  --build-arg NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL="${NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL:-/dashboard}" \
  --build-arg NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="$NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME" \
  -t "$IMAGE_NAME" \
  .

echo ""
echo "✅ Build complete!"
echo ""
echo "To run the container:"
echo "  docker run -p 3000:3000 --env-file .env.local $IMAGE_NAME"
