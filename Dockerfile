
  # Use Node.js 22 on Alpine Linux (lightweight)
  FROM node:22-alpine

  # Install system dependencies for Alpine
  RUN apk add --no-cache libc6-compat

  # Set working directory
  WORKDIR /app

  # Copy package files
  COPY package.json package-lock.json* ./

  # Install all dependencies (needed for build)
  RUN npm ci

  # Copy all your app code
  COPY . .

  # Generate Prisma client (important for your custom location)
  RUN npx prisma generate

  # Accept build-time environment variables
  ARG NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
  ARG NEXT_PUBLIC_CLERK_SIGN_IN_URL
  ARG NEXT_PUBLIC_CLERK_SIGN_UP_URL
  ARG NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL
  ARG NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL
  ARG NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME

  # Set them as environment variables for the build
  ENV NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=$NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
  ENV NEXT_PUBLIC_CLERK_SIGN_IN_URL=$NEXT_PUBLIC_CLERK_SIGN_IN_URL
  ENV NEXT_PUBLIC_CLERK_SIGN_UP_URL=$NEXT_PUBLIC_CLERK_SIGN_UP_URL
  ENV NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=$NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL
  ENV NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=$NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL
  ENV NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=$NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME

  # Build Next.js app
  RUN npm run build

  # Set environment to production
  ENV NODE_ENV=production

  # Expose port 3000
  EXPOSE 3000

  # Start the app
  CMD ["npm", "start"]