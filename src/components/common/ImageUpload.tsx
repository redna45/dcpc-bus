import React, { useState, useRef, useEffect } from 'react';
import { Upload, Camera, Image as ImageIcon, X, RefreshCw } from 'lucide-react';
import { compressAndResizeImage } from '../../lib/imageUtils';

interface ImageUploadProps {
  label: string;
  helperText?: string;
  value?: string;
  onChange: (fileOrBase64: File | string) => void;
  accept?: string;
  aspectRatio?: 'square' | 'receipt';
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  label,
  helperText,
  value,
  onChange,
  accept = 'image/jpeg,image/png,image/webp,image/jpg',
  aspectRatio = 'square',
}) => {
  const [preview, setPreview] = useState<string>(value || '');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [hasUserSelected, setHasUserSelected] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Only update preview from prop if user hasn't actively selected a new local image
    if (!hasUserSelected && value !== undefined) {
      setPreview(value);
    }
  }, [value, hasUserSelected]);

  const handleFile = async (file: File) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please upload a valid image file (JPG, PNG, WEBP)');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      alert('Image file size must be less than 15MB');
      return;
    }

    setIsProcessing(true);
    try {
      const maxDim = aspectRatio === 'square' ? 500 : 900;
      const quality = aspectRatio === 'square' ? 0.8 : 0.75;
      const { dataUrl } = await compressAndResizeImage(file, maxDim, quality);
      
      setPreview(dataUrl);
      setHasUserSelected(true);
      onChange(dataUrl);
    } catch (err) {
      console.warn('Compression failed, falling back to direct base64 read:', err);
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        setPreview(base64);
        setHasUserSelected(true);
        onChange(base64);
      };
      reader.readAsDataURL(file);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const clearImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreview('');
    setHasUserSelected(true);
    onChange('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-semibold text-slate-700">{label}</label>
      {helperText && <p className="text-xs text-slate-500">{helperText}</p>}

      <div
        id="image-dropzone"
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => !isProcessing && fileInputRef.current?.click()}
        className={`relative cursor-pointer border-2 border-dashed rounded-xl transition-all p-4 flex flex-col items-center justify-center text-center group ${
          isDragging
            ? 'border-indigo-600 bg-indigo-50/50'
            : preview
            ? 'border-slate-200 bg-slate-50/50 hover:bg-slate-100/50'
            : 'border-slate-300 hover:border-indigo-400 bg-slate-50/30 hover:bg-indigo-50/20'
        } ${aspectRatio === 'square' ? 'min-h-[160px]' : 'min-h-[220px]'}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        />

        {isProcessing ? (
          <div className="py-6 flex flex-col items-center gap-2 text-indigo-600 animate-in fade-in">
            <RefreshCw className="w-6 h-6 animate-spin" />
            <span className="text-xs font-semibold">Optimizing image...</span>
          </div>
        ) : preview ? (
          <div className="relative w-full flex flex-col items-center">
            <div className={`relative overflow-hidden rounded-lg border border-slate-200 shadow-xs ${aspectRatio === 'square' ? 'w-28 h-28' : 'w-full max-h-56'}`}>
              <img
                src={preview}
                alt="Preview"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <button
              type="button"
              id="clear-image-btn"
              onClick={clearImage}
              className="absolute -top-2 -right-2 p-1 bg-white text-rose-600 rounded-full shadow-md border border-slate-200 hover:bg-rose-50 transition cursor-pointer"
              title="Remove image"
            >
              <X className="w-4 h-4" />
            </button>
            <span className="mt-2 text-xs font-medium text-indigo-600 group-hover:underline">
              Click to replace image
            </span>
          </div>
        ) : (
          <div className="space-y-2 py-2">
            <div className="w-12 h-12 mx-auto rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              {aspectRatio === 'square' ? <Camera className="w-6 h-6" /> : <ImageIcon className="w-6 h-6" />}
            </div>
            <div>
              <p className="text-sm font-medium text-slate-700">
                <span className="text-indigo-600 underline">Click to upload</span> or drag and drop
              </p>
              <p className="text-xs text-slate-400 mt-0.5">PNG, JPG, or WEBP (Up to 15MB)</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
