import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import cloudinary from "@/lib/cloudinary";
import prisma from "@/lib/prisma";

// Constants
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
const ALLOWED_FORMATS = [
  "video/mp4",
  "video/mpeg",
  "video/quicktime", // .mov
  "video/x-msvideo", // .avi
  "video/webm",
  "video/x-matroska", // .mkv
];

// Development logging helper
const isDev = process.env.NODE_ENV === "development";
const log = {
  info: (...args: any[]) => isDev && console.log("[VIDEO-UPLOAD]", ...args),
  error: (...args: any[]) => console.error("[VIDEO-UPLOAD ERROR]", ...args),
};

/**
 * POST /api/video-upload
 *
 * Uploads a video to Cloudinary, saves metadata to database.
 *
 * @input
 * - Authentication: Requires Clerk user session (userId)
 * - Content-Type: multipart/form-data
 * - Body:
 *   - file: Video file (MP4, MOV, AVI, WebM, MKV)
 *   - title: Video title (required)
 *   - description: Video description (optional)
 *
 * @output (Success - 201)
 * {
 *   id: string,               // Database record ID
 *   publicId: string,         // Cloudinary public ID
 *   title: string,            // Video title
 *   description: string|null, // Video description
 *   secureUrl: string,        // HTTPS URL to video
 *   originalSize: number,     // Original file size in bytes
 *   compressedSize: number,   // Compressed size in bytes
 *   duration: number,         // Video duration in seconds
 *   createdAt: string,        // ISO timestamp
 * }
 *
 * @errors
 * - 401: Unauthorized - User not authenticated
 * - 400: Bad Request - Missing/invalid file, missing title, invalid format, or size exceeds 20MB
 * - 500: Internal Server Error - Cloudinary upload failure or database error
 */
export async function POST(request: NextRequest) {
  try {
    log.info("Video upload request received");

    // 1. Authentication check
    const { userId } = await auth();
    if (!userId) {
      log.info("Authentication failed - no userId");
      return NextResponse.json(
        { error: "Unauthorized. Please sign in to upload videos." },
        { status: 401 }
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
        { error: "No file provided. Please select a video to upload." },
        { status: 400 }
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
        { error: "Title is required. Please provide a video title." },
        { status: 400 }
      );
    }

    // 5. Validate file type
    if (!ALLOWED_FORMATS.includes(file.type)) {
      log.info("Validation failed - invalid file type:", file.type);
      return NextResponse.json(
        {
          error: `Invalid file format. Allowed formats: MP4, MOV, AVI, WebM, MKV. Received: ${file.type}`,
        },
        { status: 400 }
      );
    }

    // 6. Validate file size
    if (file.size > MAX_FILE_SIZE) {
      log.info(
        "Validation failed - file too large:",
        `${(file.size / 1024 / 1024).toFixed(2)}MB`
      );
      return NextResponse.json(
        {
          error: `File size exceeds limit. Maximum allowed: 20MB. Received: ${(file.size / 1024 / 1024).toFixed(2)}MB`,
        },
        { status: 400 }
      );
    }

    // 7. Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    log.info("File converted to buffer, size:", buffer.length);

    // 8. Generate unique publicId
    // Format: videos/{userId}/{timestamp}-{random}
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const publicId = `videos/${userId}/${timestamp}-${randomString}`;
    log.info("Generated publicId:", publicId);

    // 9. Upload to Cloudinary with auto-optimization
    log.info("Initiating Cloudinary upload...");
    const uploadResult = await new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            resource_type: "video",
            public_id: publicId,
            transformation: [
              { quality: "auto" }, // Auto-optimize quality
            ],
            eager: [
              { format: "mp4", transformation: [{ quality: "auto" }] }, // Generate optimized MP4
            ],
            eager_async: true,
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        )
        .end(buffer);
    });

    // 10. Extract metadata from Cloudinary response
    const {
      public_id,
      secure_url,
      bytes: uploadedBytes,
      duration,
    } = uploadResult as any;

    log.info("Upload successful:", {
      publicId: public_id,
      secureUrl: secure_url,
      duration,
    });

    // 11. Save to database
    log.info("Saving video metadata to database...");
    const video = await prisma.video.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        publicId: public_id,
        userId: userId,
        originalSize: file.size,
        compressedSize: uploadedBytes || file.size,
        duration: duration || 0,
      },
    });

    log.info("Video saved to database:", { id: video.id });

    // 12. Return success response
    const response = {
      id: video.id,
      publicId: video.publicId,
      title: video.title,
      description: video.description,
      secureUrl: secure_url,
      originalSize: video.originalSize,
      compressedSize: video.compressedSize,
      duration: video.duration,
      createdAt: video.createdAt.toISOString(),
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
        { status: error.http_code }
      );
    }

    // Handle Prisma database errors
    if (error.code && error.code.startsWith("P")) {
      log.error("Database error:", { code: error.code, message: error.message });
      return NextResponse.json(
        {
          error: "Database error. Failed to save video metadata.",
        },
        { status: 500 }
      );
    }

    // Generic server error
    log.error("Generic server error:", error.message);
    return NextResponse.json(
      {
        error:
          "Internal server error. Failed to upload video. Please try again later.",
      },
      { status: 500 }
    );
  }
}
