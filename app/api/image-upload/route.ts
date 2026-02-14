import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import prisma from "@/lib/prisma";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Constants
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_FORMATS = ["image/jpeg", "image/png", "image/webp"];

// Development logging helper
const isDev = process.env.NODE_ENV === "development";
const log = {
  info: (...args: any[]) => isDev && console.log("[IMAGE-UPLOAD]", ...args),
  error: (...args: any[]) => console.error("[IMAGE-UPLOAD ERROR]", ...args),
};

/**
 * POST /api/image-upload
 *
 * Uploads an image to Cloudinary, saves metadata to database.
 *
 * @input
 * - Authentication: Requires Clerk user session (userId)
 * - Content-Type: multipart/form-data
 * - Body:
 *   - file: Image file (JPEG, PNG, WebP)
 *   - title: Image title (required)
 *   - description: Image description (optional)
 *
 * @output (Success - 201)
 * {
 *   id: string,               // Database record ID
 *   publicId: string,         // Cloudinary public ID
 *   title: string,            // Image title
 *   description: string|null, // Image description
 *   secureUrl: string,        // HTTPS URL to image
 *   originalSize: number,     // File size in bytes
 *   createdAt: string,        // ISO timestamp
 * }
 *
 * @errors
 * - 401: Unauthorized - User not authenticated
 * - 400: Bad Request - Missing/invalid file, missing title, invalid format, or size exceeds 10MB
 * - 500: Internal Server Error - Cloudinary upload failure or database error
 */
export async function POST(request: NextRequest) {
  try {
    log.info("Upload request received");

    // 1. Authentication check
    const { userId } = await auth();
    if (!userId) {
      log.info("Authentication failed - no userId");
      return NextResponse.json(
        { error: "Unauthorized. Please sign in to upload images." },
        { status: 401 },
      );
    }
    log.info("User authenticated:", userId);

    // 2. Parse FormData
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const title = formData.get("title") as string;
    const description = formData.get("description") as string | null;

    // 3. Validate file exists
    if (!file) {
      log.info("Validation failed - no file provided");
      return NextResponse.json(
        { error: "No file provided. Please select an image to upload." },
        { status: 400 },
      );
    }
    log.info("File received:", {
      name: file.name,
      type: file.type,
      size: file.size,
    });

    // 4. Validate title
    if (!title || title.trim().length === 0) {
      log.info("Validation failed - no title provided");
      return NextResponse.json(
        { error: "Title is required. Please provide an image title." },
        { status: 400 },
      );
    }

    // 5. Validate file type
    if (!ALLOWED_FORMATS.includes(file.type)) {
      log.info("Validation failed - invalid file type:", file.type);
      return NextResponse.json(
        {
          error: `Invalid file format. Allowed formats: JPEG, PNG, WebP. Received: ${file.type}`,
        },
        { status: 400 },
      );
    }

    // 6. Validate file size
    if (file.size > MAX_FILE_SIZE) {
      log.info(
        "Validation failed - file too large:",
        `${(file.size / 1024 / 1024).toFixed(2)}MB`,
      );
      return NextResponse.json(
        {
          error: `File size exceeds limit. Maximum allowed: 10MB. Received: ${(file.size / 1024 / 1024).toFixed(2)}MB`,
        },
        { status: 400 },
      );
    }

    // 7. Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    log.info("File converted to buffer, size:", buffer.length);

    // 8. Generate unique publicId with industry best practices
    // Format: images/{userId}/{timestamp}-{random}
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const publicId = `images/${userId}/${timestamp}-${randomString}`;
    log.info("Generated publicId:", publicId);

    // 9. Upload to Cloudinary with auto-optimization
    log.info("Initiating Cloudinary upload...");
    const uploadResult = await new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            resource_type: "image",
            public_id: publicId,
            transformation: [
              { quality: "auto", fetch_format: "auto" }, // Auto-optimize
            ],
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          },
        )
        .end(buffer);
    });

    // 10. Extract relevant data from upload result
    const { public_id, secure_url } = uploadResult as any;
    log.info("Upload successful:", {
      publicId: public_id,
      secureUrl: secure_url,
    });

    // 11. Save to database
    log.info("Saving image metadata to database...");
    const image = await prisma.image.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        publicId: public_id,
        originalSize: file.size,
      },
    });

    log.info("Image saved to database:", { id: image.id });

    // 12. Return success response
    const response = {
      id: image.id,
      publicId: image.publicId,
      title: image.title,
      description: image.description,
      secureUrl: secure_url,
      originalSize: image.originalSize,
      createdAt: image.createdAt.toISOString(),
    };
    log.info("Sending success response:", response);

    return NextResponse.json(response, { status: 201 });
  } catch (error: any) {
    log.error("Unexpected error during upload:", error);

    // Handle specific Cloudinary errors
    if (error.http_code) {
      log.error("Cloudinary error:", {
        code: error.http_code,
        message: error.message,
      });
      return NextResponse.json(
        {
          error: `Cloudinary upload failed: ${error.message}`,
        },
        { status: error.http_code },
      );
    }

    // Handle Prisma database errors
    if (error.code && error.code.startsWith("P")) {
      log.error("Database error:", {
        code: error.code,
        message: error.message,
      });
      return NextResponse.json(
        {
          error: "Database error. Failed to save image metadata.",
        },
        { status: 500 },
      );
    }

    // Generic server error
    log.error("Generic server error:", error.message);
    return NextResponse.json(
      {
        error:
          "Internal server error. Failed to upload image. Please try again later.",
      },
      { status: 500 },
    );
  }
}
