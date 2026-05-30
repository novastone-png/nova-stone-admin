"use client";

import React, { useState, useEffect } from "react";
import { 
  FolderKanban, 
  Layers, 
  Plus, 
  Trash2, 
  Edit3, 
  UploadCloud, 
  Loader2, 
  Sparkles,
  CloudLightning,
  ShieldCheck
} from "lucide-react";

interface Project {
  id: string | number;
  category: string;
  title: string;
  material: string;
  desc: string;
  img: string;
}

interface Product {
  id: string | number;
  slug: string;
  category: string;
  name: string;
  nameAr: string;
  nameEn: string;
  img: string;
  isBestSeller?: boolean;
}

// Pixel-Perfect Inline SVG for GitHub
const GithubIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
  </svg>
);

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<"products" | "projects">("products");
  const [products, setProducts] = useState<Product[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [tempImageUrl, setTempImageUrl] = useState("");

  const [productForm, setProductForm] = useState({
    name: "",
    nameAr: "",
    nameEn: "",
    category: "PIERRE NATURELLE & TAHEJART",
    slug: "",
    isBestSeller: false
  });

  const [projectForm, setProjectForm] = useState({
    title: "",
    material: "",
    category: "EXTÉRIEUR",
    desc: ""
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const prodRes = await fetch("/api/sync?type=products");
      const prodData = await prodRes.json();
      if (!prodData.error) setProducts(prodData);

      const projRes = await fetch("/api/sync?type=projects");
      const projData = await projRes.json();
      if (!projData.error) setProjects(projData);
    } catch (error) {
      console.error("Git load error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Secure Server-Side Upload Caller
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Upload failed. Verify Cloudinary API variables in .env.local");
      
      const data = await res.json();
      setTempImageUrl(data.url);
    } catch (err: any) {
      alert(err.message || "Upload failed. Double check your API Keys.");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempImageUrl) {
      alert("Please upload an image first.");
      return;
    }

    setSaving(true);
    try {
      if (activeTab === "products") {
        let updatedProducts = [...products];
        const payload = {
          ...productForm,
          img: tempImageUrl,
          slug: productForm.name.toLowerCase().replace(/ /g, "-")
        };

        if (editingItem) {
          updatedProducts = products.map(p => p.id === editingItem.id ? { ...p, ...payload } : p);
        } else {
          updatedProducts.push({
            id: Date.now(),
            ...payload
          });
        }

        const res = await fetch("/api/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "products", data: updatedProducts })
        });

        if (!res.ok) throw new Error();
        setProducts(updatedProducts);
      } else {
        let updatedProjects = [...projects];
        const payload = { ...projectForm, img: tempImageUrl };

        if (editingItem) {
          updatedProjects = projects.map(p => p.id === editingItem.id ? { ...p, ...payload } : p);
        } else {
          updatedProjects.push({
            id: Date.now(),
            ...payload
          });
        }

        const res = await fetch("/api/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "projects", data: updatedProjects })
        });

        if (!res.ok) throw new Error();
        setProjects(updatedProjects);
      }
      resetForm();
    } catch (error) {
      alert("GitHub sync failed. Check GITHUB_TOKEN permissions.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string | number) => {
    if (!confirm("Are you sure you want to delete this live resource? This will write a git commit.")) return;
    
    setSaving(true);
    try {
      if (activeTab === "products") {
        const updatedProducts = products.filter(p => p.id !== id);
        const res = await fetch("/api/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "products", data: updatedProducts })
        });
        if (!res.ok) throw new Error();
        setProducts(updatedProducts);
      } else {
        const updatedProjects = projects.filter(p => p.id !== id);
        const res = await fetch("/api/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "projects", data: updatedProjects })
        });
        if (!res.ok) throw new Error();
        setProjects(updatedProjects);
      }
    } catch (error) {
      alert("GitHub Sync deletion failed.");
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (item: any) => {
    setEditingItem(item);
    setTempImageUrl(item.img);
    if (activeTab === "products") {
      setProductForm({
        name: item.name,
        nameAr: item.nameAr || "",
        nameEn: item.nameEn || "",
        category: item.category,
        slug: item.slug,
        isBestSeller: item.isBestSeller || false
      });
    } else {
      setProjectForm({
        title: item.title,
        material: item.material,
        category: item.category,
        desc: item.desc
      });
    }
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setEditingItem(null);
    setTempImageUrl("");
    setProductForm({ name: "", nameAr: "", nameEn: "", category: "PIERRE NATURELLE & TAHEJART", slug: "", isBestSeller: false });
    setProjectForm({ title: "", material: "", category: "EXTÉRIEUR", desc: "" });
    setIsModalOpen(false);
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#0A0B0D]">
      
      {/* SIDEBAR */}
      <aside className="w-full lg:w-72 bg-[#111317] border-b lg:border-b-0 lg:border-r border-[#1B1E24] p-8 flex flex-col justify-between shrink-0">
        <div>
          <div className="relative p-4 rounded-xl border border-[#1B1E24] bg-black/20 mb-8 overflow-hidden">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#E5C158] to-[#C5A028] flex items-center justify-center text-[#0A0B0D] font-bold text-lg shadow-lg">
                NS
              </div>
              <div>
                <h1 className="font-semibold text-sm tracking-widest text-white uppercase">Nova Stone</h1>
                <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider block mt-0.5">Atelier Prestige</span>
              </div>
            </div>
          </div>

          <span className="text-[10px] font-bold tracking-widest text-gray-500 uppercase block mb-3 px-2">Navigation</span>
          
          <nav className="space-y-1.5">
            <button 
              disabled={saving}
              onClick={() => { setActiveTab("products"); resetForm(); }}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-semibold tracking-wider uppercase transition-all duration-300 ${activeTab === "products" ? "bg-[#C5A028] text-[#0A0B0D] shadow-lg" : "text-gray-400 hover:bg-[#1B1E24] hover:text-white"}`}
            >
              <div className="flex items-center gap-3">
                <Layers size={15} />
                <span>Produits</span>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full ${activeTab === "products" ? "bg-black/10 text-black" : "bg-black/40 text-gray-400"}`}>
                {products.length}
              </span>
            </button>
            
            <button 
              disabled={saving}
              onClick={() => { setActiveTab("projects"); resetForm(); }}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-semibold tracking-wider uppercase transition-all duration-300 ${activeTab === "projects" ? "bg-[#C5A028] text-[#0A0B0D] shadow-lg" : "text-gray-400 hover:bg-[#1B1E24] hover:text-white"}`}
            >
              <div className="flex items-center gap-3">
                <FolderKanban size={15} />
                <span>Projets</span>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full ${activeTab === "projects" ? "bg-black/10 text-black" : "bg-black/40 text-gray-400"}`}>
                {projects.length}
              </span>
            </button>
          </nav>
        </div>

        <div className="mt-8 pt-6 border-t border-[#1B1E24] space-y-4">
          <div className="flex items-center justify-between text-[11px] text-gray-400 bg-black/25 p-3 rounded-lg border border-[#1B1E24]">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              <span>Git Engine</span>
            </div>
            <strong className="text-[#C5A028] font-bold">GitHub REST</strong>
          </div>
          
          <button className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border border-[#1B1E24] hover:bg-red-950/20 hover:text-red-400 transition duration-300 text-xs text-gray-400 font-medium">
            Log Out
          </button>
        </div>
      </aside>

      {/* DASHBOARD */}
      <main className="flex-1 p-6 md:p-12">
        
        <header className="flex flex-col sm:flex-row justify-between sm:items-center gap-6 mb-12 pb-6 border-b border-[#1B1E24]/60">
          <div>
            <div className="flex items-center gap-2 text-[#C5A028] mb-1.5">
              <Sparkles size={14} />
              <span className="text-[10px] uppercase tracking-widest font-semibold">Prestige Studio</span>
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight text-white capitalize">{activeTab} Manager</h2>
            <p className="text-xs text-gray-400 mt-1">Secure server-side Cloudinary and GitHub sync integration.</p>
          </div>
          
          <button 
            disabled={saving}
            onClick={() => { resetForm(); setIsModalOpen(true); }}
            className="flex items-center justify-center gap-2 bg-[#C5A028] hover:bg-[#D4AF37] text-black font-semibold px-6 py-3 rounded-xl transition duration-300 text-xs uppercase tracking-wider shadow-xl shrink-0"
          >
            <Plus size={15} />
            Ajouter {activeTab === "products" ? "Produit" : "Projet"}
          </button>
        </header>

        {saving && (
          <div className="mb-6 p-4 rounded-xl bg-blue-950/10 border border-blue-900/30 text-blue-400 text-xs flex items-center gap-2.5">
            <Loader2 className="animate-spin" size={14} />
            Commiting modifications directly to GitHub and initiating automated deploy pipelines...
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="animate-spin text-[#C5A028]" size={36} />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            
            {activeTab === "products" && products.map((product) => (
              <div key={product.id} className="group bg-[#111317] border border-[#1B1E24] rounded-2xl overflow-hidden hover:border-[#C5A028]/40 transition-all duration-300 flex flex-col justify-between shadow-lg">
                <div className="relative aspect-[16/10] bg-black/40 overflow-hidden">
                  <img src={product.img} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  {product.isBestSeller && (
                    <span className="absolute top-3 right-3 text-[9px] uppercase tracking-widest font-bold bg-[#C5A028] text-[#0A0B0D] px-2.5 py-1 rounded-full shadow">
                      Best Seller
                    </span>
                  )}
                  <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md border border-white/10 text-[9px] uppercase tracking-widest font-bold px-2.5 py-1 rounded">
                    {product.category}
                  </div>
                </div>
                
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-lg text-white group-hover:text-[#E5C158] transition duration-300">{product.name}</h3>
                    
                    <div className="space-y-2 mt-4 pt-4 border-t border-[#1B1E24] text-xs">
                      <div className="flex items-center justify-between py-1 bg-black/20 px-3 rounded-lg border border-[#1B1E24]/50">
                        <span className="text-[10px] text-gray-500 font-bold tracking-wider">AR</span>
                        <span className="font-semibold text-[#C5A028]" dir="rtl">{product.nameAr}</span>
                      </div>
                      <div className="flex items-center justify-between py-1 bg-black/20 px-3 rounded-lg border border-[#1B1E24]/50">
                        <span className="text-[10px] text-gray-500 font-bold tracking-wider">EN</span>
                        <span className="font-semibold text-gray-300">{product.nameEn}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2.5 mt-6 pt-4 border-t border-[#1B1E24]">
                    <button 
                      disabled={saving}
                      onClick={() => startEdit(product)}
                      className="flex-1 flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-wider py-2.5 bg-[#1B1E24] hover:bg-[#262B34] text-gray-200 rounded-xl transition duration-300 disabled:opacity-50"
                    >
                      <Edit3 size={13} /> Edit
                    </button>
                    <button 
                      disabled={saving}
                      onClick={() => handleDelete(product.id)}
                      className="flex-1 flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-wider py-2.5 bg-red-950/20 hover:bg-red-900/30 text-red-400 rounded-xl transition duration-300 border border-red-900/20 disabled:opacity-50"
                    >
                      <Trash2 size={13} /> Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {activeTab === "projects" && projects.map((project) => (
              <div key={project.id} className="group bg-[#111317] border border-[#1B1E24] rounded-2xl overflow-hidden hover:border-[#C5A028]/40 transition-all duration-300 flex flex-col justify-between shadow-lg">
                <div className="relative aspect-[16/10] bg-black/40 overflow-hidden">
                  <img src={project.img} alt={project.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md border border-white/10 text-[9px] uppercase tracking-widest font-bold px-2.5 py-1 rounded">
                    {project.category}
                  </div>
                </div>
                
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-lg text-white group-hover:text-[#E5C158] transition duration-300">{project.title}</h3>
                    <p className="text-xs text-[#C5A028] font-semibold tracking-wider mt-1.5">Material: {project.material}</p>
                    <p className="text-xs text-gray-400 line-clamp-3 mt-3 leading-relaxed">{project.desc}</p>
                  </div>
                  
                  <div className="flex gap-2.5 mt-6 pt-4 border-t border-[#1B1E24]">
                    <button 
                      disabled={saving}
                      onClick={() => startEdit(project)}
                      className="flex-1 flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-wider py-2.5 bg-[#1B1E24] hover:bg-[#262B34] text-gray-200 rounded-xl transition duration-300 disabled:opacity-50"
                    >
                      <Edit3 size={13} /> Edit
                    </button>
                    <button 
                      disabled={saving}
                      onClick={() => handleDelete(project.id)}
                      className="flex-1 flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-wider py-2.5 bg-red-950/20 hover:bg-red-900/30 text-red-400 rounded-xl transition duration-300 border border-red-900/20 disabled:opacity-50"
                    >
                      <Trash2 size={13} /> Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}

          </div>
        )}

        {/* SECURITY & DEPLOYMENT SPECS */}
        <section className="mt-20 bg-[#111317] border border-[#1B1E24] rounded-2xl p-8 relative overflow-hidden">
          <div className="flex items-center gap-3.5 mb-4">
            <GithubIcon className="text-[#C5A028] w-5 h-5" />
            <h3 className="text-xl font-bold text-white tracking-wide">GitOps Sync Engine Status</h3>
          </div>
          <p className="text-xs text-gray-400 max-w-xl mb-6 leading-relaxed">
            Your credentials are secure. Committing updates triggers automated pipelines.
          </p>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2 px-4 py-2 bg-[#1B1E24] border border-[#262B34] rounded-xl text-xs">
              <CloudLightning className="text-[#C5A028]" size={14} />
              <span className="text-gray-300">Cloudinary API:</span>
              <strong className="text-emerald-500">Active (Secure Server-Signed)</strong>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-[#1B1E24] border border-[#262B34] rounded-xl text-xs">
              <ShieldCheck className="text-[#C5A028]" size={14} />
              <span className="text-gray-300">Repository Sync:</span>
              <strong className="text-emerald-500">Active (GitHub REST)</strong>
            </div>
          </div>
        </section>

      </main>

      {/* FORM MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-[#111317] border border-[#1B1E24] w-full max-w-xl rounded-2xl overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-[#1B1E24] flex justify-between items-center">
              <h3 className="font-bold text-lg text-white uppercase tracking-wider">
                {editingItem ? "Modifier" : "Ajouter"} {activeTab === "products" ? "un Produit" : "un Projet"}
              </h3>
              <button onClick={resetForm} className="text-xs font-semibold tracking-wider text-gray-400 hover:text-white transition uppercase">Close</button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-5">
              
              <div>
                <label className="block text-[10px] text-gray-400 mb-2.5 font-bold uppercase tracking-wider">Image / Rendu (Cloudinary)</label>
                {tempImageUrl ? (
                  <div className="relative aspect-video rounded-xl overflow-hidden border border-[#1B1E24] bg-black/40">
                    <img src={tempImageUrl} className="w-full h-full object-cover" alt="preview" />
                    <button 
                      type="button" 
                      onClick={() => setTempImageUrl("")}
                      className="absolute top-3 right-3 bg-red-600 hover:bg-red-700 text-white rounded-full p-2 shadow-lg transition"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ) : (
                  <div className="border border-dashed border-[#21242A] rounded-xl p-8 flex flex-col items-center justify-center bg-black/20 hover:bg-black/40 transition duration-300 relative group">
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleImageUpload} 
                      className="absolute inset-0 opacity-0 cursor-pointer" 
                    />
                    {uploadingImage ? (
                      <Loader2 className="animate-spin text-[#C5A028] mb-3" size={28} />
                    ) : (
                      <UploadCloud className="text-gray-500 group-hover:text-[#C5A028] transition duration-300 mb-3" size={28} />
                    )}
                    <p className="text-xs font-semibold text-gray-200">
                      {uploadingImage ? "Téléchargement en cours..." : "Cliquez pour uploader la photo"}
                    </p>
                    <p className="text-[10px] text-gray-500 mt-1">PNG, JPG or WEBP max 5MB</p>
                  </div>
                )}
              </div>

              {activeTab === "products" ? (
                <>
                  <div>
                    <label className="block text-[10px] text-gray-400 mb-1.5 font-bold uppercase tracking-wider">Category</label>
                    <select 
                      value={productForm.category}
                      onChange={(e) => setProductForm({...productForm, category: e.target.value})}
                      className="w-full bg-[#1B1E24] border border-[#21242A] text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#C5A028] transition duration-300"
                    >
                      <option value="PIERRE NATURELLE & TAHEJART">PIERRE NATURELLE & TAHEJART</option>
                      <option value="MARBRE LOCAL">MARBRE LOCAL</option>
                      <option value="GRANIT">GRANIT</option>
                      <option value="ARDOISE">ARDOISE</option>
                    </select>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] text-gray-400 mb-1.5 font-bold uppercase tracking-wider">Product Name (Français)</label>
                      <input 
                        type="text" 
                        required
                        value={productForm.name} 
                        onChange={(e) => setProductForm({...productForm, name: e.target.value, slug: e.target.value.toLowerCase().replace(/ /g, "-")})}
                        className="w-full bg-[#1B1E24] border border-[#21242A] text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#C5A028] transition duration-300"
                        placeholder="e.g. Beige Taza Bouchardé"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-gray-400 mb-1.5 font-bold uppercase tracking-wider">Product Name (العربية)</label>
                      <input 
                        type="text" 
                        required
                        dir="rtl"
                        value={productForm.nameAr} 
                        onChange={(e) => setProductForm({...productForm, nameAr: e.target.value})}
                        className="w-full bg-[#1B1E24] border border-[#21242A] text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#C5A028] transition duration-300 text-right font-medium"
                        placeholder="بيج تازة مبشور"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-gray-400 mb-1.5 font-bold uppercase tracking-wider">Product Name (English)</label>
                      <input 
                        type="text" 
                        required
                        value={productForm.nameEn} 
                        onChange={(e) => setProductForm({...productForm, nameEn: e.target.value})}
                        className="w-full bg-[#1B1E24] border border-[#21242A] text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#C5A028] transition duration-300"
                        placeholder="e.g. Bushhammered Beige Taza"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <input 
                      type="checkbox" 
                      id="isBestSeller"
                      checked={productForm.isBestSeller}
                      onChange={(e) => setProductForm({...productForm, isBestSeller: e.target.checked})}
                      className="w-4 h-4 rounded bg-[#1B1E24] border-[#21242A] text-[#C5A028] focus:ring-0 cursor-pointer"
                    />
                    <label htmlFor="isBestSeller" className="text-xs text-gray-300 font-semibold uppercase tracking-wider cursor-pointer">Best Seller Highlight</label>
                  </div>
                </>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] text-gray-400 mb-1.5 font-bold uppercase tracking-wider">Titre du Projet</label>
                      <input 
                        type="text" 
                        required
                        value={projectForm.title} 
                        onChange={(e) => setProjectForm({...projectForm, title: e.target.value})}
                        className="w-full bg-[#1B1E24] border border-[#21242A] text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#C5A028] transition duration-300"
                        placeholder="e.g. Villa Royale"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-gray-400 mb-1.5 font-bold uppercase tracking-wider">Matériaux Utilisés</label>
                      <input 
                        type="text" 
                        required
                        value={projectForm.material} 
                        onChange={(e) => setProjectForm({...projectForm, material: e.target.value})}
                        className="w-full bg-[#1B1E24] border border-[#21242A] text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#C5A028] transition duration-300"
                        placeholder="e.g. Travertin Classique"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] text-gray-400 mb-1.5 font-bold uppercase tracking-wider">Catégorie</label>
                    <select 
                      value={projectForm.category}
                      onChange={(e) => setProjectForm({...projectForm, category: e.target.value})}
                      className="w-full bg-[#1B1E24] border border-[#21242A] text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#C5A028] transition duration-300"
                    >
                      <option value="EXTÉRIEUR">EXTÉRIEUR</option>
                      <option value="INTÉRIEURS">INTÉRIEURS</option>
                      <option value="SALLES DE BAIN">SALLES DE BAIN</option>
                      <option value="PISCINES">PISCINES</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] text-gray-400 mb-1.5 font-bold uppercase tracking-wider">Description (Détails)</label>
                    <textarea 
                      required
                      value={projectForm.desc} 
                      onChange={(e) => setProjectForm({...projectForm, desc: e.target.value})}
                      rows={3}
                      className="w-full bg-[#1B1E24] border border-[#21242A] text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#C5A028] transition duration-300 resize-none leading-relaxed"
                      placeholder="Context details of marble craft, installation style..."
                    />
                  </div>
                </>
              )}

              <div className="flex gap-3 pt-6 border-t border-[#1B1E24]">
                <button 
                  type="button" 
                  onClick={resetForm}
                  className="flex-1 py-3 rounded-xl bg-[#1B1E24] hover:bg-[#262B34] text-xs font-bold uppercase tracking-wider text-gray-300 transition duration-300"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-1 py-3 rounded-xl bg-[#C5A028] hover:bg-[#D4AF37] text-black font-bold text-xs uppercase tracking-wider transition duration-300 shadow-lg"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
