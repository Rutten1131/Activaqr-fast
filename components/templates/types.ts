/**
 * components/templates/types.ts
 * Tipos compartidos para el sistema de plantillas de VCard.
 * Todas las plantillas DEBEN implementar BaseTemplateProps.
 * Los props opcionales son funcionalidades que no todos los templates necesitan.
 */

// Tipo del ítem de slide del hero carousel
export interface HeroSlide {
    id: string;
    active: boolean;
    title?: string;
    description?: string;
    portada_movil?: string;
    portada_desktop?: string;
    // Offer fields per slide
    offerEnabled?: boolean;
    offerBadge?: string;
    offerTitle?: string;
    offerDescription?: string;
    offerOriginalPrice?: string;
    offerPrice?: string;
    offerExpiresAt?: string;
    offerCtaText?: string;
}

// Props base que TODOS los templates comparten
export interface BaseTemplateProps {
    data: any;
    slug: string;
    extractedBg: string;
    themePrimary: string;
    themeTextOnPrimary: string;
    // Handlers de UI (siempre requeridos)
    setIsEditModalOpen: (open: boolean) => void;
    setIsLightboxOpen: (open: boolean) => void;
    handleHeroClick: () => void;
    downloadVCF: () => void;
    // Utilidades (siempre requeridas)
    isPlaceholderUrl: (url: string | null | undefined) => boolean;
    getVideoEmbedUrl: (url: string | null | undefined) => string | null;
    // Slots opcionales (para inyección de contenido)
    afterExperienceSlot?: React.ReactNode;
    beforeMarqueeSlot?: React.ReactNode;
    afterMarqueeSlot?: React.ReactNode;
}

// Props adicionales para templates que soportan hero carousel
export interface HeroCarouselTemplateProps extends BaseTemplateProps {
    activeSlides: HeroSlide[];
    currentSlideIndex: number;
    setCurrentSlideIndex: (index: number) => void;
}

// Props adicionales para templates que soportan WiFi/oferta accordion
export interface WifiAccordionTemplateProps extends BaseTemplateProps {
    isAccordionOpen: boolean;
    setIsAccordionOpen: (open: boolean) => void;
    wifiStep: number;
    setWifiStep: (step: number) => void;
}

// Props adicionales para templates con expansión de productos
export interface ProductsTemplateProps extends BaseTemplateProps {
    isProductsExpanded: boolean;
    setIsProductsExpanded: (expanded: boolean) => void;
}

// Interfaz completa para la plantilla Classic (soporta todas las features)
export interface ClassicTemplateProps extends BaseTemplateProps {
    activeSlides: HeroSlide[];
    currentSlideIndex: number;
    setCurrentSlideIndex: (index: number) => void;
    isAccordionOpen: boolean;
    setIsAccordionOpen: (open: boolean) => void;
    wifiStep: number;
    setWifiStep: (step: number) => void;
    isProductsExpanded: boolean;
    setIsProductsExpanded: (expanded: boolean) => void;
    setIsFooterVisible: (visible: boolean) => void;
    showCatalog?: boolean;
}

// Interfaz mínima para la plantilla Minimal/Luxury (solo lo que realmente usa)
export interface MinimalTemplateProps extends BaseTemplateProps {
    // Soporte para Hero dinámico (slides)
    activeSlides?: HeroSlide[];
    currentSlideIndex?: number;
    setCurrentSlideIndex?: (index: number) => void;
}

// ─── Hedkandi Template Props (con sistema de slots para inyección de kits) ───

/** Imagen personalizada por índice para la grilla de experiencia */
export interface ExperienceImage {
    index: number;      // 0-based index en productos_servicios
    url: string;
}

/** Props extendidas para HedkandiTemplate con slots de inyección */
export interface HedkandiTemplateProps extends MinimalTemplateProps {
    // ── Slots de contenido (ReactNodes inyectables) ──
    /** Se inyecta DESPUÉS de la grilla "EXPERIENCE" (3 columnas). Ideal para menús, servicios, galerías. */
    afterExperienceSlot?: React.ReactNode;
    /** Se inyecta ENTRE la sección de Trust/Social y la Marquee CTA. Para contenido secundario. */
    beforeMarqueeSlot?: React.ReactNode;
    /** Se inyecta DESPUÉS de todo (al final de la página). Para footer, ubicación, horarios. */
    afterMarqueeSlot?: React.ReactNode;

    // ── Personalización de grilla de experiencia ──
    /** Imágenes personalizadas para la grilla de 3 columnas (mapea índices de productos_servicios) */
    experienceImages?: ExperienceImage[];
    /** Títulos personalizados para la grilla de 3 columnas (mapea índices de productos_servicios) */
    experienceTitles?: Array<{index: number, title: string}>;
    /** Título de la sección de experiencia (default: "THE {nombre_negocio} EXPERIENCE") */
    experienceTitle?: string;
    /** Subtítulo de los items de la grilla de experiencia (default: "Especialidad") */
    experienceSubtitle?: string;
    /** Si es true, oculta completamente la grilla de experiencia */
    hideExperience?: boolean;
}
