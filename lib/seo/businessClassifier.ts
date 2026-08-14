import { BusinessSchemaCategory, ClientProfileData } from './types';

interface ClassificationResult {
    category: BusinessSchemaCategory;
    confidence: number;
    detectedKeywords: string[];
    cuisineType?: string;
    nichedTitleSuffix: string;
}

const CATEGORY_RULES: {
    category: BusinessSchemaCategory;
    keywords: string[];
    titleSuffix: string;
    weight: number;
}[] = [
    // Restaurantes y Gastronomía
    {
        category: 'Restaurant',
        keywords: [
            'restaurante', 'grill', 'parrilla', 'parrillada', 'asados', 'comida', 'gastronomia',
            'carnes', 'mariscos', 'picanteria', 'ceviche', 'alitas', 'hamburguesas', 'burger',
            'pizza', 'pizzeria', 'sushi', 'tacos', 'taqueria', 'asador', 'almuerzos', 'cenas',
            'restobar', 'chifa', 'gourmet', 'cocina', 'platos'
        ],
        titleSuffix: 'Restaurante y Gastronomía',
        weight: 1.5
    },
    {
        category: 'CafeOrCoffeeShop',
        keywords: ['cafeteria', 'cafe', 'coffee', 'panaderia', 'pasteleria', 'bakery', 'dulces', 'postres', 'reposteria'],
        titleSuffix: 'Cafetería y Pastelería',
        weight: 1.4
    },
    {
        category: 'BarOrPub',
        keywords: ['bar', 'pub', 'cocteleria', 'licorera', 'discoteca', 'cerveceria', 'beer', 'karaoke'],
        titleSuffix: 'Bar y Coctelería',
        weight: 1.3
    },

    // Belleza y Cuidado Personal
    {
        category: 'BeautySalon',
        keywords: [
            'peluqueria', 'barberia', 'barber', 'salon de belleza', 'estetica', 'spa', 'unas',
            'nails', 'cejas', 'pestanas', 'microblading', 'maquillaje', 'makeup', 'cosmetologia',
            'alisados', 'tintes', 'balayage', 'skincare', 'depilacion'
        ],
        titleSuffix: 'Salón de Belleza y Estética',
        weight: 1.4
    },

    // Comercio / Tiendas / Retail
    {
        category: 'StationeryStore',
        keywords: [
            'papeleria', 'libreria', 'copias', 'impresiones', 'marcos', 'enmarcaciones',
            'cuadros', 'utiles escolares', 'bazar', 'articulos de oficina'
        ],
        titleSuffix: 'Papelería, Marcos y Librería',
        weight: 1.5
    },
    {
        category: 'ClothingStore',
        keywords: ['ropa', 'boutique', 'moda', 'calzado', 'zapatos', 'vestidos', 'tienda de ropa', 'confecciones', 'accesorios'],
        titleSuffix: 'Moda y Confecciones',
        weight: 1.3
    },
    {
        category: 'HardwareStore',
        keywords: ['ferreteria', 'herramientas', 'construccion', 'materiales', 'plomeria', 'electricidad', 'pinturas', 'tornillos'],
        titleSuffix: 'Ferretería y Materiales',
        weight: 1.3
    },
    {
        category: 'Store',
        keywords: ['tienda', 'bazar', 'minimarket', 'market', 'comercial', 'distribuidora', 'ventas', 'productos', 'joyeria', 'relojería'],
        titleSuffix: 'Tienda y Comercio',
        weight: 1.0
    },

    // Automotriz
    {
        category: 'AutoRepair',
        keywords: [
            'mecanica', 'taller mecanico', 'lubricadora', 'llantas', 'vulcanizadora', 'frenos',
            'alineacion', 'balanceo', 'repuestos', 'electrico automotriz', 'enderezada', 'pintura automotriz'
        ],
        titleSuffix: 'Taller Mecánico y Repuestos',
        weight: 1.4
    },
    {
        category: 'AutomotiveBusiness',
        keywords: ['taxis', 'transporte', 'camionetas', 'fletes', 'rent a car', 'lavadora de autos', 'car wash', 'concesionario'],
        titleSuffix: 'Servicio Automotriz y Transporte',
        weight: 1.2
    },

    // Salud y Bienestar
    {
        category: 'Dentist',
        keywords: ['odontologia', 'dentista', 'odontologo', 'clinica dental', 'ortodoncia', 'implantes dentales', 'diseno de sonrisa'],
        titleSuffix: 'Clínica Odontológica',
        weight: 1.5
    },
    {
        category: 'MedicalBusiness',
        keywords: [
            'clinica', 'medico', 'consultorio medico', 'doctor', 'doctora', 'pediatra',
            'ginecologo', 'laboratorio clinico', 'farmacia', 'optica', 'psicologia', 'terapia'
        ],
        titleSuffix: 'Centro Médico y Salud',
        weight: 1.3
    },

    // Servicios Profesionales
    {
        category: 'LegalService',
        keywords: ['abogado', 'abogada', 'asesoria legal', 'estudio juridico', 'notaria', 'consultorio juridico', 'leyes'],
        titleSuffix: 'Servicios Jurídicos y Legales',
        weight: 1.4
    },
    {
        category: 'AccountingService',
        keywords: ['contador', 'contadora', 'auditoria', 'contabilidad', 'tributaria', 'asesoria contable', 'sri'],
        titleSuffix: 'Asesoría Contable y Tributaria',
        weight: 1.4
    },
    {
        category: 'RealEstateAgent',
        keywords: ['bienes raices', 'inmobiliaria', 'propiedades', 'casas', 'terrenos', 'departamentos', 'alquiler', 'arriendos'],
        titleSuffix: 'Bienes Raíces e Inmobiliaria',
        weight: 1.4
    },
    {
        category: 'ProfessionalService',
        keywords: [
            'arquitectura', 'arquitecto', 'diseno grafico', 'agencia', 'marketing', 'fotografia',
            'videografia', 'consultoria', 'asesor', 'servicios profesionales', 'tecnico'
        ],
        titleSuffix: 'Servicios Profesionales',
        weight: 1.1
    }
];

function normalizeText(text: string | null | undefined): string {
    if (!text) return '';
    return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // remove accents
        .replace(/[^a-z0-9\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

/**
 * Clasifica un perfil de negocio en base a su información textual.
 */
export function classifyBusinessProfile(profile: ClientProfileData): ClassificationResult {
    // Si el usuario especificó un override manual de categoría en json_override
    let manualCategory: BusinessSchemaCategory | undefined;
    if (profile.json_override) {
        try {
            const parsed = typeof profile.json_override === 'string'
                ? JSON.parse(profile.json_override)
                : profile.json_override;
            if (parsed?.seo?.schemaCategory) {
                manualCategory = parsed.seo.schemaCategory;
            }
        } catch {
            // ignore
        }
    }

    if (manualCategory) {
        const matchingRule = CATEGORY_RULES.find(r => r.category === manualCategory);
        return {
            category: manualCategory,
            confidence: 1.0,
            detectedKeywords: [],
            nichedTitleSuffix: matchingRule ? matchingRule.titleSuffix : 'Negocio & Servicios'
        };
    }

    // Si es explícitamente un perfil personal
    if (profile.tipo_perfil === 'personal' && !profile.nombre_negocio) {
        return {
            category: 'Person',
            confidence: 0.9,
            detectedKeywords: [],
            nichedTitleSuffix: profile.profesion || 'Perfil Profesional'
        };
    }

    // Concatenar todos los campos relevantes para el análisis
    const corpus = [
        profile.nombre_negocio,
        profile.nombre,
        profile.profesion,
        profile.empresa,
        profile.bio,
        profile.productos_servicios,
        profile.etiquetas
    ].filter(Boolean).join(' ');

    const normalizedCorpus = normalizeText(corpus);

    let bestCategory: BusinessSchemaCategory = 'LocalBusiness';
    let maxScore = 0;
    let detectedKeywords: string[] = [];
    let bestRule = null;

    for (const rule of CATEGORY_RULES) {
        let matchCount = 0;
        const matched: string[] = [];

        for (const kw of rule.keywords) {
            const normKw = normalizeText(kw);
            if (normalizedCorpus.includes(normKw)) {
                matchCount++;
                matched.push(kw);
            }
        }

        const score = matchCount * rule.weight;
        if (score > maxScore) {
            maxScore = score;
            bestCategory = rule.category;
            detectedKeywords = matched;
            bestRule = rule;
        }
    }

    // Detectar tipo de cocina si es restaurante
    let detectedCuisine: string | undefined;
    if (bestCategory === 'Restaurant') {
        if (normalizedCorpus.includes('parrill') || normalizedCorpus.includes('grill') || normalizedCorpus.includes('carne')) {
            detectedCuisine = 'Parrilladas y Carnes';
        } else if (normalizedCorpus.includes('marisco') || normalizedCorpus.includes('ceviche')) {
            detectedCuisine = 'Mariscos y Cevichería';
        } else if (normalizedCorpus.includes('pizza') || normalizedCorpus.includes('pasta')) {
            detectedCuisine = 'Comida Italiana y Pizzería';
        } else if (normalizedCorpus.includes('burger') || normalizedCorpus.includes('alita')) {
            detectedCuisine = 'Comida Rápida y Hamburguesas';
        } else if (normalizedCorpus.includes('sushi') || normalizedCorpus.includes('chifa')) {
            detectedCuisine = 'Cocina Asiática y Fusión';
        } else {
            detectedCuisine = 'Gastronomía y Platos a la Carta';
        }
    }

    return {
        category: maxScore > 0 ? bestCategory : (profile.tipo_perfil === 'negocio' ? 'LocalBusiness' : 'Person'),
        confidence: maxScore > 0 ? Math.min(1.0, maxScore / 3) : 0.4,
        detectedKeywords,
        cuisineType: detectedCuisine,
        nichedTitleSuffix: bestRule ? bestRule.titleSuffix : (profile.profesion || 'Contacto & Servicios')
    };
}
