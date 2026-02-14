"use client";

import { useState, useRef, ChangeEvent, DragEvent } from "react";
import { useRouter } from "next/navigation";
import { Upload, Video, CheckCircle, XCircle, Loader2 } from "lucide-react";

// Constants matching backend validation
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
const ALLOWED_FORMATS = [
  "video/mp4",
  "video/mpeg",
  "video/quicktime", // .mov
  "video/x-msvideo", // .avi
  "video/webm",
  "video/x-matroska", // .mkv
];
const ALLOWED_EXTENSIONS = [".mp4", ".mov", ".avi", ".webm", ".mkv", ".mpeg"];

type UploadState = "idle" | "uploading" | "success" | "error";

interface UploadedVideo {
  id: string;
  publicId: string;
  title: string;
  description: string | null;
  secureUrl: string;
  originalSize: number;
  compressedSize: number;
  duration: number;
  createdAt: string;
}

export default function VideoUploadPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  // Upload state
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");
  const [uploadedVideo, setUploadedVideo] = useState<UploadedVideo | null>(
    null,
  );

  // Drag state
  const [isDragging, setIsDragging] = useState(false);

  // File validation
  const validateFile = (file: File): string | null => {
    // Check file type
    if (!ALLOWED_FORMATS.includes(file.type)) {
      return `Invalid file format. Allowed formats: MP4, MOV, AVI, WebM, MKV. Received: ${file.type}`;
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return `File size exceeds 20MB limit. Your file: ${(file.size / 1024 / 1024).toFixed(2)}MB`;
    }

    return null;
  };

  // Handle file selection
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    const error = validateFile(selectedFile);
    if (error) {
      setErrorMessage(error);
      setUploadState("error");
      return;
    }

    setFile(selectedFile);
    setErrorMessage("");
    setUploadState("idle");
  };

  // Handle drag events
  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files[0];
    if (!droppedFile) return;

    const error = validateFile(droppedFile);
    if (error) {
      setErrorMessage(error);
      setUploadState("error");
      return;
    }

    setFile(droppedFile);
    setErrorMessage("");
    setUploadState("idle");
  };

  // Handle upload
  const handleUpload = async () => {
    if (!file || !title.trim()) {
      setErrorMessage("Please select a file and provide a title");
      setUploadState("error");
      return;
    }

    setUploadState("uploading");
    setUploadProgress(0);
    setErrorMessage("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("title", title.trim());
      if (description.trim()) {
        formData.append("description", description.trim());
      }

      // Simulate progress (since fetch doesn't support upload progress)
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) return prev;
          return prev + 10;
        });
      }, 300);

      const response = await fetch("/api/video-upload", {
        method: "POST",
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Upload failed");
      }

      const data = await response.json();
      setUploadedVideo(data);
      setUploadState("success");

      // Reset form
      setTimeout(() => {
        setFile(null);
        setTitle("");
        setDescription("");
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }, 2000);
    } catch (error: any) {
      console.error("Upload error:", error);
      setErrorMessage(error.message || "Failed to upload video");
      setUploadState("error");
      setUploadProgress(0);
    }
  };

  // Reset upload
  const handleReset = () => {
    setFile(null);
    setTitle("");
    setDescription("");
    setUploadState("idle");
    setUploadProgress(0);
    setErrorMessage("");
    setUploadedVideo(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => router.push("/dashboard")}
              className="text-sm text-zinc-400 hover:text-white transition-colors"
            >
              ← Back to Dashboard
            </button>
            <span className="text-zinc-700">|</span>
            <button
              onClick={() => router.push("/image-upload")}
              className="text-sm text-zinc-400 hover:text-white transition-colors flex items-center gap-1"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              Upload Image Instead
            </button>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Upload Video</h1>
          <p className="text-zinc-400">
            Upload your video files (MP4, MOV, AVI, WebM, MKV) up to 20MB
          </p>
        </div>

        {/* Upload Form */}
        <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-8">
          {/* File Drop Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`
              relative border-2 border-dashed rounded-lg p-12 text-center cursor-pointer
              transition-all duration-200
              ${
                isDragging
                  ? "border-blue-500 bg-blue-500/10"
                  : "border-zinc-700 hover:border-zinc-600 bg-zinc-950"
              }
              ${file ? "border-green-500 bg-green-500/10" : ""}
            `}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept={ALLOWED_EXTENSIONS.join(",")}
              onChange={handleFileChange}
              className="hidden"
            />

            <div className="flex flex-col items-center gap-4">
              {file ? (
                <>
                  <Video className="w-16 h-16 text-green-500" />
                  <div>
                    <p className="text-white font-medium">{file.name}</p>
                    <p className="text-sm text-zinc-400">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <Upload className="w-16 h-16 text-zinc-600" />
                  <div>
                    <p className="text-white font-medium mb-1">
                      Drop your video here or click to browse
                    </p>
                    <p className="text-sm text-zinc-400">
                      Supports: MP4, MOV, AVI, WebM, MKV (max 20MB)
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Form Fields */}
          <div className="mt-6 space-y-4">
            {/* Title */}
            <div>
              <label
                htmlFor="title"
                className="block text-sm font-medium text-white mb-2"
              >
                Title <span className="text-red-500">*</span>
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter video title"
                className="w-full px-4 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={uploadState === "uploading"}
              />
            </div>

            {/* Description */}
            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-white mb-2"
              >
                Description <span className="text-zinc-500">(optional)</span>
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter video description"
                rows={4}
                className="w-full px-4 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                disabled={uploadState === "uploading"}
              />
            </div>
          </div>

          {/* Upload Progress */}
          {uploadState === "uploading" && (
            <div className="mt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-zinc-400">Uploading...</span>
                <span className="text-sm text-white font-medium">
                  {uploadProgress}%
                </span>
              </div>
              <div className="w-full bg-zinc-800 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Error Message */}
          {uploadState === "error" && errorMessage && (
            <div className="mt-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg flex items-start gap-3">
              <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <p className="text-sm text-red-400">{errorMessage}</p>
            </div>
          )}

          {/* Success Message */}
          {uploadState === "success" && uploadedVideo && (
            <div className="mt-6 p-4 bg-green-500/10 border border-green-500/50 rounded-lg">
              <div className="flex items-start gap-3 mb-3">
                <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-green-400 font-medium mb-1">
                    Video uploaded successfully!
                  </p>
                  <p className="text-xs text-zinc-400">
                    Duration: {uploadedVideo.duration.toFixed(2)}s • Original:{" "}
                    {(uploadedVideo.originalSize / 1024 / 1024).toFixed(2)}MB •
                    Compressed:{" "}
                    {(uploadedVideo.compressedSize / 1024 / 1024).toFixed(2)}MB
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-6 flex gap-3">
            {uploadState === "success" ? (
              <>
                <button
                  onClick={handleReset}
                  className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                >
                  Upload Another Video
                </button>
                <button
                  onClick={() => router.push("/dashboard")}
                  className="flex-1 px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg font-medium transition-colors"
                >
                  Go to Dashboard
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleUpload}
                  disabled={
                    !file || !title.trim() || uploadState === "uploading"
                  }
                  className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-800 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  {uploadState === "uploading" ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-5 h-5" />
                      Upload Video
                    </>
                  )}
                </button>
                {file && (
                  <button
                    onClick={handleReset}
                    disabled={uploadState === "uploading"}
                    className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 disabled:bg-zinc-900 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
                  >
                    Clear
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
