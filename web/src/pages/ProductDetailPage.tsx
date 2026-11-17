import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Scale,
  ShieldCheck,
} from "lucide-react";
import WeightSelector from "../components/WeightSelector";
import ProductGallery from "../components/ProductGallery";
import SEO from "../components/SEO";
import { Product } from "@/types/types";

export default function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function loadProduct() {
      if (!slug) return;
      setLoading(true);
      try {
        const res = await fetch(`/api/products/${slug}`);
        if (res.status === 404) {
          setNotFound(true);
          return;
        }
        const data = await res.json();
        if (data.success && data.product) {
          setProduct(data.product);
        } else {
          setNotFound(true);
        }
      } catch (err) {
        console.error("Failed to load product", err);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }

    loadProduct();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-[#f8f8f9]">
        <div className="text-zinc-500 font-medium text-sm">
          Loading cut details...
        </div>
      </div>
    );
  }

  if (notFound || !product) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-4 bg-[#f8f8f9] text-center">
        <h2 className="text-xl font-bold text-zinc-900 mb-2">
          Product Not Found
        </h2>
        <p className="text-zinc-500 text-sm mb-5 max-w-sm">
          The meat cut you are looking for does not exist or is currently unavailable.
        </p>
        <Link
          to="/"
          className="px-5 py-2.5 bg-primary text-white font-semibold text-sm rounded-lg hover:bg-primary-hover transition-colors"
        >
          Back to Meat Catalog
        </Link>
      </div>
    );
  }

  const price =
    product.priceType === "weight"
      ? product.pricePerKg
      : product.variants?.[0]?.price;
  const isAvailable = product.isAvailable ?? product.available ?? true;

  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    image: product.image
      ? [product.image]
      : ["https://primecuts.com.np/icon-512x512.png"],
    description:
      product.description ||
      `${product.name} - Fresh, clean and hygienic cut available at Prime Cuts Butcher House Pokhara.`,
    category: product.category,
    offers: {
      "@type": "Offer",
      url: `https://primecuts.com.np/product/${product.slug}`,
      priceCurrency: "NPR",
      price: price || 0,
      priceValidUntil: "2027-12-31",
      availability: isAvailable
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      seller: {
        "@type": "Organization",
        name: "Prime Cuts Butcher House",
      },
    },
  };

  return (
    <div className="bg-[#f8f8f9] min-h-screen pt-4 sm:pt-8 pb-24 md:pb-16 w-full flex-grow">
      <SEO
        title={`${product.name} (Fresh ${product.category})`}
        description={
          product.description ||
          `Order fresh ${product.name} from Prime Cuts Butcher House, Khudi Chowk, Pokhara-30. Clean, hygienic, and fast doorstep delivery.`
        }
        keywords={`${product.name}, ${product.category} Pokhara, fresh meat Pokhara, butcher house, ${product.name} price Nepal`}
        image={product.image}
        url={`/product/${product.slug}`}
        type="product"
        schema={productSchema}
      />

      <div className="max-w-6xl mx-auto px-3.5 sm:px-6 lg:px-8 w-full">
        {/* Breadcrumb / Back Navigation */}
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div className="flex items-center gap-1.5 text-xs text-zinc-500 font-medium">
            <Link
              to="/"
              className="inline-flex items-center gap-1 text-zinc-700 hover:text-primary font-semibold transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Catalog</span>
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
            <Link
              to={`/?category=${encodeURIComponent(product.category)}`}
              className="hover:text-zinc-900 transition-colors"
            >
              {product.category}
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-zinc-400 hidden sm:inline" />
            <span className="text-zinc-900 font-medium truncate max-w-[180px] hidden sm:inline">
              {product.name}
            </span>
          </div>
        </div>

        {/* Main Product Card */}
        <div className="bg-white rounded-xl border border-zinc-200 p-4 sm:p-6 lg:p-8 shadow-2xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-10 lg:gap-12">
            {/* Left: Image Gallery */}
            <div>
              <ProductGallery
                images={[product.image, ...(product.images || [])].filter(
                  Boolean
                )}
                productName={product.name}
                isAvailable={isAvailable}
              />
            </div>

            {/* Right: Product Details & Configuration */}
            <div className="flex flex-col justify-between">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-zinc-100 border border-zinc-200 text-zinc-700 text-xs font-semibold w-fit mb-2.5">
                  <span>{product.category}</span>
                </div>

                <h1 className="text-xl sm:text-3xl font-bold text-zinc-900 leading-tight mb-2 tracking-tight">
                  {product.name}
                </h1>

                <div className="text-xl sm:text-2xl font-bold text-primary mb-3 flex items-baseline gap-1.5 tabular-nums">
                  {product.priceType === "weight" ? (
                    <>
                      <span>Rs. {product.pricePerKg?.toLocaleString()}</span>
                      <span className="text-zinc-500 text-xs sm:text-sm font-normal">
                        / kg
                      </span>
                    </>
                  ) : (
                    <>
                      <span>
                        Rs. {product.variants?.[0]?.price?.toLocaleString()}
                      </span>
                      <span className="text-zinc-500 text-xs sm:text-sm font-normal">
                        onwards
                      </span>
                    </>
                  )}
                </div>

                {product.description && (
                  <p className="text-zinc-600 text-xs sm:text-sm leading-relaxed mb-4 pb-4 border-b border-zinc-100">
                    {product.description}
                  </p>
                )}

                <WeightSelector product={product} isAvailable={isAvailable} />
              </div>

              {/* Butcher Assurance Strip */}
              <div className="grid grid-cols-3 gap-2 pt-5 mt-6 border-t border-zinc-100 text-[11px] text-zinc-600 font-medium">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span>Fresh Daily Cut</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Scale className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span>Exact Digital Weight</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span>Hygienic Pouch</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
