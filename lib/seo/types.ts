export type BusinessSchemaCategory =
    | 'Restaurant'
    | 'FoodEstablishment'
    | 'CafeOrCoffeeShop'
    | 'BarOrPub'
    | 'FastFoodRestaurant'
    | 'BeautySalon'
    | 'HairSalon'
    | 'DaySpa'
    | 'Store'
    | 'ClothingStore'
    | 'HardwareStore'
    | 'StationeryStore'
    | 'AutoRepair'
    | 'AutomotiveBusiness'
    | 'MedicalBusiness'
    | 'Dentist'
    | 'Physiotherapy'
    | 'ProfessionalService'
    | 'LegalService'
    | 'AccountingService'
    | 'RealEstateAgent'
    | 'LocalBusiness'
    | 'Person'
    | 'Organization';

export interface SeoConfig {
    customTitle?: string;
    customDescription?: string;
    customKeywords?: string[];
    schemaCategory?: BusinessSchemaCategory;
    priceRange?: string;
    cuisineType?: string;
    businessHours?: string;
    enableIndexed?: boolean; // default true
}

export interface ClientProfileData {
    id?: number | string;
    slug: string;
    nombre: string;
    nombre_negocio?: string | null;
    tipo_perfil?: string | null; // 'negocio' | 'personal' | etc.
    profesion?: string | null;
    empresa?: string | null;
    bio?: string | null;
    direccion?: string | null;
    web?: string | null;
    whatsapp?: string | null;
    email?: string | null;
    google_business?: string | null;
    google_rating?: number | string | null;
    google_reviews_count?: number | string | null;
    instagram?: string | null;
    facebook?: string | null;
    tiktok?: string | null;
    youtube?: string | null;
    linkedin?: string | null;
    x?: string | null;
    productos_servicios?: string | null;
    etiquetas?: string | null;
    plan?: string | null;
    foto_url?: string | null;
    galeria_urls?: string | string[] | null;
    portada_desktop?: string | null;
    portada_movil?: string | null;
    catalogo_json?: any;
    menu_digital?: any;
    json_override?: any;
    custom_domain?: string | null;
    last_edited_at?: string | Date | null;
    created_at?: string | Date | null;
}

