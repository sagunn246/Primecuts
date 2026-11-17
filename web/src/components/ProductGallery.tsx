import React, { useState } from "react";
import { Store } from "lucide-react";
import { getProductImageUrl, handleProductImageError } from "@/utils/imageUtils";

interface ProductGalleryProps {
  images: string[];
  productName: string;
  isAvailable?: boolean;
}

export default function ProductGallery({
  images,
  productName,
  isAvailable = true,
}: ProductGalleryProps) {
  const validImages = Array.isArray(images)
    ? images.filter((img) => Boolean(img && img.trim()))
    : [];
  const [selectedImage, setSelectedImage] = useState<string>(
    validImages[0] || ""
  );

  const currentDisplayImage = selectedImage || validImages[0] || "";

  return (
    <div className="flex flex-col gap-3">
      {/* Main Image View */}
      <div className="relative aspect-[4/3] sm:aspect-square max-h-[300px] sm:max-h-none w-full rounded-xl bg-zinc-100 overflow-hidden border border-zinc-200 flex items-center justify-center">
        {currentDisplayImage ? (
          <img
            src={getProductImageUrl(currentDisplayImage)}
            alt={productName}
            onError={handleProductImageError}
            className={`w-full h-full object-cover transition-all duration-300 ${
              !isAvailable ? "grayscale" : ""
            }`}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-100 p-6 text-center select-none">
            <div className="w-12 h-12 rounded-xl bg-white border border-zinc-200 flex items-center justify-center mb-2 text-primary">
              <Store className="w-6 h-6" />
            </div>
            <p className="text-xs font-bold uppercase tracking-wider text-zinc-800">
              Prime Cuts
            </p>
            <p className="text-[11px] text-zinc-500 mt-0.5">
              Fresh Daily Cut
            </p>
          </div>
        )}

        {!isAvailable && (
          <div className="absolute inset-0 bg-zinc-950/50 flex items-center justify-center">
            <span className="text-xs font-semibold text-white px-3 py-1 bg-zinc-900 rounded-md uppercase tracking-wider">
              Out of Stock
            </span>
          </div>
        )}
      </div>

      {/* Thumbnails */}
      {validImages.length > 1 && (
        <div className="flex items-center gap-2.5 overflow-x-auto pb-1 no-scrollbar">
          {validImages.map((img, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setSelectedImage(img)}
              className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                (selectedImage || validImages[0]) === img
                  ? "border-primary opacity-100"
                  : "border-zinc-200 hover:border-zinc-300 opacity-70 hover:opacity-100"
              }`}
            >
              <img
                src={getProductImageUrl(img)}
                alt={`${productName} view ${idx + 1}`}
                onError={handleProductImageError}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
