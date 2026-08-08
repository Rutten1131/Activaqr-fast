import React, { useState } from 'react';
import { Utensils, Upload, Loader2, Sparkles, Plus, Trash2, Edit2, Check, ChevronDown, ChevronUp } from 'lucide-react';

export interface MenuItem {
    name: string;
    price: string;
    description: string;
}

export interface MenuCategory {
    name: string;
    items: MenuItem[];
}

export interface MenuData {
    categories: MenuCategory[];
}

interface MenuScannerSectionProps {
    menuData: MenuData | null;
    onChangeMenuData: (data: MenuData | null) => void;
}

export const MenuScannerSection: React.FC<MenuScannerSectionProps> = ({ menuData, onChangeMenuData }) => {
    const [images, setImages] = useState<string[]>([]);
    const [isScanning, setIsScanning] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<number>(0);
    const [isExpanded, setIsExpanded] = useState<boolean>(true);

    // Convertir archivos seleccionados a Base64
    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        if (images.length + files.length > 10) {
            setErrorMsg("Máximo 10 imágenes permitidas en total.");
            return;
        }

        setErrorMsg(null);
        const filePromises = files.map((file) => {
            return new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result as string);
                reader.onerror = (err) => reject(err);
                reader.readAsDataURL(file);
            });
        });

        Promise.all(filePromises)
            .then((base64List) => {
                setImages((prev) => [...prev, ...base64List]);
            })
            .catch(() => {
                setErrorMsg("Error al leer algunas imágenes.");
            });
    };

    const removeImage = (index: number) => {
        setImages((prev) => prev.filter((_, i) => i !== index));
    };

    // Llamar a la API de Visión con IA
    const processImagesWithAI = async () => {
        if (images.length === 0) {
            setErrorMsg("Por favor, sube al menos una imagen de tu carta o menú.");
            return;
        }

        setIsScanning(true);
        setErrorMsg(null);

        try {
            const res = await fetch("/api/menu/process", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ images }),
            });

            const data = await res.json();

            if (!res.ok || !data.success) {
                throw new Error(data.error || "No se pudo procesar la imagen.");
            }

            onChangeMenuData(data.data);
            setActiveTab(0);
        } catch (err: any) {
            setErrorMsg(err.message || "Ocurrió un error al analizar las imágenes.");
        } finally {
            setIsScanning(false);
        }
    };

    // Funciones de Edición de Menú
    const handleCategoryNameChange = (catIdx: number, newName: string) => {
        if (!menuData) return;
        const updated = { ...menuData };
        updated.categories[catIdx].name = newName;
        onChangeMenuData(updated);
    };

    const handleItemChange = (catIdx: number, itemIdx: number, field: keyof MenuItem, value: string) => {
        if (!menuData) return;
        const updated = { ...menuData };
        updated.categories[catIdx].items[itemIdx][field] = value;
        onChangeMenuData(updated);
    };

    const addItemToCategory = (catIdx: number) => {
        if (!menuData) return;
        const updated = { ...menuData };
        updated.categories[catIdx].items.push({ name: "Nuevo Plato", price: "$0.00", description: "" });
        onChangeMenuData(updated);
    };

    const removeItemFromCategory = (catIdx: number, itemIdx: number) => {
        if (!menuData) return;
        const updated = { ...menuData };
        updated.categories[catIdx].items.splice(itemIdx, 1);
        onChangeMenuData(updated);
    };

    const addCategory = () => {
        const newCategory: MenuCategory = {
            name: "Nueva Categoría",
            items: [{ name: "Plato de muestra", price: "$5.00", description: "Descripción" }],
        };
        const currentCategories = menuData?.categories || [];
        onChangeMenuData({ categories: [...currentCategories, newCategory] });
        setActiveTab(currentCategories.length);
    };

    const removeCategory = (catIdx: number) => {
        if (!menuData) return;
        const updated = { ...menuData };
        updated.categories.splice(catIdx, 1);
        onChangeMenuData(updated.categories.length > 0 ? updated : null);
        setActiveTab(Math.max(0, catIdx - 1));
    };

    return (
        <div className="bg-[#121212] border border-[#2a2a2a] rounded-xl p-5 my-6 shadow-xl text-white">
            <div
                className="flex items-center justify-between cursor-pointer select-none"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-[#f66739]/10 text-[#f66739] rounded-lg">
                        <Utensils className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-lg flex items-center gap-2">
                            Menú Digital Restaurante / Cafetería
                            <span className="text-xs bg-[#f66739] text-white px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                                <Sparkles className="w-3 h-3" /> IA OCR
                            </span>
                        </h3>
                        <p className="text-xs text-gray-400">
                            Sube fotos de tu carta física y la IA armará tu menú automáticamente
                        </p>
                    </div>
                </div>
                <button className="text-gray-400 hover:text-white">
                    {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </button>
            </div>

            {isExpanded && (
                <div className="mt-6 space-y-6">
                    {/* ZONA DE CARGA DE IMÁGENES */}
                    <div className="border-2 border-dashed border-[#333] hover:border-[#f66739]/50 rounded-xl p-4 transition-colors">
                        <div className="flex flex-col items-center justify-center text-center py-2">
                            <Upload className="w-8 h-8 text-gray-400 mb-2" />
                            <p className="text-sm font-medium text-gray-200">
                                Sube las imágenes de tu carta física (máx 10 fotos)
                            </p>
                            <p className="text-xs text-gray-500 mt-1">Formato JPG, PNG, WEBP. Fotos claras y legibles.</p>

                            <label className="mt-4 cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-[#1a1a1a] hover:bg-[#252525] border border-[#333] text-sm font-medium rounded-lg transition-colors">
                                <Plus className="w-4 h-4 text-[#f66739]" /> Seleccionar Fotos
                                <input
                                    type="file"
                                    multiple
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleImageUpload}
                                />
                            </label>
                        </div>

                        {/* PREVIEW DE FOTOS CARGADAS */}
                        {images.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-[#222]">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs text-gray-400 font-medium">
                                        {images.length} foto(s) lista(s) para escanear
                                    </span>
                                    <button
                                        onClick={() => setImages([])}
                                        className="text-xs text-red-400 hover:underline"
                                    >
                                        Vaciar todas
                                    </button>
                                </div>
                                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                                    {images.map((img, idx) => (
                                        <div key={idx} className="relative group aspect-square rounded-lg overflow-hidden border border-[#333]">
                                            <img src={img} alt={`Menú ${idx}`} className="w-full h-full object-cover" />
                                            <button
                                                onClick={() => removeImage(idx)}
                                                className="absolute top-1 right-1 bg-black/80 hover:bg-red-600 text-white rounded-full p-1 opacity-90 group-hover:opacity-100 transition-opacity"
                                            >
                                                <Trash2 className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ))}
                                </div>

                                <button
                                    onClick={processImagesWithAI}
                                    disabled={isScanning}
                                    className="w-full mt-4 py-3 bg-[#f66739] hover:bg-[#e55628] disabled:bg-gray-700 text-white font-medium rounded-lg flex items-center justify-center gap-2 shadow-lg shadow-[#f66739]/20 transition-all"
                                >
                                    {isScanning ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Analizando imágenes y estructurando menú...
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles className="w-5 h-5" />
                                            Generar Menú Digital con IA
                                        </>
                                    )}
                                </button>
                            </div>
                        )}
                    </div>

                    {errorMsg && (
                        <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-lg">
                            {errorMsg}
                        </div>
                    )}

                    {/* VISTA Y EDICIÓN DEL MENÚ DIGITAL ESTRUCTURADO */}
                    {menuData && menuData.categories && menuData.categories.length > 0 && (
                        <div className="border border-[#2a2a2a] bg-[#0d0d0d] rounded-xl p-4">
                            <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#222]">
                                <h4 className="text-sm font-semibold text-[#f66739] flex items-center gap-2">
                                    <Check className="w-4 h-4 text-green-400" />
                                    Menú Generado (Puedes editar todo antes de publicar)
                                </h4>
                                <button
                                    onClick={addCategory}
                                    className="text-xs bg-[#1a1a1a] hover:bg-[#252525] border border-[#333] px-3 py-1.5 rounded-lg flex items-center gap-1 text-gray-200"
                                >
                                    <Plus className="w-3.5 h-3.5 text-[#f66739]" /> + Categoría
                                </button>
                            </div>

                            {/* PESTAÑAS DE CATEGORÍAS */}
                            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-[#222] mb-4">
                                {menuData.categories.map((cat, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setActiveTab(idx)}
                                        className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors flex items-center gap-2 ${
                                            activeTab === idx
                                                ? 'bg-[#f66739] text-white'
                                                : 'bg-[#181818] text-gray-400 hover:text-white'
                                        }`}
                                    >
                                        {cat.name || `Categoría ${idx + 1}`}
                                        <span className="text-[10px] bg-black/30 px-1.5 py-0.5 rounded-full">
                                            {cat.items?.length || 0}
                                        </span>
                                    </button>
                                ))}
                            </div>

                            {/* CONTENIDO DE LA CATEGORÍA SELECCIONADA */}
                            {menuData.categories[activeTab] && (
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 mb-3">
                                        <input
                                            type="text"
                                            value={menuData.categories[activeTab].name}
                                            onChange={(e) => handleCategoryNameChange(activeTab, e.target.value)}
                                            placeholder="Nombre de la categoría"
                                            className="bg-[#141414] border border-[#333] text-sm font-bold text-white px-3 py-1.5 rounded-lg flex-1 focus:outline-none focus:border-[#f66739]"
                                        />
                                        <button
                                            onClick={() => removeCategory(activeTab)}
                                            className="text-xs text-red-400 hover:bg-red-500/10 p-2 rounded-lg border border-red-500/20"
                                            title="Eliminar categoría"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>

                                    <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
                                        {menuData.categories[activeTab].items.map((item, itemIdx) => (
                                            <div
                                                key={itemIdx}
                                                className="bg-[#141414] border border-[#262626] rounded-lg p-3 flex flex-col sm:flex-row gap-2 items-start sm:items-center"
                                            >
                                                <div className="flex-1 w-full space-y-1.5">
                                                    <div className="flex gap-2">
                                                        <input
                                                            type="text"
                                                            value={item.name}
                                                            onChange={(e) =>
                                                                handleItemChange(activeTab, itemIdx, 'name', e.target.value)
                                                            }
                                                            placeholder="Nombre del plato/bebida"
                                                            className="bg-[#1c1c1c] border border-[#333] text-xs text-white px-2.5 py-1 rounded flex-1 focus:outline-none focus:border-[#f66739]"
                                                        />
                                                        <input
                                                            type="text"
                                                            value={item.price}
                                                            onChange={(e) =>
                                                                handleItemChange(activeTab, itemIdx, 'price', e.target.value)
                                                            }
                                                            placeholder="Precio ($)"
                                                            className="bg-[#1c1c1c] border border-[#333] text-xs text-[#f66739] font-bold px-2.5 py-1 rounded w-24 focus:outline-none focus:border-[#f66739]"
                                                        />
                                                    </div>
                                                    <input
                                                        type="text"
                                                        value={item.description || ''}
                                                        onChange={(e) =>
                                                            handleItemChange(activeTab, itemIdx, 'description', e.target.value)
                                                        }
                                                        placeholder="Descripción breve (opcional)"
                                                        className="bg-[#1c1c1c] border border-[#2a2a2a] text-[11px] text-gray-400 px-2.5 py-1 rounded w-full focus:outline-none focus:border-[#f66739]"
                                                    />
                                                </div>
                                                <button
                                                    onClick={() => removeItemFromCategory(activeTab, itemIdx)}
                                                    className="text-gray-500 hover:text-red-400 p-1 self-end sm:self-center"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>

                                    <button
                                        onClick={() => addItemToCategory(activeTab)}
                                        className="w-full py-2 mt-2 bg-[#1a1a1a] hover:bg-[#222] border border-dashed border-[#333] text-xs font-medium text-gray-300 rounded-lg flex items-center justify-center gap-1"
                                    >
                                        <Plus className="w-3.5 h-3.5 text-[#f66739]" /> Agregar producto a esta categoría
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
