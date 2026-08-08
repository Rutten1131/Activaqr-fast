import React, { useState } from 'react';
import { Utensils, Search, Sparkles } from 'lucide-react';
import { MenuData } from './MenuScannerSection';

interface MenuDisplayProps {
    menuData: MenuData;
    restaurantName?: string;
}

export const MenuDisplay: React.FC<MenuDisplayProps> = ({ menuData, restaurantName }) => {
    const [activeCategory, setActiveCategory] = useState<number>(0);
    const [searchQuery, setSearchQuery] = useState<string>('');

    if (!menuData || !menuData.categories || menuData.categories.length === 0) {
        return null;
    }

    // Filtrar por búsqueda si el usuario escribe
    const categoriesToDisplay = menuData.categories.map((cat) => {
        if (!searchQuery.trim()) return cat;

        const filteredItems = cat.items.filter(
            (item) =>
                item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()))
        );

        return { ...cat, items: filteredItems };
    }).filter((cat) => cat.items.length > 0);

    const currentCat = searchQuery.trim()
        ? null
        : menuData.categories[activeCategory];

    return (
        <div className="w-full max-w-md mx-auto bg-[#0a0a0a] text-white rounded-2xl border border-[#222] overflow-hidden shadow-2xl my-6">
            {/* CABECERA DEL MENÚ */}
            <div className="bg-gradient-to-r from-[#180d09] to-[#0a0a0a] p-5 border-b border-[#222]">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-[#f66739]/20 text-[#f66739] rounded-xl border border-[#f66739]/30">
                        <Utensils className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="font-bold text-lg text-white flex items-center gap-2">
                            {restaurantName || 'Menú Digital'}
                        </h3>
                        <p className="text-xs text-gray-400">Nuestros platillos y precios actualizados</p>
                    </div>
                </div>

                {/* BUSCADOR DE PLATOS */}
                <div className="relative mt-4">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Buscar plato, bebida..."
                        className="w-full bg-[#141414] border border-[#2a2a2a] text-xs text-white pl-9 pr-3 py-2 rounded-xl focus:outline-none focus:border-[#f66739] placeholder-gray-500"
                    />
                </div>
            </div>

            {/* BARRA NAVEGACIÓN CATEGORÍAS (Si no hay búsqueda activa) */}
            {!searchQuery.trim() && (
                <div className="flex gap-2 overflow-x-auto px-4 py-3 bg-[#111] border-b border-[#222] scrollbar-none">
                    {menuData.categories.map((cat, idx) => (
                        <button
                            key={idx}
                            onClick={() => setActiveCategory(idx)}
                            className={`px-3.5 py-1.5 text-xs font-semibold rounded-full whitespace-nowrap transition-all ${
                                activeCategory === idx
                                    ? 'bg-[#f66739] text-white shadow-md shadow-[#f66739]/20'
                                    : 'bg-[#1e1e1e] text-gray-400 hover:text-white'
                            }`}
                        >
                            {cat.name}
                        </button>
                    ))}
                </div>
            )}

            {/* VISTA CON BÚSQUEDA */}
            {searchQuery.trim() ? (
                <div className="p-4 space-y-6 max-h-[450px] overflow-y-auto">
                    {categoriesToDisplay.length === 0 ? (
                        <p className="text-center text-xs text-gray-500 py-6">
                            No se encontraron platos con "{searchQuery}"
                        </p>
                    ) : (
                        categoriesToDisplay.map((cat, idx) => (
                            <div key={idx}>
                                <h4 className="text-xs font-bold text-[#f66739] uppercase tracking-wider mb-2">
                                    {cat.name}
                                </h4>
                                <div className="space-y-2">
                                    {cat.items.map((item, itemIdx) => (
                                        <ItemCard key={itemIdx} item={item} />
                                    ))}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            ) : (
                /* VISTA NORMÁL CATEGORÍA SELECCIONADA */
                <div className="p-4 space-y-3 max-h-[450px] overflow-y-auto">
                    {currentCat && currentCat.items.length > 0 ? (
                        currentCat.items.map((item, itemIdx) => (
                            <ItemCard key={itemIdx} item={item} />
                        ))
                    ) : (
                        <p className="text-center text-xs text-gray-500 py-6">
                            No hay ítems registrados en esta categoría
                        </p>
                    )}
                </div>
            )}

            {/* PIE DE PÁGINA */}
            <div className="bg-[#0d0d0d] px-4 py-2.5 border-t border-[#1a1a1a] flex items-center justify-between text-[10px] text-gray-500">
                <span>Menú provisto por ActivaQR</span>
                <span className="flex items-center gap-1 text-[#f66739]">
                    <Sparkles className="w-3 h-3" /> IA Verified
                </span>
            </div>
        </div>
    );
};

const ItemCard = ({ item }: { item: { name: string; price: string; description: string } }) => (
    <div className="bg-[#141414] hover:bg-[#1a1a1a] border border-[#222] p-3 rounded-xl transition-colors flex items-start justify-between gap-3">
        <div className="space-y-1 flex-1">
            <h5 className="text-sm font-semibold text-gray-100">{item.name}</h5>
            {item.description && (
                <p className="text-xs text-gray-400 leading-snug">{item.description}</p>
            )}
        </div>
        {item.price && (
            <span className="text-xs font-bold text-[#f66739] bg-[#f66739]/10 border border-[#f66739]/20 px-2.5 py-1 rounded-lg shrink-0">
                {item.price}
            </span>
        )}
    </div>
);
