"use client";

import { useEffect } from "react";
import { CldVideoPlayer } from "next-cloudinary";
import "next-cloudinary/dist/cld-video-player.css";
import { formatFileSize, formatDuration } from "@/lib/format";
import { X } from "lucide-react";

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

interface VideoPreviewModalProps {
  video: Video | null;
  onClose: () => void;
}

export default function VideoPreviewModal({
  video,
  onClose,
}: VideoPreviewModalProps) {
  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    if (video) {
      document.addEventListener("keydown", handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [video, onClose]);

  if (!video) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      {/* Modal Content */}
      <div
        className="relative w-full max-w-5xl mx-4 bg-zinc-900 rounded-lg shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors"
          aria-label="Close modal"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Video Player */}
        <div className="relative bg-black">
          <CldVideoPlayer
            width="1920"
            height="1080"
            src={video.publicId}
            controls
            autoplay
            className="w-full"
          />
        </div>

        {/* Video Info */}
        <div className="p-6 border-t border-zinc-800">
          {/* Title */}
          <h2 className="text-2xl font-bold text-white mb-2">{video.title}</h2>

          {/* Description */}
          {video.description && (
            <p className="text-zinc-400 mb-4">{video.description}</p>
          )}

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-zinc-800">
            <div>
              <p className="text-xs text-zinc-500 mb-1">Duration</p>
              <p className="text-sm font-medium text-white">
                {formatDuration(video.duration)}
              </p>
            </div>

            <div>
              <p className="text-xs text-zinc-500 mb-1">Original Size</p>
              <p className="text-sm font-medium text-white">
                {formatFileSize(video.originalSize)}
              </p>
            </div>

            <div>
              <p className="text-xs text-zinc-500 mb-1">Compressed Size</p>
              <p className="text-sm font-medium text-white">
                {formatFileSize(video.compressedSize)}
              </p>
            </div>

            <div>
              <p className="text-xs text-zinc-500 mb-1">Uploaded</p>
              <p className="text-sm font-medium text-white">
                {new Date(video.createdAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
