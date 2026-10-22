import React, { useEffect, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight, Maximize2 } from 'lucide-react';

export interface ImageLightboxProps {
  images: string[];
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (index: number) => void;
  title?: string;
}

export const ImageLightbox: React.FC<ImageLightboxProps> = ({
  images,
  currentIndex,
  isOpen,
  onClose,
  onNavigate,
  title,
}) => {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') onNavigate((currentIndex + 1) % images.length);
      if (e.key === 'ArrowLeft') onNavigate((currentIndex - 1 + images.length) % images.length);
    },
    [isOpen, currentIndex, images.length, onClose, onNavigate]
  );

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen || images.length === 0) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md animate-in fade-in duration-200 select-none"
      onClick={onClose}
    >
      {/* Top Bar Header */}
      <div
        className="absolute top-0 inset-x-0 flex items-center justify-between p-4 sm:p-6 text-white bg-gradient-to-b from-black/80 to-transparent z-10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3">
          <Maximize2 className="w-5 h-5 text-brand-400" />
          {title && <h4 className="text-sm font-semibold truncate max-w-xs sm:max-w-md">{title}</h4>}
          <span className="text-xs text-charcoal-400 font-mono bg-charcoal-900/80 px-2.5 py-1 rounded-full border border-charcoal-800">
            {currentIndex + 1} / {images.length}
          </span>
        </div>
        <button
          onClick={onClose}
          className="rounded-full p-2 bg-charcoal-800/80 text-white hover:bg-charcoal-700 transition-colors"
          aria-label="Close viewer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main Image Container */}
      <div
        className="relative max-w-5xl max-h-[75vh] w-full px-4 flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={images[currentIndex]}
          alt={`Preview ${currentIndex + 1}`}
          className="max-h-[75vh] max-w-full rounded-2xl object-contain shadow-2xl shadow-brand-500/10 border border-charcoal-800"
        />

        {/* Previous Navigation Button */}
        {images.length > 1 && (
          <button
            onClick={() => onNavigate((currentIndex - 1 + images.length) % images.length)}
            className="absolute left-6 sm:left-8 top-1/2 -translate-y-1/2 rounded-full p-3 bg-charcoal-900/80 hover:bg-brand-600 text-white backdrop-blur-sm transition-all shadow-lg border border-charcoal-700 hover:scale-105"
            aria-label="Previous image"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}

        {/* Next Navigation Button */}
        {images.length > 1 && (
          <button
            onClick={() => onNavigate((currentIndex + 1) % images.length)}
            className="absolute right-6 sm:right-8 top-1/2 -translate-y-1/2 rounded-full p-3 bg-charcoal-900/80 hover:bg-brand-600 text-white backdrop-blur-sm transition-all shadow-lg border border-charcoal-700 hover:scale-105"
            aria-label="Next image"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}
      </div>

      {/* Thumbnail Strip */}
      {images.length > 1 && (
        <div
          className="absolute bottom-4 inset-x-0 flex items-center justify-center gap-2 px-4 overflow-x-auto py-2 z-10"
          onClick={(e) => e.stopPropagation()}
        >
          {images.map((img, idx) => (
            <button
              key={idx}
              onClick={() => onNavigate(idx)}
              className={`relative h-14 w-20 rounded-lg overflow-hidden border-2 transition-all shrink-0 ${
                idx === currentIndex
                  ? 'border-brand-500 scale-105 shadow-md shadow-brand-500/30'
                  : 'border-charcoal-700 opacity-60 hover:opacity-100'
              }`}
            >
              <img src={img} alt={`Thumbnail ${idx + 1}`} className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
