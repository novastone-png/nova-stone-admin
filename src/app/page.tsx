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
  Settings,
  LogOut,
  Sparkles
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

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<"products" | "projects">("products");
  const [products, setProducts] = useState<Product[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [cloudinaryCloudName, setCloudinaryCloudName] = useState("");
  const [cloudinaryUploadPreset, setCloudinaryUploadPreset] = useState("");
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

  // Hydration-safe initial loading
  useEffect(() => {
    if (typeof window === "undefined") return;

    const cachedProducts = localStorage.getItem("nova_products");
    const cachedProjects = localStorage.getItem("nova_projects");

    if (cachedProducts) {
      setProducts(JSON.parse(cachedProducts));
    } else {
      const defaults = [
        { id: 1, slug: "beige-taza-boucharde", category: "PIERRE NATURELLE & TAHEJART", name: "Beige Taza Bouchardé", nameAr: "بيج تازة بوشاردة (مبشور)", nameEn: "Bushhammered Beige Taza", img: "https://res.cloudinary.com/dtlec1rtt/image/upload/v1779597566/Beige-taza-bouchard%C3%A9_bstibx.jpg", isBestSeller: true },
        { id: 101, slug: "beige-taza-poli", category: "PIERRE NATURELLE & TAHEJART", name: "Beige Taza Poli", nameAr: "بيج تازة مصقول", nameEn: "Polished Beige Taza", img: "https://res.cloudinary.com/dtlec1rtt/image/upload/v1779597566/Beige-taza-polli_jxmf25.jpg", isBestSeller: true },
        { id: 103, slug: "beige-taza-vieilli", category: "PIERRE NATURELLE & TAHEJART", name: "Beige Taza Vieilli", nameAr: "بيج تازة معتق", nameEn: "Antiqued Beige Taza", img: "https://res.cloudinary.com/dtlec1rtt/image/upload/v1779597566/Beige-taza-vieille_rzmpy8.jpg", isBestSeller: true }
      ];
      setProducts(defaults);
      localStorage.setItem("nova_products", JSON.stringify(defaults));
    }

    if (cachedProjects) {
      setProjects(JSON.parse(cachedProjects));
    } else {
      const defaults = [
        { id: 1, category: "EXTÉRIEUR", title: "Façade Résidentielle Moderne", material: "Basalte Volcanique", desc: "Habillage de façade ultra-moderne combinant le basalte noir.", img: "https://i.ibb.co/Q7JdS4cG/Whats-App-Image-2026-05-18-at-23-27-21.jpg" }
      ];
      setProjects(defaults);
      localStorage.setItem("nova_projects", JSON.stringify(defaults));
    }

    setCloudinaryCloudName(localStorage.getItem("cloudinary_cloud") || "demo");
    setCloudinaryUploadPreset(localStorage.getItem("cloudinary_preset") || "unsigned_preset");
    setLoading(false);
  }, []);

  const updateLocalStorage = (type: "products" | "projects", updatedData: any) => {
    if (typeof window !== "undefined") {
      localStorage.setItem(`nova_${type}`, JSON.stringify(updatedData));
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!cloudinaryCloudName || !cloudinaryUploadPreset) {
      alert("Please configure your Cloudinary credentials in the Settings section below.");
      return;
    }

    setUploadingImage(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", cloudinaryUploadPreset);

    try {
      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudinaryCloudName}/image/upload`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Upload failed. Verify Cloud Name and Upload Preset.");
      
      const data = await res.json();
      setTempImageUrl(data.secure_url);
    } catch (err: any) {
      alert(err.message || "Something went wrong during upload");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempImageUrl) {
      alert("Please upload an image first.");
      return;
    }

    if (activeTab === "products") {
      let updatedProducts = [...products];
      if (editingItem) {
        updatedProducts = products.map(p => p.id === editingItem.id ? {
          ...p,
          ...productForm,
          img: tempImageUrl
        } : p);
      } else {
        const newProduct: Product = {
          id: Date.now(),
          ...productForm,
          img: tempImageUrl
        };
        updatedProducts.push(newProduct);
      }
      setProducts(updatedProducts);
      updateLocalStorage("products", updatedProducts);
    } else {
      let updatedProjects = [...projects];
      if (editingItem) {
        updatedProjects = projects.map(p => p.id === editingItem.id ? {
          ...p,
          ...projectForm,
          img: tempImageUrl
        } : p);
      } else {
        const newProject: Project = {
          id: Date.now(),
          ...projectForm,
          img: tempImageUrl
        };
        updatedProjects.push(newProject);
      }
      setProjects(updatedProjects);
      updateLocalStorage("projects", updatedProjects);
    }

    resetForm();
  };

  const handleDelete = (id: string | number) => {
    if (!confirm("Are you sure you want to delete this item?")) return;
    
    if (activeTab === "products") {
      const filtered = products.filter(p => p.id !== id);
      setProducts(filtered);
      updateLocalStorage("products", filtered);
    } else {
      const filtered = projects.filter(p => p.id !== id);
      setProjects(filtered);
      updateLocalStorage("projects", filtered);
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
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Database Engine</span>
            </div>
            <strong className="text-[#C5A028] font-bold">Firestore</strong>
          </div>
          
          <button className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border border-[#1B1E24] hover:bg-red-950/20 hover:text-red-400 transition duration-300 text-xs text-gray-400 font-medium">
            <LogOut size={13} /> Sign Out
          </button>
        </div>
      </aside>

      <main className="flex-1 p-6 md:p-12">
        
        <header className="flex flex-col sm:flex-row justify-between sm:items-center gap-6 mb-12 pb-6 border-b border-[#1B1E24]/60">
          <div>
            <div className="flex items-center gap-2 text-[#C5A028] mb-1.5">
              <Sparkles size={14} />
              <span className="text-[10px] uppercase tracking-widest font-semibold">Prestige Studio</span>
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight text-white capitalize">{activeTab} Manager</h2>
            <p className="text-xs text-gray-400 mt-1">Easily update, translate, and upload items to your multilingual site.</p>
          </div>
          
          <button 
            onClick={() => { resetForm(); setIsModalOpen(true); }}
            className="flex items-center justify-center gap-2 bg-[#C5A028] hover:bg-[#D4AF37] text-black font-semibold px-6 py-3 rounded-xl transition duration-300 text-xs uppercase tracking-wider shadow-xl shrink-0"
          >
            <Plus size={15} />
            Ajouter {activeTab === "products" ? "Produit" : "Projet"}
          </button>
        </header>

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
                      onClick={() => startEdit(product)}
                      className="flex-1 flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-wider py-2.5 bg-[#1B1E24] hover:bg-[#262B34] text-gray-200 rounded-xl transition duration-300"
                    >
                      <Edit3 size={13} /> Edit
                    </button>
                    <button 
                      onClick={() => handleDelete(product.id)}
                      className="flex-1 flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-wider py-2.5 bg-red-950/20 hover:bg-red-900/30 text-red-400 rounded-xl transition duration-300 border border-red-900/20"
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
                      onClick={() => startEdit(project)}
                      className="flex-1 flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-wider py-2.5 bg-[#1B1E24] hover:bg-[#262B34] text-gray-200 rounded-xl transition duration-300"
                    >
                      <Edit3 size={13} /> Edit
                    </button>
                    <button 
                      onClick={() => handleDelete(project.id)}
                      className="flex-1 flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-wider py-2.5 bg-red-950/20 hover:bg-red-900/30 text-red-400 rounded-xl transition duration-300 border border-red-900/20"
                    >
                      <Trash2 size={13} /> Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}

          </div>
        )}

        <section className="mt-20 bg-[#111317] border border-[#1B1E24] rounded-2xl p-8 relative overflow-hidden">
          <div className="flex items-center gap-3.5 mb-5">
            <Settings className="text-[#C5A028]" size={22} />
            <h3 className="text-xl font-bold text-white tracking-wide">Image Delivery Integration</h3>
          </div>
          <p className="text-xs text-gray-400 max-w-xl mb-8 leading-relaxed">
            All photos are directly processed and optimized via Cloudinary's dynamic global delivery network. Provide your credentials below.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
            <div>
              <label className="block text-[10px] text-gray-400 mb-2 font-bold uppercase tracking-wider">Cloudinary Cloud Name</label>
              <input 
                type="text" 
                value={cloudinaryCloudName} 
                onChange={(e) => { setCloudinaryCloudName(e.target.value); localStorage.setItem("cloudinary_cloud", e.target.value); }}
                className="w-full bg-[#1B1E24] border border-[#21242A] text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#C5A028]/80 transition duration-300"
                placeholder="e.g. dxyz123"
              />
            </div>
            <div>
              <label className="block text-[10px] text-gray-400 mb-2 font-bold uppercase tracking-wider">Upload Preset (Unsigned)</label>
              <input 
                type="text" 
                value={cloudinaryUploadPreset} 
                onChange={(e) => { setCloudinaryUploadPreset(e.target.value); localStorage.setItem("cloudinary_preset", e.target.value); }}
                className="w-full bg-[#1B1E24] border border-[#21242A] text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#C5A028]/80 transition duration-300"
                placeholder="e.g. ml_default"
              />
            </div>
          </div>
        </section>

      </main>

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
