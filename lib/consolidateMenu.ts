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

// Helper to check whole words with accent stripping
function matchesAnyWord(text: string, words: string[]): boolean {
  if (!text) return false;
  const normalized = text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  
  return words.some(w => {
    const normWord = w.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    // Regex whole-word boundary
    const regex = new RegExp(`(^|[^a-z0-9])${normWord}([^a-z0-9]|$)`, 'i');
    return regex.test(normalized);
  });
}

export function consolidateMenuCategories(data: any): MenuData {
  if (!data) return { categories: [] };
  
  const rawCategories: MenuCategory[] = Array.isArray(data) 
    ? data.map(c => ({ name: c.name || c.nombre || 'General', items: c.items || c.productos || [] }))
    : (data.categories || []).map((c: any) => ({ name: c.name || c.nombre || 'General', items: c.items || c.productos || [] }));

  if (rawCategories.length === 0) return { categories: [] };

  // Palabras clave de comida que NUNCA deben clasificarse como bebidas ni guarniciones
  const FOOD_WORDS = [
    'carne', 'carnes', 'lomo', 'lomos', 'vacuno', 'vacunos', 'res', 'bife',
    'churrasco', 'churrascos', 'asado', 'parrilla', 'parrillada', 'pollo', 'pollos',
    'cerdo', 'costilla', 'costillas', 'pescado', 'pescados', 'marisco', 'mariscos',
    'ceviche', 'ceviches', 'camaron', 'camarones', 'encebollado', 'encebollados',
    'sopa', 'sopas', 'caldo', 'caldos', 'locro', 'seco', 'secos',
    'pasta', 'pastas', 'pizza', 'pizzas', 'hamburguesa', 'hamburguesas',
    'sandwich', 'sandwiches', 'taco', 'tacos', 'arroz', 'arroces',
    'almuerzo', 'almuerzos', 'desayuno', 'desayunos', 'merienda', 'meriendas',
    'plato', 'platos', 'fuerte', 'fuertes', 'especialidad', 'especialidades',
    'corte', 'cortes', 'combo', 'combos', 'chuzo', 'chuzos', 'shawarma',
    'tradicional', 'tipico', 'tipicos'
  ];

  // Palabras clave estrictas de bebidas
  const DRINK_WORDS = [
    'bebida', 'bebidas', 'coctel', 'cocteles', 'cocktail', 'cocktails',
    'cerveza', 'cervezas', 'michelada', 'micheladas', 'shot', 'shots',
    'botella', 'botellas', 'trago', 'tragos', 'jugo', 'jugos', 'refresco',
    'refrescos', 'gaseosa', 'gaseosas', 'cafe', 'cafes', 'cafeteria',
    'vino', 'vinos', 'licor', 'licores', 'infusion', 'infusiones', 'te',
    'batido', 'batidos', 'smoothie', 'smoothies', 'milkshake', 'aguas', 'mojito'
  ];

  const STARTER_WORDS = [
    'entrada', 'entradas', 'piqueo', 'piqueos', 'picada', 'picadas',
    'alita', 'alitas', 'snack', 'snacks', 'tapa', 'tapas', 'aperitivo',
    'aperitivos', 'pincho', 'pinchos', 'nachos', 'empanada', 'empanadas'
  ];

  const SIDE_WORDS = [
    'guarnicion', 'guarniciones', 'anexo', 'anexos', 'extra', 'extras',
    'porcion', 'porciones', 'papas fritas', 'patacones', 'yucas'
  ];

  const DESSERT_WORDS = [
    'postre', 'postres', 'dulce', 'dulces', 'helado', 'helados',
    'torta', 'tortas', 'pastel', 'pasteles', 'cheesecake', 'pie', 'waffle', 'crepe'
  ];

  const categoryMap = new Map<string, MenuItem[]>();

  rawCategories.forEach((cat) => {
    const rawName = (cat.name || '').trim();
    if (!rawName) return;
    const items = cat.items || [];
    if (items.length === 0) return;

    const isFood = matchesAnyWord(rawName, FOOD_WORDS);
    let targetCategory = rawName;

    if (!isFood && matchesAnyWord(rawName, DRINK_WORDS)) {
      targetCategory = "Bebidas & Cocteles";
    } else if (!isFood && matchesAnyWord(rawName, STARTER_WORDS)) {
      targetCategory = "Entradas & Piqueos";
    } else if (!isFood && matchesAnyWord(rawName, SIDE_WORDS)) {
      targetCategory = "Guarniciones & Extras";
    } else if (!isFood && matchesAnyWord(rawName, DESSERT_WORDS)) {
      targetCategory = "Postres";
    } else {
      // Conservar el nombre real de la categoría del menú (ej: "Lomos", "Carnes", "Parrillas")
      targetCategory = rawName.charAt(0).toUpperCase() + rawName.slice(1);
    }

    if (!categoryMap.has(targetCategory)) {
      categoryMap.set(targetCategory, []);
    }
    const currentList = categoryMap.get(targetCategory)!;

    items.forEach((item) => {
      const itemName = (item.name || '').trim();
      if (!itemName) return;
      
      const exists = currentList.some(
        (i) => i.name.trim().toLowerCase() === itemName.toLowerCase()
      );
      if (!exists) {
        currentList.push({
          name: itemName,
          price: item.price || (item as any).precio || item.desc || '',
          description: item.description || (item as any).descripcion || item.desc || '',
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
