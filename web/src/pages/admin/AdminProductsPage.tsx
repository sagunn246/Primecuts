import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Plus,
  Edit,
  Trash2,
  Image as ImageIcon,
  Search,
  AlertCircle,
  Loader2,
  X,
  Tags,
  RefreshCw,
} from "lucide-react";
import StockToggle from "../../components/admin/StockToggle";
import { getProductImageUrl, handleProductImageError } from "@/utils/imageUtils";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [stockFilter, setStockFilter] = useState<"all" | "in_stock" | "sold_out">("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [productToDelete, setProductToDelete] = useState<{ id: string; name: string } | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const ts = Date.now();
      const [prodRes, catRes] = await Promise.all([
        fetch(`/api/admin/products?_t=${ts}`, { credentials: "include", cache: "no-store" }),
        fetch(`/api/admin/categories?_t=${ts}`, { credentials: "include", cache: "no-store" }),
      ]);
      const [prodData, catData] = await Promise.all([prodRes.json(), catRes.json()]);

      if (prodData.success && prodData.products) {
        setProducts(prodData.products);
      }
      if (catData.success && catData.categories) {
        setCategories(catData.categories);
      }
    } catch (err) {
      console.error("Failed to load products or categories", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDeleteConfirm = async () => {
    if (!productToDelete) return;
    const targetId = productToDelete.id || (productToDelete as any)._id;
    setDeletingId(targetId);
    try {
      const res = await fetch(`/api/admin/products/${targetId}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) {
        setProducts((prev) => prev.filter((p) => (p.id || p._id) !== targetId));
        setFeedback({ type: "success", message: `"${productToDelete.name}" deleted.` });
        setTimeout(() => setFeedback(null), 3500);
      } else {
        setFeedback({ type: "error", message: data.error || "Failed to delete product." });
      }
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message || "Failed to delete product." });
    } finally {
      setDeletingId(null);
      setProductToDelete(null);
    }
  };

  const inStockCount = products.filter((p) => (p.available ?? p.isAvailable ?? true) === true).length;
  const soldOutCount = products.length - inStockCount;

  const filteredProducts = products.filter((product) => {
    const isAvailable = Boolean(product.available ?? product.isAvailable ?? true);
    const matchesStock =
      stockFilter === "all" ||
      (stockFilter === "in_stock" && isAvailable) ||
      (stockFilter === "sold_out" && !isAvailable);

    const matchesCategory =
      selectedCategory === "all" ||
      product.category?.toLowerCase() === selectedCategory.toLowerCase();

    const matchesSearch =
      !searchQuery ||
      product.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.category?.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesStock && matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-3.5 pb-6">
      {/* Toast Feedback */}
      {feedback && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[200] w-[calc(100%-2rem)] max-w-sm animate-in fade-in">
          <div
            className={`rounded-xl shadow-lg px-4 py-3 flex items-center gap-2.5 text-white text-xs font-semibold ${
              feedback.type === "success" ? "bg-stone-900" : "bg-red-600"
            }`}
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            <p className="flex-1">{feedback.message}</p>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* TOP INVENTORY TOOLBAR                                             */}
      {/* ================================================================= */}
      <div className="bg-white rounded-xl border border-stone-200/90 p-3 shadow-[0_1px_2px_rgba(0,0,0,0.03)] space-y-2.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          {/* Stock Status Segmented Filter */}
          <div className="grid grid-cols-3 bg-stone-100 p-0.5 rounded-lg border border-stone-200/80">
            {[
              { id: "all", label: "All Cuts", count: products.length },
              { id: "in_stock", label: "In Stock", count: inStockCount },
              { id: "sold_out", label: "Sold Out", count: soldOutCount },
            ].map((item) => {
              const active = stockFilter === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setStockFilter(item.id as any)}
                  className={`px-2.5 py-1.5 rounded-md text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    active
                      ? "bg-white text-stone-900 shadow-2xs"
                      : "text-stone-600 hover:text-stone-900"
                  }`}
                >
                  <span>{item.label}</span>
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.2 rounded tabular-nums ${
                      active ? "bg-stone-900 text-white" : "bg-stone-200/80 text-stone-600"
                    }`}
                  >
                    {item.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Primary Actions */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={loadData}
              className="h-9 px-2.5 rounded-lg border border-stone-200/90 bg-stone-50 hover:bg-stone-100 text-stone-600 flex items-center justify-center cursor-pointer"
              title="Refresh Inventory"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-primary" : ""}`} />
            </button>
            <Link
              to="/admin/categories"
              className="h-9 px-3 rounded-lg border border-stone-200/90 bg-white hover:bg-stone-50 text-stone-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Tags className="w-3.5 h-3.5 text-stone-400" />
              <span>Categories</span>
            </Link>
            <Link
              to="/admin/products/new"
              className="flex-1 sm:flex-initial h-9 px-3.5 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-semibold flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Add Cut</span>
            </Link>
          </div>
        </div>

        {/* Search & Horizontal Category Pills */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <div className="relative sm:w-72 shrink-0">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              placeholder="Filter cuts by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-8.5 pl-8.5 pr-7 bg-stone-50 focus:bg-white border border-stone-200/90 focus:border-stone-400 rounded-lg text-xs font-medium text-stone-900 outline-none transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 p-0.5 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            <button
              type="button"
              onClick={() => setSelectedCategory("all")}
              className={`h-7 px-2.5 rounded-md text-[11px] font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                selectedCategory === "all"
                  ? "bg-stone-900 text-white"
                  : "bg-stone-100 text-stone-600 hover:bg-stone-200/70"
              }`}
            >
              All Categories
            </button>
            {categories.map((cat) => {
              const isSelected = selectedCategory.toLowerCase() === (cat.name || "").toLowerCase();
              return (
                <button
                  key={cat.id || cat.name}
                  type="button"
                  onClick={() => setSelectedCategory(cat.name)}
                  className={`h-7 px-2.5 rounded-md text-[11px] font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                    isSelected
                      ? "bg-stone-900 text-white"
                      : "bg-stone-100 text-stone-600 hover:bg-stone-200/70"
                  }`}
                >
                  {cat.name}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="p-12 text-center text-stone-400 text-xs font-medium bg-white rounded-xl border border-stone-200/90">
          <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-primary" />
          Loading catalog inventory...
        </div>
      )}

      {/* Empty state */}
      {!loading && filteredProducts.length === 0 && (
        <div className="p-10 text-center text-stone-500 bg-white rounded-xl border border-stone-200/90 space-y-2">
          <ImageIcon className="w-8 h-8 text-stone-300 mx-auto" />
          <p className="text-sm font-bold text-stone-800">No cuts match filter</p>
          <p className="text-xs text-stone-400 max-w-xs mx-auto">
            {searchQuery || selectedCategory !== "all" || stockFilter !== "all"
              ? "Try resetting your search or category filter."
              : "Add your first meat cut to populate the catalog."}
          </p>
        </div>
      )}

      {/* ================================================================= */}
      {/* MOBILE NATIVE INVENTORY LIST (High-Density Software Rows)         */}
      {/* ================================================================= */}
      {!loading && filteredProducts.length > 0 && (
        <div className="bg-white rounded-xl border border-stone-200/90 shadow-[0_1px_2px_rgba(0,0,0,0.03)] divide-y divide-stone-100 overflow-hidden md:hidden">
          {filteredProducts.map((product: any) => {
            const productId = product.id || product._id;
            const isAvailable = product.available ?? product.isAvailable ?? true;
            const priceDisplay =
              product.priceType === "weight" || product.price_type === "weight"
                ? `Rs. ${product.pricePerKg ?? product.price_per_kg}/kg`
                : product.variants?.length
                ? `Rs. ${product.variants[0].price} • ${product.variants[0].name}`
                : "—";

            return (
              <div key={productId} className="p-3 flex items-center justify-between gap-2.5">
                {/* Left: Thumbnail + Info */}
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div className="w-11 h-11 rounded-lg bg-stone-100 overflow-hidden border border-stone-200/80 shrink-0">
                    <img
                      src={getProductImageUrl(product.image)}
                      alt={product.name}
                      onError={handleProductImageError}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-stone-900 text-xs truncate leading-tight">
                      {product.name}
                    </h3>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-stone-100 text-stone-600 truncate max-w-[90px]">
                        {product.category || "Uncategorized"}
                      </span>
                      <span className="font-bold text-stone-900 text-xs tabular-nums">
                        {priceDisplay}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Instant Stock Switch + Edit/Delete */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <StockToggle
                    productId={productId.toString()}
                    initialAvailable={isAvailable}
                    onToggle={(newVal) => {
                      setProducts((prev) =>
                        prev.map((p) =>
                          (p.id || p._id) === productId
                            ? { ...p, available: newVal, isAvailable: newVal }
                            : p
                        )
                      );
                    }}
                  />
                  <Link
                    to={`/admin/products/${productId}/edit`}
                    className="w-8 h-8 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 flex items-center justify-center active:scale-95 transition-transform"
                    title="Edit"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </Link>
                  <button
                    type="button"
                    onClick={() => setProductToDelete({ id: productId, name: product.name })}
                    className="w-8 h-8 rounded-lg bg-stone-100 hover:bg-red-50 text-stone-400 hover:text-red-600 flex items-center justify-center active:scale-95 transition-all cursor-pointer"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ================================================================= */}
      {/* DESKTOP SOFTWARE DATA TABLE (>= md)                               */}
      {/* ================================================================= */}
      {!loading && filteredProducts.length > 0 && (
        <div className="hidden md:block bg-white rounded-xl border border-stone-200/90 shadow-[0_1px_2px_rgba(0,0,0,0.03)] overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead className="bg-stone-50/90 border-b border-stone-200/80 text-stone-500 text-[11px] uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4 w-14">Item</th>
                <th className="py-3 px-4">Product Cut</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Rate / Pricing</th>
                <th className="py-3 px-4">Availability</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-xs">
              {filteredProducts.map((product: any) => {
                const productId = product.id || product._id;
                const isAvailable = product.available ?? product.isAvailable ?? true;

                return (
                  <tr key={productId} className="hover:bg-stone-50/80 transition-colors">
                    <td className="py-2.5 px-4">
                      <div className="w-10 h-10 rounded-lg bg-stone-100 overflow-hidden border border-stone-200 flex items-center justify-center shrink-0">
                        <img
                          src={getProductImageUrl(product.image)}
                          alt={product.name}
                          onError={handleProductImageError}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </td>

                    <td className="py-2.5 px-4">
                      <p className="font-bold text-stone-900 text-[13px]">{product.name}</p>
                      {product.description && (
                        <p className="text-[11px] text-stone-400 line-clamp-1 max-w-sm mt-0.5">
                          {product.description}
                        </p>
                      )}
                    </td>

                    <td className="py-2.5 px-4">
                      <span className="inline-block px-2 py-0.5 bg-stone-100 text-stone-700 rounded text-[11px] font-semibold">
                        {product.category || "Uncategorized"}
                      </span>
                    </td>

                    <td className="py-2.5 px-4 font-bold text-stone-900 tabular-nums">
                      {product.priceType === "weight" || product.price_type === "weight"
                        ? `Rs. ${product.pricePerKg ?? product.price_per_kg}/kg`
                        : product.variants?.length
                        ? `Rs. ${product.variants[0].price} (${product.variants[0].name}${
                            product.variants.length > 1 ? ` +${product.variants.length - 1}` : ""
                          })`
                        : "—"}
                    </td>

                    <td className="py-2.5 px-4">
                      <StockToggle
                        productId={productId.toString()}
                        initialAvailable={isAvailable}
                        onToggle={(newVal) => {
                          setProducts((prev) =>
                            prev.map((p) =>
                              (p.id || p._id) === productId
                                ? { ...p, available: newVal, isAvailable: newVal }
                                : p
                            )
                          );
                        }}
                      />
                    </td>

                    <td className="py-2.5 px-4 text-right">
                      <div className="inline-flex items-center justify-end gap-1.5">
                        <Link
                          to={`/admin/products/${productId}/edit`}
                          className="h-7 px-2.5 bg-stone-100 text-stone-700 hover:bg-stone-200 hover:text-stone-900 rounded-md font-semibold text-[11px] inline-flex items-center gap-1 transition-colors"
                        >
                          <Edit className="w-3 h-3" />
                          <span>Edit</span>
                        </Link>
                        <button
                          onClick={() => setProductToDelete({ id: productId, name: product.name })}
                          className="h-7 w-7 bg-stone-100 text-stone-400 hover:bg-red-50 hover:text-red-600 rounded-md inline-flex items-center justify-center transition-colors cursor-pointer"
                          title="Delete Cut"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {productToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-5 space-y-4 border border-stone-200 animate-in zoom-in-95">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-red-50 text-red-600 border border-red-200 flex items-center justify-center shrink-0">
                <Trash2 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-stone-900">Delete Product Cut</h3>
                <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                  Permanently remove <strong className="text-stone-900">"{productToDelete.name}"</strong> from your store catalog?
                </p>
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-1">
              <button
                onClick={() => setProductToDelete(null)}
                className="h-8 px-3.5 rounded-lg border border-stone-200 text-stone-600 font-semibold hover:bg-stone-50 transition-colors text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={Boolean(deletingId)}
                className="h-8 px-3.5 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 text-xs"
              >
                {deletingId && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Delete Cut
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
