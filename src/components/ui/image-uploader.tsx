"use client";

import React, { useState, useTransition, useRef, useEffect } from "react";
import { Loader2, User, Pencil, Upload, Trash2 } from "lucide-react";
import { uploadImageAction } from "@/actions/upload";

interface ImageUploaderProps {
  name?: string;
  value?: string;
  onChange?: (url: string) => void;
  label?: string;
  maxSizeMB?: number;
}

export function ImageUploader({
  name = "avatarUrl",
  value = "",
  onChange,
  label = "Profile picture",
  maxSizeMB = 5,
}: ImageUploaderProps) {
  const [currentUrl, setCurrentUrl] = useState<string>(value);
  const [prevValue, setPrevValue] = useState<string>(value);
  const [isUploading, startUploadTransition] = useTransition();
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  if (value !== prevValue) {
    setPrevValue(value);
    setCurrentUrl(value);
  }

  const fileInputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Close popup on outside click / Escape
  useEffect(() => {
    if (!menuOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        !triggerRef.current?.contains(e.target as Node)
      ) {
        setMenuOpen(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [menuOpen]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);

    // ── CLIENT-SIDE PRE-VALIDATIONS (PREVENT SERVER CRASHES) ──
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type.toLowerCase())) {
      setUploadError("Invalid file type. Please select a PNG, JPEG, or WEBP image.");
      e.target.value = "";
      return;
    }

    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      const fileSizeInMB = (file.size / (1024 * 1024)).toFixed(2);
      setUploadError(`File is too large (${fileSizeInMB}MB). Maximum allowed size is ${maxSizeMB}MB.`);
      e.target.value = "";
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    startUploadTransition(async () => {
      try {
        const res = await uploadImageAction(formData);
        if (res.success && "url" in res && res.url) {
          setCurrentUrl(res.url);
          if (onChange) onChange(res.url);
        } else {
          setUploadError(res.error || "Failed to upload image");
        }
      } catch (err: unknown) {
        console.error("Client Upload Exception:", err);
        setUploadError((err as Error)?.message || "An unexpected network error occurred while uploading.");
      }
    });

    e.target.value = "";
  };

  const handleRemoveImage = () => {
    setCurrentUrl("");
    setUploadError(null);
    setMenuOpen(false);
    if (onChange) onChange("");
  };

  const handleUpdateClick = () => {
    setMenuOpen(false);
    fileInputRef.current?.click();
  };

  return (
    <div className="flex flex-col gap-2">
      {label && (
        <span className="text-sm font-semibold text-slate-800">{label}</span>
      )}

      <input type="hidden" name={name} value={currentUrl} />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png, image/jpeg, image/jpg, image/webp"
        onChange={handleFileChange}
        disabled={isUploading}
        className="hidden"
      />

      <div className="relative w-28 h-28">
        {/* Avatar circle */}
        <div className="w-28 h-28 rounded-full bg-slate-100 overflow-hidden flex items-center justify-center">
          {currentUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={currentUrl}
              alt="Profile avatar"
              className="w-full h-full object-cover"
              onError={() => setCurrentUrl("")}
            />
          ) : (
            <User size={36} className="text-slate-300" />
          )}

          {isUploading && (
            <div className="absolute inset-0 rounded-full bg-slate-900/60 flex items-center justify-center">
              <Loader2 size={22} className="animate-spin text-white" />
            </div>
          )}
        </div>

        {/*  edit btn  */}
        <button
          ref={triggerRef}
          type="button"
          onClick={() => setMenuOpen((o) => !o)}
          disabled={isUploading}
          aria-label="Edit profile picture"
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          className="absolute bottom-0 -right-3 px-1 bg-slate-900 text-white flex items-center justify-center border-2 border-white shadow-md hover:bg-slate-700 transition-colors disabled:opacity-50"
        >
          <Pencil size={14} /> {" "} <span>Edit</span>
        </button>
        {/* Popup menu */}
        {menuOpen && (
          <div
            ref={menuRef}
            role="menu"
            className="absolute z-20 top-full left-1/2 -translate-x-1/2 mt-2 w-44 border border-slate-200 bg-white shadow-lg py-1 animate-in fade-in zoom-in-95 duration-100"
          >
            <button
              type="button"
              role="menuitem"
              onClick={handleUpdateClick}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <Upload size={14} />
              Update photo
            </button>
            {currentUrl && (
              <button
                type="button"
                role="menuitem"
                onClick={handleRemoveImage}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-rose-600 hover:bg-rose-50 transition-colors"
              >
                <Trash2 size={14} />
                Remove photo
              </button>
            )}
          </div>
        )}
      </div>

      {uploadError && (
        <p className="text-xs font-medium text-rose-600 max-w-xs">{uploadError}</p>
      )}
    </div>
  );
}