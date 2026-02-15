'use client';

import { X } from 'lucide-react';

interface DeleteConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  type: 'video' | 'image';
}

/**
 * DeleteConfirmDialog - Shows confirmation before deleting media
 *
 * Flow:
 * 1. User clicks delete button → Dialog opens
 * 2. User clicks "Delete" → onConfirm() is called → API delete happens
 * 3. User clicks "Cancel" or X → onClose() → Dialog closes
 */
export default function DeleteConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  type,
}: DeleteConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={onClose} // Click outside to close
    >
      {/* Dialog Box */}
      <div
        className="relative w-full max-w-md mx-4 bg-zinc-900 rounded-lg shadow-2xl border border-zinc-700 p-6"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-white transition-colors"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Warning Icon */}
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-500/10 mb-4">
          <svg
            className="w-6 h-6 text-red-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>

        {/* Title */}
        <h3 className="text-xl font-bold text-white mb-2">
          Delete {type === 'video' ? 'Video' : 'Image'}?
        </h3>

        {/* Description */}
        <p className="text-zinc-400 mb-1">
          Are you sure you want to delete <span className="font-medium text-white">"{title}"</span>?
        </p>
        <p className="text-sm text-zinc-500 mb-6">
          This action cannot be undone. The {type} will be permanently deleted from Cloudinary and the database.
        </p>

        {/* Action Buttons */}
        <div className="flex gap-3">
          {/* Cancel Button */}
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded-md border border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
          >
            Cancel
          </button>

          {/* Delete Button */}
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700 transition-colors font-medium"
          >
            Delete {type === 'video' ? 'Video' : 'Image'}
          </button>
        </div>
      </div>
    </div>
  );
}
