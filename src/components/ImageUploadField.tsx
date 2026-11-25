import React, { useId, useState } from 'react';
import { User } from 'firebase/auth';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { Image as ImageIcon, Loader2, Trash2, Upload } from 'lucide-react';
import { storage } from '../firebase';
import { ResilientImage } from './ResilientImage';

interface ImagePreset {
  label: string;
  path: string;
}

interface ImageUploadFieldProps {
  label: string;
  value: string;
  onChange: (nextUrl: string) => void;
  user: User | null;
  presets?: ImagePreset[];
  helperText?: string;
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Could not read selected image file.'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read image file.'));
    reader.readAsDataURL(file);
  });
}

function compressImageIfLarge(dataUrl: string, fileType: string): Promise<string> {
  return new Promise((resolve) => {
    if (fileType === 'image/gif' || dataUrl.length < 1_600_000) {
      resolve(dataUrl);
      return;
    }

    const img = new Image();
    img.onload = () => {
      const maxDim = 1600;
      let { width, height } = img;
      if (width > maxDim || height > maxDim) {
        if (width >= height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(dataUrl);
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      const outputType = fileType === 'image/png' ? 'image/png' : 'image/jpeg';
      resolve(canvas.toDataURL(outputType, 0.86));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

function dataUrlToBlob(dataUrl: string): Blob {
  const [header, base64Data] = dataUrl.split(',');
  const mimeMatch = header.match(/data:([^;]+);base64/);
  const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
  const binary = atob(base64Data);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: mimeType });
}

export function ImageUploadField({
  label,
  value,
  onChange,
  user,
  presets,
  helperText,
}: ImageUploadFieldProps) {
  const inputId = useId();
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadedName, setUploadedName] = useState('');

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setUploadError('');
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
      setUploadError('Please select a JPEG, PNG, WebP, or GIF image file.');
      return;
    }

    if (!user) {
      setUploadError('Please sign in as admin to upload images.');
      return;
    }

    setUploading(true);
    try {
      const rawDataUrl = await readFileAsDataUrl(file);
      const preparedDataUrl = await compressImageIfLarge(rawDataUrl, file.type);
      const blob = dataUrlToBlob(preparedDataUrl);
      const ext =
        blob.type === 'image/png'
          ? 'png'
          : blob.type === 'image/webp'
          ? 'webp'
          : blob.type === 'image/gif'
          ? 'gif'
          : 'jpg';

      // Primary: upload directly to Firebase Storage so images sync across Vercel & all servers
      try {
        const safeBaseName = file.name
          .replace(/\.[^/.]+$/, '')
          .replace(/[^a-zA-Z0-9_-]/g, '_')
          .slice(0, 32) || 'image';
        const storageRef = ref(
          storage,
          `ministry_uploads/${Date.now()}_${safeBaseName}.${ext}`
        );
        await uploadBytes(storageRef, blob, { contentType: blob.type });
        const downloadUrl = await getDownloadURL(storageRef);
        onChange(downloadUrl);
        setUploadedName(file.name);
        return;
      } catch {
        // Fallback: use server upload endpoint if Firebase Storage rules are not enabled yet
      }

      const idToken = await user.getIdToken();
      const res = await fetch('/api/admin/upload-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ dataUrl: preparedDataUrl }),
      });

      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        throw new Error(
          'Image upload requires Firebase Storage permissions on static hosting, or select Starter Artwork.'
        );
      }

      const data = (await res.json().catch(() => ({}))) as {
        url?: string;
        error?: string;
      };

      if (!res.ok || !data.url) {
        throw new Error(data.error || 'Image upload failed.');
      }

      onChange(data.url);
      setUploadedName(file.name);
    } catch (err) {
      setUploadError(
        err instanceof Error ? err.message : 'Unable to upload image file.'
      );
    } finally {
      setUploading(false);
    }
  };

  const isUploadedFile =
    value.startsWith('/uploads/') ||
    value.includes('firebasestorage.googleapis.com') ||
    value.includes('storage.googleapis.com');
  const matchedPreset = presets?.find((p) => p.path === value);

  return (
    <div className="space-y-2.5">
      <label className="block text-xs font-semibold text-[#52525B]">
        {label}
      </label>

      <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-3.5 rounded-xl bg-[#FAFAFA] border border-[#E4E4E7]">
        <div className="w-28 h-20 rounded-lg overflow-hidden border border-[#E4E4E7] bg-white shrink-0 flex items-center justify-center">
          {value ? (
            <ResilientImage
              src={value}
              alt={label}
              className="w-full h-full object-cover"
              fallbackTitle={label}
            />
          ) : (
            <ImageIcon className="w-6 h-6 text-[#A1A1AA]" />
          )}
        </div>

        <div className="flex-1 min-w-0 space-y-2.5">
          <div className="flex flex-wrap items-center gap-2">
            <label
              htmlFor={inputId}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-[#0B0B0D] text-white hover:bg-[#2563EB] transition-colors cursor-pointer whitespace-nowrap ${
                uploading ? 'opacity-60 pointer-events-none' : ''
              }`}
            >
              {uploading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Uploading...</span>
                </>
              ) : (
                <>
                  <Upload className="w-3.5 h-3.5" />
                  <span>{value ? 'Upload New Image' : 'Upload Image File'}</span>
                </>
              )}
              <input
                id={inputId}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={(e) => void handleFileSelected(e)}
                disabled={uploading}
                className="sr-only"
              />
            </label>

            {presets && presets.length > 0 && (
              <select
                aria-label={`${label} starter artwork`}
                value={matchedPreset ? matchedPreset.path : ''}
                onChange={(e) => {
                  if (e.target.value) {
                    setUploadedName('');
                    setUploadError('');
                    onChange(e.target.value);
                  }
                }}
                className="px-3 py-2 rounded-lg text-xs bg-white border border-[#E4E4E7] text-[#0B0B0D]"
              >
                <option value="">
                  {isUploadedFile ? 'Uploaded File Active' : 'Select Starter Artwork...'}
                </option>
                {presets.map((p) => (
                  <option key={p.path} value={p.path}>
                    {p.label}
                  </option>
                ))}
              </select>
            )}

            {value && (
              <button
                type="button"
                onClick={() => {
                  setUploadedName('');
                  setUploadError('');
                  onChange('');
                }}
                className="inline-flex items-center gap-1 px-2.5 py-2 rounded-lg text-xs font-medium text-[#991B1B] border border-[#FECACA] bg-[#FEF2F2] hover:bg-[#FEE2E2] cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remove</span>
              </button>
            )}
          </div>

          <p className="text-[11px] text-[#71717A] truncate">
            {uploadedName
              ? `Uploaded file: ${uploadedName}`
              : isUploadedFile
              ? 'Custom uploaded image file ready'
              : matchedPreset
              ? `Starter artwork: ${matchedPreset.label}`
              : helperText || 'Choose an image file from your device (JPEG, PNG, WebP, or GIF).'}
          </p>

          {uploadError && (
            <p className="text-xs text-[#991B1B] font-medium">{uploadError}</p>
          )}
        </div>
      </div>
    </div>
  );
}
