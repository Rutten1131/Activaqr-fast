export interface MenuItem {
  name: string;
  price: string;
  description?: string;
  desc?: string;
}

export interface MenuCategory {
  name: string;
  items: MenuItem[];
}

export interface MenuData {
  categories: MenuCategory[];
}

export function consolidateMenuCategories(data: any): MenuData {
  if (!data) return { categories: [] };
  
  const rawCategories: MenuCategory[] = Array.isArray(data) 
    ? data.map(c => ({ name: c.name || c.nombre || 'General', items: c.items || c.productos || [] }))
    : (data.categories || []).map((c: any) => ({ name: c.name || c.nombre || 'General', items: c.items || c.productos || [] }));

  if (rawCategories.length === 0) return { categories: [] };

  // Standard Macro Categories Bucket Map
  const DRINKS_NAME = "Bebidas & Cocteles";
  const STARTERS_NAME = "Entradas & Piqueos";
  const MAINS_NAME = "Platos Fuertes & Especialidades";
  const SIDES_NAME = "Guarniciones & Extras";
  const DESSERTS_NAME = "Postres";

  const drinkKeywords = ['bebida', 'cerveza', 'michelada', 'coctel', 'cocktail', 'shot', 'botella', 'trago', 'jugo', 'refresco', 'café', 'cafe', 'vino', 'licor', 'infusion', 'té', 'te', 'uno', 'unos'];
  const starterKeywords = ['entrada', 'picada', 'piqueo', 'alita', 'snack', 'tapa', 'aperitivo', 'pincho'];
  const sideKeywords = ['guarnicion', 'guarnición', 'anexo', 'extra', 'salsa', 'porcion', 'porción', 'papas', 'acompañamiento'];
  const dessertKeywords = ['postre', 'dulce', 'helado', 'torta', 'pastel', 'pie'];

  const categoryMap = new Map<string, MenuItem[]>();

  rawCategories.forEach((cat) => {
    const rawName = (cat.name || '').trim();
    const lowerName = rawName.toLowerCase();
    const items = cat.items || [];
    if (items.length === 0) return;

    let targetCategory = rawName;

    // Detect Macro-Category via Keywords
    if (drinkKeywords.some(kw => lowerName.includes(kw))) {
      targetCategory = DRINKS_NAME;
    } else if (starterKeywords.some(kw => lowerName.includes(kw))) {
      targetCategory = STARTERS_NAME;
    } else if (sideKeywords.some(kw => lowerName.includes(kw))) {
      targetCategory = SIDES_NAME;
    } else if (dessertKeywords.some(kw => lowerName.includes(kw))) {
      targetCategory = DESSERTS_NAME;
    } else if (items.length <= 2 && rawCategories.length > 5) {
      // Micro-category with 1 or 2 items -> merge into Mains/Especialidades if no other match
      targetCategory = MAINS_NAME;
    }

    if (!categoryMap.has(targetCategory)) {
      categoryMap.set(targetCategory, []);
    }
    const currentList = categoryMap.get(targetCategory)!;

    items.forEach((item) => {
      // Prevent duplicates by item name
      const exists = currentList.some(
        (i) => i.name.trim().toLowerCase() === (item.name || '').trim().toLowerCase()
      );
      if (!exists && item.name) {
        currentList.push({
          name: item.name.trim(),
          price: item.price || item.desc || '',
          description: item.description || item.desc || '',
        });
      }
    });
  });

  const consolidatedCategories: MenuCategory[] = [];
  categoryMap.forEach((items, name) => {
    if (items.length > 0) {
      consolidatedCategories.push({ name, items });
    }
  });

  return { categories: consolidatedCategories };
}
