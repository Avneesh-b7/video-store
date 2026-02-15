import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import cloudinary from "@/lib/cloudinary";
import prisma from "@/lib/prisma";

/**
 * DELETE /api/image/[id]
 *
 * Deletes an image from both Cloudinary and the database.
 * Only the owner (user who uploaded it) can delete.
 *
 * @param id - Image ID from database
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

    // 2. Get image ID from URL params
    const { id } = await params;

    // 3. Find the image in database
    const image = await prisma.image.findUnique({
      where: { id },
    });

    // 4. Check if image exists
    if (!image) {
      return NextResponse.json(
        { error: "Image not found." },
        { status: 404 }
      );
    }

    // 5. Check if user owns this image
    if (image.userId !== userId) {
      return NextResponse.json(
        { error: "Forbidden. You don't own this image." },
        { status: 403 }
      );
    }

    // 6. Delete from Cloudinary first
    // If Cloudinary delete fails, we don't delete from database
    try {
      await cloudinary.uploader.destroy(image.publicId, {
        resource_type: "image",
      });
    } catch (cloudinaryError) {
      console.error("Cloudinary deletion failed:", cloudinaryError);
      // Continue anyway - file might already be deleted from Cloudinary
    }

    // 7. Delete from database
    await prisma.image.delete({
      where: { id },
    });

    // 8. Return success
    return NextResponse.json(
      { message: "Image deleted successfully." },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting image:", error);
    return NextResponse.json(
      { error: "Failed to delete image. Please try again." },
      { status: 500 }
    );
  }
}
