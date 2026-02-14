"use client";

import { useState, useRef, ChangeEvent, DragEvent } from "react";
import { useRouter } from "next/navigation";
import { Upload, Image as ImageIcon, CheckCircle, XCircle, Loader2 } from "lucide-react";

// Constants matching backend validation
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_FORMATS = ["image/jpeg", "image/png", "image/webp"];
const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"];

type UploadState = "idle" | "uploading" | "success" | "error";

interface UploadedImage {
  id: string;
  publicId: string;
  title: string;
  description: string | null;
  secureUrl: string;
  originalSize: number;
  createdAt: string;
}

export default function ImageUploadPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  // Upload state
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");
  const [uploadedImage, setUploadedImage] = useState<UploadedImage | null>(
    null
  );

  // Drag state
  const [isDragging, setIsDragging] = useState(false);

  // File validation
  const validateFile = (file: File): string | null => {
    // Check file type
    if (!ALLOWED_FORMATS.includes(file.type)) {
      return `Invalid file format. Allowed formats: JPEG, PNG, WebP. Received: ${file.type}`;
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return `File size exceeds 10MB limit. Your file: ${(file.size / 1024 / 1024).toFixed(2)}MB`;
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

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(selectedFile);
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

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(droppedFile);
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
      }, 200);

      const response = await fetch("/api/image-upload", {
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
      setUploadedImage(data);
      setUploadState("success");

      // Reset form
      setTimeout(() => {
        setFile(null);
        setPreview(null);
        setTitle("");
        setDescription("");
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }, 2000);
    } catch (error: any) {
      console.error("Upload error:", error);
      setErrorMessage(error.message || "Failed to upload image");
      setUploadState("error");
      setUploadProgress(0);
    }
  };

  // Reset upload
  const handleReset = () => {
    setFile(null);
    setPreview(null);
    setTitle("");
    setDescription("");
    setUploadState("idle");
    setUploadProgress(0);
    setErrorMessage("");
    setUploadedImage(null);
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
              onClick={() => router.push("/video-upload")}
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
                  d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
              Upload Video Instead
            </button>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Upload Image</h1>
          <p className="text-zinc-400">
            Upload your image files (JPEG, PNG, WebP) up to 10MB
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
              {preview ? (
                <>
                  <div className="relative w-48 h-48 rounded-lg overflow-hidden border-2 border-green-500">
                    <img
                      src={preview}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <p className="text-white font-medium">{file?.name}</p>
                    <p className="text-sm text-zinc-400">
                      {file ? (file.size / 1024 / 1024).toFixed(2) : 0} MB
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <Upload className="w-16 h-16 text-zinc-600" />
                  <div>
                    <p className="text-white font-medium mb-1">
                      Drop your image here or click to browse
                    </p>
                    <p className="text-sm text-zinc-400">
                      Supports: JPEG, PNG, WebP (max 10MB)
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
                placeholder="Enter image title"
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
                placeholder="Enter image description"
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
          {uploadState === "success" && uploadedImage && (
            <div className="mt-6 p-4 bg-green-500/10 border border-green-500/50 rounded-lg">
              <div className="flex items-start gap-3 mb-3">
                <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-green-400 font-medium mb-1">
                    Image uploaded successfully!
                  </p>
                  <p className="text-xs text-zinc-400">
                    Size: {(uploadedImage.originalSize / 1024 / 1024).toFixed(2)}MB
                  </p>
                </div>
              </div>
              {/* Show uploaded image */}
              <div className="mt-3 rounded-lg overflow-hidden border border-green-500/30">
                <img
                  src={uploadedImage.secureUrl}
                  alt={uploadedImage.title}
                  className="w-full h-auto"
                />
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
                  Upload Another Image
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
                      Upload Image
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
