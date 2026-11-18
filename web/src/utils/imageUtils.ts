import React from "react";

export const FALLBACK_PRODUCT_IMAGE = "/images/hero_prime_meat.jpg";
export const FALLBACK_CATEGORY_IMAGE = "/images/cat_chicken.jpg";

const rawApiUrl = (
  import.meta.env.VITE_API_URL || "https://api.primecutsbutcher.com"
).replace(/\/+$/, "");

const API_ORIGIN = rawApiUrl.replace(/\/api$/i, "");
const API_BASE_URL = `${API_ORIGIN}/api`;

function resolveHostedUploadPath(pathStr: string): string {
  if (pathStr.startsWith("/uploads/")) {
    return `${API_BASE_URL}${pathStr}`;
  }
  if (pathStr.startsWith("/api/uploads/")) {
    return `${API_BASE_URL}${pathStr.slice(4)}`;
  }
  return pathStr;
}

/**
 * Normalizes image URLs: handles null/undefined, ensures valid path format.
 */
export function getProductImageUrl(url?: string | null): string {
  if (!url || typeof url !== "string" || !url.trim()) {
    return FALLBACK_PRODUCT_IMAGE;
  }
  const trimmed = url.trim();
  if (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("data:") ||
    trimmed.startsWith("blob:")
  ) {
    return trimmed;
  }
  const normalized = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return resolveHostedUploadPath(normalized);
}

/**
 * Safely handles image loading errors by replacing the source with a verified fallback image.
 * Nullifies onerror immediately to prevent potential infinite loops.
 */
export function handleProductImageError(
  e: React.SyntheticEvent<HTMLImageElement, Event>,
  fallbackSrc: string = FALLBACK_PRODUCT_IMAGE
) {
  const target = e.currentTarget;
  if (!target) return;
  target.onerror = null; // Prevent infinite error loops
  target.src = fallbackSrc;
}

/**
 * Normalizes category image URLs.
 */
export function getCategoryImageUrl(url?: string | null): string {
  if (!url || typeof url !== "string" || !url.trim()) {
    return FALLBACK_CATEGORY_IMAGE;
  }
  const trimmed = url.trim();
  if (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("data:") ||
    trimmed.startsWith("blob:")
  ) {
    return trimmed;
  }
  const normalized = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return resolveHostedUploadPath(normalized);
}

/**
 * Handles category image loading errors.
 */
export function handleCategoryImageError(
  e: React.SyntheticEvent<HTMLImageElement, Event>,
  fallbackSrc: string = FALLBACK_CATEGORY_IMAGE
) {
  const target = e.currentTarget;
  if (!target) return;
  target.onerror = null;
  target.src = fallbackSrc;
}
