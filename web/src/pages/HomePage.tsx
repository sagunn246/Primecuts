import React, { useEffect, useState, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import {
  ArrowRight,
  Truck,
  MapPin,
  Scale,
  Search,
  X,
  ChevronDown,
  ShieldCheck,
  Clock,
  Utensils,
  PackageCheck,
  ShoppingBag,
  ShoppingCart,
  ClipboardList,
  Bike,
} from "lucide-react";
import ProductCard from "../components/ProductCard";
import ShopShowcaseSection from "../components/ShopShowcaseSection";
import SEO from "../components/SEO";
import { useStoreStatus } from "../context/StoreStatusContext";
import { Product, Category } from "@/types/types";

export default function HomePage() {
  const { freeDeliveryThreshold } = useStoreStatus();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCategory = searchParams.get("category") || "";
  const initialQuery = searchParams.get("q") || "";
  const initialSort = searchParams.get("sort") || "popular";

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedCategory, setSelectedCategory] =
    useState<string>(initialCategory);
  const [searchQuery, setSearchQuery] = useState<string>(initialQuery);
  const [sortOption, setSortOption] = useState<string>(initialSort);
  const [showSortDropdown, setShowSortDropdown] = useState(false);

  const sortRef = useRef<HTMLDivElement>(null);

  const sortOptions = [
    { value: "popular", label: "Popular Cuts" },
    { value: "price-asc", label: "Price: Low to High" },
    { value: "price-desc", label: "Price: High to Low" },
    { value: "name-asc", label: "Name: A to Z" },
  ];

  useEffect(() => {
    setSelectedCategory(searchParams.get("category") || "");
    setSearchQuery(searchParams.get("q") || "");
  }, [searchParams]);

  useEffect(() => {
    let isMounted = true;

    try {
      sessionStorage.removeItem("prime_cached_products");
      sessionStorage.removeItem("prime_cached_categories");
    } catch {}

    async function loadData() {
      try {
        setLoading(true);
        const [prodRes, catRes] = await Promise.all([
          fetch("/api/products"),
          fetch("/api/products/categories"),
        ]);

        const [prodData, catData] = await Promise.all([
          prodRes.json(),
          catRes.json(),
        ]);

        if (isMounted) {
          if (prodData.success && Array.isArray(prodData.products)) {
            setProducts(prodData.products);
          } else {
            setProducts([]);
          }

          if (catData.success && Array.isArray(catData.categories)) {
            setCategories(catData.categories);
          } else {
            setCategories([]);
          }
        }
      } catch (err) {
        console.error(
          "Failed to load products or categories from database API",
          err
        );
        if (isMounted) {
          setProducts([]);
          setCategories([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }
    loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(event.target as Node)) {
        setShowSortDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleCategorySelect = (categoryName: string) => {
    setSelectedCategory(categoryName);
    const newParams = new URLSearchParams(searchParams);
    if (categoryName) {
      newParams.set("category", categoryName);
    } else {
      newParams.delete("category");
    }
    setSearchParams(newParams, { replace: true });
  };

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    const newParams = new URLSearchParams(searchParams);
    if (val.trim()) {
      newParams.set("q", val);
    } else {
      newParams.delete("q");
    }
    setSearchParams(newParams, { replace: true });
  };

  const clearSearch = () => {
    setSearchQuery("");
    const newParams = new URLSearchParams(searchParams);
    newParams.delete("q");
    setSearchParams(newParams, { replace: true });
  };

  const filteredProducts = products.filter((product) => {
    const matchesCategory =
      !selectedCategory ||
      product.category?.toLowerCase() === selectedCategory.toLowerCase();

    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      product.name?.toLowerCase().includes(q) ||
      product.category?.toLowerCase().includes(q) ||
      product.description?.toLowerCase().includes(q);

    return matchesCategory && matchesSearch;
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortOption === "price-asc") {
      return (a.pricePerKg ?? 0) - (b.pricePerKg ?? 0);
    }
    if (sortOption === "price-desc") {
      return (b.pricePerKg ?? 0) - (a.pricePerKg ?? 0);
    }
    if (sortOption === "name-asc") {
      return a.name.localeCompare(b.name);
    }
    if (a.isFeatured && !b.isFeatured) return -1;
    if (!a.isFeatured && b.isFeatured) return 1;
    return 0;
  });

  const currentSortLabel =
    sortOptions.find((o) => o.value === sortOption)?.label || "Popular Cuts";

  return (
    <div className="flex flex-col bg-white md:bg-[#f8f8f9]">
      <SEO
        title="Fresh, Clean & Quality Meat in Pokhara"
        description="Locally sourced castrated goat (khasi), boka, giriraj local chicken, broiler, fresh eggs, sausages, and momos cleanly prepped at Khudi Chowk, Pokhara-30. Order fresh meat online with fast home delivery."
        keywords="Prime Cuts Pokhara, Khasi meat Pokhara, खसीको मासु पोखरा, fresh butcher house, local chicken delivery, broiler chicken Pokhara, buff meat, pork cuts, sausages Pokhara"
        url="/"
      />

      {/* 1. STOREFRONT HERO BANNER (DESKTOP ONLY — Mobile opens directly to catalog) */}
      <section className="hidden md:block relative bg-zinc-900 text-white overflow-hidden border-b border-zinc-800">
        <div className="absolute inset-0 z-0 pointer-events-none">
          <img
            src="/images/hero_bg_desktop.jpg"
            alt="Prime Cuts Butcher House Pokhara"
            className="w-full h-full object-cover object-[75%_center] opacity-80"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-950/85 to-zinc-950/20" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-20 w-full">
          <div className="max-w-xl flex flex-col items-start text-left">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/10 border border-white/15 text-xs font-medium text-zinc-200 mb-3">
              <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
              <span>Khudi Chowk, Pokhara-30 • Fresh Daily Cuts</span>
            </div>

            <h1 className="text-4xl lg:text-5xl font-bold tracking-tight leading-[1.15] text-white mb-3">
              Farm-Fresh Meat,{" "}
              <span className="text-primary">Cut Daily to Your Order.</span>
            </h1>

            <p className="text-base text-zinc-300 mb-6 max-w-lg font-normal leading-relaxed">
              Locally sourced castrated goat (khasi), Giriraj & broiler chicken,
              buff, pork, sausages, and momos — hygienically prepared every
              morning for counter pickup or doorstep delivery.
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <a
                href="#shop-cuts"
                className="h-11 px-5 bg-primary hover:bg-primary-hover text-white font-semibold rounded-lg transition-colors text-sm inline-flex items-center gap-2 cursor-pointer shadow-xs"
              >
                <span>Shop All Cuts</span>
                <ArrowRight className="w-4 h-4" />
              </a>

              <a
                href="#butcher-store"
                className="h-11 px-4 bg-white/10 hover:bg-white/15 text-white font-semibold rounded-lg transition-colors text-sm inline-flex items-center gap-1.5 border border-white/15 cursor-pointer"
              >
                <span>Our Butcher Shop</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* 2. SERVICE STANDARDS STRIP (DESKTOP ONLY) */}
      <section className="hidden md:block bg-white border-b border-zinc-200 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-4 gap-6 divide-x divide-zinc-200">
            <div className="flex items-center gap-3 pr-4">
              <div className="w-9 h-9 rounded-lg bg-zinc-100 border border-zinc-200/80 flex items-center justify-center text-primary shrink-0">
                <Clock className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-zinc-900 text-sm font-semibold leading-tight truncate">
                  Fresh Morning Cut
                </p>
                <p className="text-zinc-500 text-xs mt-0.5 truncate">
                  Prepared daily from 7:00 AM
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 px-4">
              <div className="w-9 h-9 rounded-lg bg-zinc-100 border border-zinc-200/80 flex items-center justify-center text-primary shrink-0">
                <Scale className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-zinc-900 text-sm font-semibold leading-tight truncate">
                  Exact Digital Weight
                </p>
                <p className="text-zinc-500 text-xs mt-0.5 truncate">
                  250g, 500g, 1kg or custom
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 px-4">
              <div className="w-9 h-9 rounded-lg bg-zinc-100 border border-zinc-200/80 flex items-center justify-center text-primary shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-zinc-900 text-sm font-semibold leading-tight truncate">
                  100% Hygienic Prep
                </p>
                <p className="text-zinc-500 text-xs mt-0.5 truncate">
                  Clean food-grade packaging
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 pl-4">
              <div className="w-9 h-9 rounded-lg bg-zinc-100 border border-zinc-200/80 flex items-center justify-center text-primary shrink-0">
                <Truck className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-zinc-900 text-sm font-semibold leading-tight truncate">
                  Fast Doorstep Delivery
                </p>
                <p className="text-zinc-500 text-xs mt-0.5 truncate">
                  Free above Rs. {freeDeliveryThreshold}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. MAIN PRODUCT CATALOG (MOBILE APP & DESKTOP) */}
      <section
        id="shop-cuts"
        className="pt-3.5 pb-8 sm:py-12 max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 w-full scroll-mt-20"
      >
        {/* Catalog Header Row: Title on Left, Sort Control on Right */}
        <div className="flex items-center justify-between gap-2 pb-3 mb-3 border-b border-zinc-100 md:border-zinc-200">
          <div className="min-w-0">
            <h2 className="text-[17px] sm:text-2xl font-bold text-zinc-900 tracking-tight leading-snug truncate">
              {selectedCategory ? selectedCategory : "Choose Your Fresh Cut"}
            </h2>
            <p className="text-[11px] sm:text-xs text-zinc-500 font-medium mt-0.5 tabular-nums">
              {sortedProducts.length}{" "}
              {sortedProducts.length === 1 ? "item" : "items"} available • Cut
              fresh daily
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Desktop Inline Filter Input */}
            <div className="hidden md:block relative w-60">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Filter cuts by name..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full h-9 pl-9 pr-8 bg-white text-zinc-900 placeholder-zinc-400 rounded-lg text-xs font-medium border border-zinc-200 focus:border-zinc-900 focus:outline-none transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 cursor-pointer"
                  title="Clear filter"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Sort Dropdown (Aligned cleanly in Header Row on Mobile & Desktop) */}
            <div className="relative shrink-0" ref={sortRef}>
              <button
                type="button"
                onClick={() => setShowSortDropdown((prev) => !prev)}
                className="h-8 sm:h-9 flex items-center gap-1.5 bg-zinc-100/90 md:bg-white border border-zinc-200 hover:border-zinc-300 rounded-lg px-2.5 sm:px-3 text-[11px] sm:text-xs font-semibold text-zinc-800 transition-colors cursor-pointer"
              >
                <span>Sort: {currentSortLabel}</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-zinc-500 transition-transform duration-150 ${
                    showSortDropdown ? "rotate-180" : ""
                  }`}
                />
              </button>

              {showSortDropdown && (
                <div className="absolute right-0 top-full mt-1.5 bg-white border border-zinc-200 rounded-xl shadow-lg z-50 overflow-hidden min-w-[175px]">
                  {sortOptions.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        setSortOption(opt.value);
                        setShowSortDropdown(false);
                      }}
                      className={`w-full text-left px-3.5 py-2.5 text-xs font-medium transition-colors cursor-pointer flex items-center justify-between ${
                        sortOption === opt.value
                          ? "bg-zinc-900 text-white font-semibold"
                          : "text-zinc-700 hover:bg-zinc-50"
                      }`}
                    >
                      <span>{opt.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Horizontal Category Filter Pills */}
        <div className="mb-4 sm:mb-6">
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 max-w-full no-scrollbar flex-nowrap smooth-scroll-x overscroll-x-contain select-none">
            <button
              type="button"
              onClick={() => handleCategorySelect("")}
              className={`h-8 sm:h-9 px-3 sm:px-3.5 rounded-lg text-xs font-semibold transition-all border shrink-0 whitespace-nowrap cursor-pointer active:scale-95 ${
                selectedCategory === ""
                  ? "bg-primary border-primary text-white shadow-2xs"
                  : "bg-zinc-100/80 md:bg-white border-zinc-200 text-zinc-700 hover:border-zinc-300"
              }`}
            >
              All Meats ({products.length})
            </button>

            {categories.map((cat) => {
              const catName = typeof cat === "string" ? cat : cat.name;
              const isSelected =
                selectedCategory.toLowerCase() === catName.toLowerCase();
              const count = products.filter(
                (p) => p.category?.toLowerCase() === catName.toLowerCase()
              ).length;

              return (
                <button
                  key={catName}
                  type="button"
                  onClick={() => handleCategorySelect(catName)}
                  className={`h-8 sm:h-9 px-3 sm:px-3.5 rounded-lg text-xs font-semibold transition-all border shrink-0 whitespace-nowrap cursor-pointer active:scale-95 ${
                    isSelected
                      ? "bg-primary border-primary text-white shadow-2xs"
                      : "bg-zinc-100/80 md:bg-white border-zinc-200 text-zinc-700 hover:border-zinc-300"
                  }`}
                >
                  {catName} {count > 0 && `(${count})`}
                </button>
              );
            })}
          </div>
        </div>

        {/* Products Grid: 2 Columns on Mobile App for Clean Readability, 3 on Tablet, 4 on Desktop */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-xl border border-zinc-200 overflow-hidden h-68 animate-pulse flex flex-col"
              >
                <div className="aspect-[4/3] bg-zinc-200/70" />
                <div className="p-3 space-y-2.5 flex-1 flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <div className="h-3.5 bg-zinc-200 rounded w-3/4" />
                    <div className="h-3 bg-zinc-100 rounded w-1/2" />
                  </div>
                  <div className="h-8 bg-zinc-100 rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        ) : sortedProducts.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-5">
            {sortedProducts.map((product) => (
              <ProductCard
                key={product.id}
                id={product.id}
                slug={product.slug}
                name={product.name}
                priceType={product.priceType}
                pricePerKg={product.pricePerKg}
                variants={product.variants}
                image={product.image}
                category={product.category}
                isAvailable={product.isAvailable ?? product.available ?? true}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-14 bg-zinc-50 rounded-xl border border-zinc-200 p-6 max-w-md mx-auto space-y-3">
            <div className="w-10 h-10 rounded-lg bg-white text-zinc-500 flex items-center justify-center mx-auto border border-zinc-200">
              <Search className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-zinc-900">
              No meat cuts found
            </h3>
            <p className="text-xs text-zinc-500 leading-relaxed">
              {searchQuery || selectedCategory
                ? "No items match your current filter. Reset filters to view all available cuts."
                : "Our butchers are updating today's catalog. Please check back shortly."}
            </p>
            {(searchQuery || selectedCategory) && (
              <button
                type="button"
                onClick={() => {
                  handleCategorySelect("");
                  clearSearch();
                }}
                className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Reset Filters
              </button>
            )}
          </div>
        )}
      </section>

      {/* 4. PHYSICAL STORE & OUTLET SHOWCASE */}
      <ShopShowcaseSection />

      {/* 5. HOW TO ORDER / PREPARATION STANDARDS */}
      <section className="bg-zinc-50 md:bg-zinc-100/70 md:border-t md:border-zinc-200 pt-2 sm:py-14">
        {/* Mobile App View: Compact 5-Step Flow Attached to Dark Footer */}
        <div className="md:hidden bg-[#141416] rounded-t-2xl border-t border-zinc-800 text-white pt-5 pb-3 px-4">
          <div className="text-center mb-3.5">
            <span className="text-primary font-bold text-[10px] uppercase tracking-widest block">
              Simple Ordering
            </span>
            <h2 className="text-xs font-bold uppercase tracking-wide text-white mt-0.5">
              Order Fresh Cuts by Weight
            </h2>
          </div>

          <div className="grid grid-cols-5 gap-1 items-start max-w-md mx-auto">
            {[
              { icon: ShoppingBag, label: "Select" },
              { icon: Scale, label: "Weight" },
              { icon: ShoppingCart, label: "Cart" },
              { icon: ClipboardList, label: "Order" },
              { icon: Bike, label: "Deliver" },
            ].map((step, i) => {
              const Icon = step.icon;
              return (
                <div key={i} className="flex flex-col items-center">
                  <div className="w-9 h-9 rounded-xl bg-zinc-800/90 text-white flex items-center justify-center mb-1.5 border border-zinc-700/80">
                    <Icon className="w-4 h-4 text-primary" />
                  </div>
                  <span className="font-semibold text-[10px] text-zinc-300 leading-tight text-center">
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Desktop View: 3-Column Butcher Standards */}
        <div className="hidden md:block max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-8">
            <span className="text-xs font-semibold uppercase tracking-wider text-primary block mb-1.5">
              Our Butcher Standards
            </span>
            <h2 className="text-2xl font-bold text-zinc-900 tracking-tight">
              Prepared Fresh to Your Exact Specification
            </h2>
            <p className="text-zinc-600 text-sm mt-1.5 leading-relaxed">
              Every order at Prime Cuts is portioned fresh from the morning block according to your recipe needs.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl border border-zinc-200/90">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-lg bg-zinc-100 border border-zinc-200 text-primary flex items-center justify-center">
                  <Utensils className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-zinc-400 tabular-nums">
                  01
                </span>
              </div>
              <h3 className="text-base font-bold text-zinc-900 mb-1.5">
                Custom Cut Preferences
              </h3>
              <p className="text-sm text-zinc-600 leading-relaxed">
                Choose medium curry cuts, small soup (jhol) pieces, large biryani cuts, or lean boneless portions on any product page.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-zinc-200/90">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-lg bg-zinc-100 border border-zinc-200 text-primary flex items-center justify-center">
                  <PackageCheck className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-zinc-400 tabular-nums">
                  02
                </span>
              </div>
              <h3 className="text-base font-bold text-zinc-900 mb-1.5">
                Sanitary Food-Grade Sealing
              </h3>
              <p className="text-sm text-zinc-600 leading-relaxed">
                Weighing is done on calibrated digital scales and packed in clean, food-safe pouches with zero chemical preservatives.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-zinc-200/90">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-lg bg-zinc-100 border border-zinc-200 text-primary flex items-center justify-center">
                  <Truck className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-zinc-400 tabular-nums">
                  03
                </span>
              </div>
              <h3 className="text-base font-bold text-zinc-900 mb-1.5">
                Scheduled & Express Delivery
              </h3>
              <p className="text-sm text-zinc-600 leading-relaxed">
                Select morning, afternoon, evening, or 45-minute express dispatch across Pokhara, or pick up directly at Khudi Chowk.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
