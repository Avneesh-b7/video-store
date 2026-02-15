'use client';

import { useState, useRef, useEffect } from 'react';
import { Download, ChevronDown } from 'lucide-react';
import {
  imageSizePresets,
  ImageSizePreset,
  downloadImage,
  downloadVideo,
} from '@/lib/download';

interface DownloadDropdownProps {
  publicId: string;
  title: string;
  type: 'video' | 'image';
}

/**
 * DownloadDropdown - Shows size options for images, direct download for videos
 *
 * For images: Displays dropdown with size presets
 * For videos: Direct download on click
 */
export default function DownloadDropdown({
  publicId,
  title,
  type,
}: DownloadDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Handle video download (direct)
  const handleVideoDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    downloadVideo(publicId, title);
  };

  // Handle image download with specific size
  const handleImageDownload = (preset: ImageSizePreset) => {
    downloadImage(publicId, title, preset);
    setIsOpen(false); // Close dropdown after selection
  };

  // For videos: Direct download button
  if (type === 'video') {
    return (
      <button
        onClick={handleVideoDownload}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-md bg-green-600 text-white text-sm font-semibold hover:bg-green-700 transition-colors shadow-lg hover:shadow-green-600/50"
      >
        <Download className="w-4 h-4" />
        Download Video
      </button>
    );
  }

  // For images: Dropdown with size options
  return (
    <div ref={dropdownRef} className="relative">
      {/* Download Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-md text-sm font-semibold transition-all ${
          isOpen
            ? 'bg-green-700 text-white shadow-lg shadow-green-600/50'
            : 'bg-green-600 text-white hover:bg-green-700 shadow-lg hover:shadow-green-600/50'
        }`}
      >
        <Download className="w-4 h-4" />
        Download Image
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu - Fixed positioning to prevent clipping */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(false);
            }}
          />

          {/* Dropdown */}
          <div className="absolute top-full left-0 right-0 mt-2 bg-zinc-800 border border-zinc-700 rounded-lg shadow-2xl z-50 overflow-hidden">
            {/* Dropdown Header */}
            <div className="px-4 py-2.5 border-b border-zinc-700 bg-zinc-900">
              <p className="text-xs font-semibold text-zinc-300 uppercase tracking-wide">
                Choose Size
              </p>
            </div>

            {/* Size Options */}
            <div className="max-h-72 overflow-y-auto">
              {Object.entries(imageSizePresets).map(([key, preset]) => (
                <button
                  key={key}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleImageDownload(key as ImageSizePreset);
                  }}
                  className="w-full px-4 py-3 text-left hover:bg-green-600 transition-colors flex items-start justify-between gap-3 group"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white group-hover:text-white">
                      {preset.name}
                    </p>
                    <p className="text-xs text-zinc-400 group-hover:text-green-100 mt-0.5">
                      {preset.description}
                    </p>
                  </div>
                  <Download className="w-4 h-4 text-green-500 group-hover:text-white flex-shrink-0 mt-0.5" />
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
