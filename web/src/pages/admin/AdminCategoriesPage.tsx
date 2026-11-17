import React, { useEffect, useState } from "react";
import {
  Plus,
  Edit,
  Trash2,
  Loader2,
  X,
  Check,
  AlertCircle,
  Eye,
  EyeOff,
  Search,
  Layers,
} from "lucide-react";
import { Category } from "@/types/types";
import { getCategoryImageUrl } from "@/utils/imageUtils";

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState("/images/cat_steaks.jpg");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("/images/cat_steaks.jpg");
  const [active, setActive] = useState(true);

  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/categories?_t=${Date.now()}`, {
        credentials: "include",
        cache: "no-store",
      });
      const data = await res.json();
      if (data.success && data.categories) {
        setCategories(data.categories);
      } else {
        setError(data.error || "Failed to load categories.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to connect to server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const openCreateModal = () => {
    setEditingCategory(null);
    setName("");
    setSlug("");
    setDescription("");
    setImage("/images/cat_steaks.jpg");
    setImageFile(null);
    setImagePreview("/images/cat_steaks.jpg");
    setActive(true);
    setError("");
    setIsModalOpen(true);
  };

  const openEditModal = (cat: Category) => {
    setEditingCategory(cat);
    setName(cat.name);
    setSlug(cat.slug);
    setDescription(cat.description || "");
    const currentImg = cat.image || "/images/cat_steaks.jpg";
    setImage(currentImg);
    setImageFile(null);
    setImagePreview(currentImg);
    setActive(cat.active);
    setError("");
    setIsModalOpen(true);
  };

  const handleNameChange = (val: string) => {
    setName(val);
    if (!editingCategory) {
      setSlug(
        val
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)+/g, "")
      );
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Category name is required.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      let finalImageUrl = image.trim() || "/images/cat_steaks.jpg";

      if (imageFile) {
        const uploadData = new FormData();
        uploadData.append("file", imageFile);
        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          credentials: "include",
          body: uploadData,
        });
        const uploadJson = await uploadRes.json();
        if (!uploadJson.success) throw new Error(uploadJson.error || "Image upload failed");
        finalImageUrl = uploadJson.url;
      }

      const url = editingCategory
        ? `/api/admin/categories/${editingCategory.id}`
        : "/api/admin/categories";
      const method = editingCategory ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: name.trim(),
          slug: slug.trim() || name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
          description: description.trim(),
          image: finalImageUrl,
          active,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to save category.");
      }

      setSuccess(editingCategory ? "Category updated." : "Category created.");
      setTimeout(() => setSuccess(""), 3000);
      setIsModalOpen(false);
      fetchCategories();
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const catId = deleteTarget.id || (deleteTarget as any)._id;
    try {
      const res = await fetch(`/api/admin/categories/${catId}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to delete category.");
      }
      setSuccess("Category deleted.");
      setTimeout(() => setSuccess(""), 3000);
      setDeleteTarget(null);
      fetchCategories();
    } catch (err: any) {
      setError(err.message || "Failed to delete category.");
    } finally {
      setDeleting(false);
    }
  };

  const filteredCategories = categories.filter((cat) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      cat.name?.toLowerCase().includes(q) ||
      cat.slug?.toLowerCase().includes(q) ||
      cat.description?.toLowerCase().includes(q)
    );
  });

  const totalCuts = categories.reduce(
    (sum, cat) => sum + (cat.productCount ?? cat.product_count ?? 0),
    0
  );
  const liveCount = categories.filter(
    (c) => c.active && (c.productCount ?? c.product_count ?? 0) > 0
  ).length;

  return (
    <div className="space-y-3.5 pb-6">
      {/* Top Toolbar: Metrics + Search + New Category CTA */}
      <div className="bg-white rounded-xl border border-stone-200/90 p-3 shadow-[0_1px_2px_rgba(0,0,0,0.03)] space-y-2.5">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2 text-xs">
            <span className="px-2.5 py-1 rounded-md bg-stone-100 text-stone-700 font-semibold tabular-nums">
              {categories.length} Categories
            </span>
            <span className="px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200/80 font-semibold tabular-nums">
              {liveCount} Live on Store
            </span>
            <span className="px-2.5 py-1 rounded-md bg-stone-100 text-stone-700 font-semibold tabular-nums">
              {totalCuts} Assigned Cuts
            </span>
          </div>

          <button
            onClick={openCreateModal}
            className="h-9 px-3.5 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-semibold flex items-center gap-1.5 active:scale-95 transition-all shadow-2xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>New Category</span>
          </button>
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter categories by name or slug..."
            className="w-full h-8.5 pl-8.5 pr-8 bg-stone-50 focus:bg-white rounded-lg border border-stone-200/90 focus:border-stone-400 text-xs text-stone-900 font-medium placeholder:text-stone-400 outline-none transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 p-0.5 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Feedback Banner */}
      {success && (
        <div className="px-3.5 py-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
          <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span>{success}</span>
        </div>
      )}
      {error && (
        <div className="px-3.5 py-2.5 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-3.5 h-3.5 text-primary shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="p-12 text-center text-stone-400 text-xs font-medium bg-white rounded-xl border border-stone-200/90">
          <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-primary" />
          Loading categories...
        </div>
      )}

      {/* Empty */}
      {!loading && filteredCategories.length === 0 && (
        <div className="p-10 text-center text-stone-500 bg-white rounded-xl border border-stone-200/90 space-y-2">
          <Layers className="w-8 h-8 text-stone-300 mx-auto" />
          <p className="text-sm font-bold text-stone-800">No categories found</p>
        </div>
      )}

      {/* ================================================================= */}
      {/* MOBILE NATIVE CATEGORY LIST (< md)                                */}
      {/* ================================================================= */}
      {!loading && filteredCategories.length > 0 && (
        <div className="bg-white rounded-xl border border-stone-200/90 shadow-[0_1px_2px_rgba(0,0,0,0.03)] divide-y divide-stone-100 overflow-hidden md:hidden">
          {filteredCategories.map((cat) => {
            const pCount = cat.productCount ?? cat.product_count ?? 0;
            const isVisibleOnHome = cat.active && pCount > 0;

            return (
              <div key={cat.id} className="p-3.5 flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-bold text-stone-900 truncate">{cat.name}</h3>
                    <span className="font-mono text-[10px] text-stone-400 bg-stone-100 px-1.5 py-0.2 rounded">
                      /{cat.slug}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[11px] font-semibold text-stone-600 tabular-nums">
                      {pCount} {pCount === 1 ? "cut" : "cuts"}
                    </span>
                    <span className="text-stone-300">•</span>
                    {isVisibleOnHome ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        Live
                      </span>
                    ) : !cat.active ? (
                      <span className="text-[10px] font-semibold text-stone-400">Disabled</span>
                    ) : (
                      <span className="text-[10px] font-semibold text-amber-700">
                        Empty (Hidden)
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => openEditModal(cat)}
                    className="w-8 h-8 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 flex items-center justify-center active:scale-95 transition-transform cursor-pointer"
                    title="Edit"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(cat)}
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
      {/* DESKTOP DATA TABLE (>= md)                                        */}
      {/* ================================================================= */}
      {!loading && filteredCategories.length > 0 && (
        <div className="hidden md:block bg-white rounded-xl border border-stone-200/90 shadow-[0_1px_2px_rgba(0,0,0,0.03)] overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead className="bg-stone-50/90 border-b border-stone-200/80 text-stone-500 text-[11px] uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Slug</th>
                <th className="py-3 px-4">Assigned Cuts</th>
                <th className="py-3 px-4">Storefront Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-xs">
              {filteredCategories.map((cat) => {
                const pCount = cat.productCount ?? cat.product_count ?? 0;
                const isVisibleOnHome = cat.active && pCount > 0;

                return (
                  <tr key={cat.id} className="hover:bg-stone-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <p className="font-bold text-stone-900 text-[13px]">{cat.name}</p>
                      {cat.description && (
                        <p className="text-[11px] text-stone-400 mt-0.5 line-clamp-1 max-w-sm">
                          {cat.description}
                        </p>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-stone-500">
                      <span className="bg-stone-100 px-2 py-0.5 rounded">/{cat.slug}</span>
                    </td>
                    <td className="py-3 px-4 tabular-nums font-semibold text-stone-800">
                      {pCount} {pCount === 1 ? "cut" : "cuts"}
                    </td>
                    <td className="py-3 px-4">
                      {isVisibleOnHome ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          Live on Storefront
                        </span>
                      ) : !cat.active ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-stone-100 text-stone-600 border border-stone-200">
                          <EyeOff className="w-3 h-3" />
                          Disabled
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200/80">
                          <Eye className="w-3 h-3" />
                          0 Cuts (Hidden)
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEditModal(cat)}
                          className="h-7 px-2.5 rounded-md bg-stone-100 hover:bg-stone-200 text-stone-700 hover:text-stone-900 font-semibold text-[11px] inline-flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <Edit className="w-3 h-3" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => setDeleteTarget(cat)}
                          className="h-7 w-7 rounded-md bg-stone-100 hover:bg-red-50 text-stone-400 hover:text-red-600 inline-flex items-center justify-center transition-colors cursor-pointer"
                          title="Delete Category"
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

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-stone-200 animate-in zoom-in-95 duration-150">
            <div className="px-5 py-4 border-b border-stone-200/80 flex justify-between items-center">
              <h2 className="text-sm font-bold text-stone-900">
                {editingCategory ? "Edit Category" : "New Meat Category"}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Category Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g. Fresh Chicken, Goat & Mutton"
                  className="w-full h-9 px-3 rounded-lg border border-stone-300 focus:border-stone-500 text-stone-900 font-semibold outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">URL Slug</label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="e.g. chicken, goat-mutton"
                  className="w-full h-9 px-3 rounded-lg border border-stone-300 focus:border-stone-500 text-stone-900 font-mono outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Optional category description..."
                  className="w-full px-3 py-2 rounded-lg border border-stone-300 focus:border-stone-500 text-stone-900 outline-none resize-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Category Image</label>
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-lg border border-stone-200 bg-stone-100 overflow-hidden shrink-0 flex items-center justify-center">
                    {imagePreview ? (
                      <img
                        src={getCategoryImageUrl(imagePreview)}
                        alt="Preview"
                        onError={(e) => {
                          const target = e.currentTarget;
                          target.onerror = null;
                          target.src = "/images/cat_chicken.jpg";
                        }}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Layers className="w-4 h-4 text-stone-400" />
                    )}
                  </div>
                  <label className="flex-1 h-9 flex items-center justify-center px-3 bg-stone-50 hover:bg-stone-100 border border-stone-200 border-dashed rounded-lg cursor-pointer font-semibold text-stone-700 transition-colors">
                    <span>Choose Image</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                  </label>
                </div>
              </div>

              <div className="pt-1">
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={(e) => setActive(e.target.checked)}
                    className="w-4 h-4 text-primary rounded border-stone-300 focus:ring-primary cursor-pointer"
                  />
                  <span className="font-semibold text-stone-800">
                    Active on storefront (when cuts exist)
                  </span>
                </label>
              </div>

              <div className="pt-3 border-t border-stone-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="h-8 px-3.5 rounded-lg border border-stone-200 text-stone-600 font-semibold hover:bg-stone-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="h-8 px-4 rounded-lg bg-stone-900 text-white font-semibold hover:bg-stone-800 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {editingCategory ? "Save Changes" : "Create Category"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-5 space-y-4 border border-stone-200 animate-in zoom-in-95">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-red-50 text-red-600 border border-red-200 flex items-center justify-center shrink-0">
                <Trash2 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-stone-900">Delete Category</h3>
                <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                  Remove <strong className="text-stone-900">"{deleteTarget.name}"</strong>?
                  {Number(deleteTarget.productCount || 0) > 0 && (
                    <span className="block text-red-600 font-semibold mt-1.5">
                      Warning: {deleteTarget.productCount} cuts are assigned to this category.
                    </span>
                  )}
                </p>
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-1">
              <button
                onClick={() => setDeleteTarget(null)}
                className="h-8 px-3.5 rounded-lg border border-stone-200 text-stone-600 font-semibold hover:bg-stone-50 transition-colors text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="h-8 px-3.5 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 text-xs"
              >
                {deleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
