import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import cloudinary from "@/lib/cloudinary";
import prisma from "@/lib/prisma";

/**
 * DELETE /api/video/[id]
 *
 * Deletes a video from both Cloudinary and the database.
 * Only the owner (user who uploaded it) can delete.
 *
 * @param id - Video ID from database
 * @returns 200 on success, 401/403/404/500 on error
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Authenticate user
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in." },
        { status: 401 }
      );
    }

    // 2. Get video ID from URL params
    const { id } = await params;

    // 3. Find the video in database
    const video = await prisma.video.findUnique({
      where: { id },
    });

    // 4. Check if video exists
    if (!video) {
      return NextResponse.json(
        { error: "Video not found." },
        { status: 404 }
      );
    }

    // 5. Check if user owns this video
    if (video.userId !== userId) {
      return NextResponse.json(
        { error: "Forbidden. You don't own this video." },
        { status: 403 }
      );
    }

    // 6. Delete from Cloudinary first
    // If Cloudinary delete fails, we don't delete from database
    try {
      await cloudinary.uploader.destroy(video.publicId, {
        resource_type: "video",
      });
    } catch (cloudinaryError) {
      console.error("Cloudinary deletion failed:", cloudinaryError);
      // Continue anyway - file might already be deleted from Cloudinary
    }

    // 7. Delete from database
    await prisma.video.delete({
      where: { id },
    });

    // 8. Return success
    return NextResponse.json(
      { message: "Video deleted successfully." },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting video:", error);
    return NextResponse.json(
      { error: "Failed to delete video. Please try again." },
      { status: 500 }
    );
  }
}
