export interface FeriaEvento {
    id: string;
    titulo: string;
    fecha: string; // Formato YYYY-MM-DD
    hora: string;
    lugar: string;
    categoria: 'concierto' | 'cultural' | 'gastronomia' | 'emprendimiento' | 'infantil';
    artistas?: string[];
    descripcion: string;
    destacado?: boolean;
}

export const FERIA_AGENDA_DATA: FeriaEvento[] = [
    {
        id: 'inauguracion-197',
        titulo: 'Inauguración Oficial de la 197ª Feria de Loja',
        fecha: '2025-08-28',
        hora: '19:00',
        lugar: 'Teatro Nacional Benjamín Carrión / Recinto Ferial',
        categoria: 'cultural',
        artistas: ['Orquesta Sinfónica de Loja', 'Ballet Folclórico Qhapac Ñan'],
        descripcion: 'Apertura de la edición 197 con autoridades, recorrido por los pabellones artesanales y show sinfónico.',
        destacado: true
    },
    {
        id: 'noche-rock-pop',
        titulo: 'Noche de Rock Latino & Pop',
        fecha: '2025-08-29',
        hora: '20:00',
        lugar: 'Escenario Principal Recinto Ferial',
        categoria: 'concierto',
        artistas: ['Bandas Nacionales Invitadas', 'Grupos Locales de Loja'],
        descripcion: 'Gran noche de música en vivo con bandas estelares en el escenario central.',
        destacado: true
    },
    {
        id: 'festival-cafe-lojano',
        titulo: 'Campeonato & Degustación de Café de Especialidad Lojano',
        fecha: '2025-08-30',
        hora: '10:00 - 18:00',
        lugar: 'Pabellón Gastronómico y de Cafés',
        categoria: 'gastronomia',
        descripcion: 'Cata abierta, métodos de extracción y exhibición de los mejores productores de café de altura de la provincia de Loja.',
        destacado: true
    },
    {
        id: 'noche-tropical-cumbia',
        titulo: 'Noche Tropical Internacional: Baile de la Feria',
        fecha: '2025-08-30',
        hora: '21:00',
        lugar: 'Explanada de Eventos del Recinto Ferial',
        categoria: 'concierto',
        artistas: ['Artistas Internacionales', 'Orquesta Don Medardo y sus Players'],
        descripcion: 'El concierto más esperado del fin de semana con miles de asistentes y música tropical bailable.',
        destacado: true
    },
    {
        id: 'feria-artesanal-andina',
        titulo: 'Encuentro Binacional de Artesanos Ecuador - Perú',
        fecha: '2025-08-31',
        hora: '09:00 - 20:00',
        lugar: 'Pabellón de Artesanías y Textiles',
        categoria: 'cultural',
        descripcion: 'Demostración de telares en vivo, cerámica tradicional, orfebrería y tallado en madera.',
        destacado: false
    },
    {
        id: 'noche-romantica-pasillo',
        titulo: 'Noche del Pasillo y la Canción Lojana',
        fecha: '2025-09-05',
        hora: '20:00',
        lugar: 'Teatro del Recinto Ferial',
        categoria: 'concierto',
        artistas: ['Trío Los Reales', 'Artistas de la Casa de la Cultura'],
        descripcion: 'Gala musical en homenaje a la capital musical del Ecuador y sus compositores inmortales.',
        destacado: true
    },
    {
        id: 'festival-emprendimiento-joven',
        titulo: 'Feria de Innovación y Marcas Emergentes',
        fecha: '2025-09-06',
        hora: '10:00 - 19:00',
        lugar: 'Pabellón de Emprendimiento',
        categoria: 'emprendimiento',
        descripcion: 'Exposición de cosmética natural, alimentos procesados, moda sostenible y productos tecnológicos locales.',
        destacado: false
    },
    {
        id: 'concierto-estelar-cierre',
        titulo: 'Gran Concierto de Cierre de la 197ª Feria de Loja',
        fecha: '2025-09-20',
        hora: '20:30',
        lugar: 'Explanada Principal del Recinto Ferial',
        categoria: 'concierto',
        artistas: ['Artista Internacional Invitado', 'Artistas Nacionales'],
        descripcion: 'Clausura de la feria con show de luces, premiación a los expositores ganadores de la votación digital y concierto estelar.',
        destacado: true
    }
];

export const CATEGORIAS_FERIA = [
    { 
        id: 'artesanias', 
        nombre: 'Artesanías & Textiles', 
        icono: 'Palette', 
        desc: 'Tejidos, cerámica, madera y creaciones hechas a mano.',
        imagen_url: 'https://images.unsplash.com/photo-1606744824163-985d376605aa?auto=format&fit=crop&w=800&q=80'
    },
    { 
        id: 'gastronomia', 
        nombre: 'Gastronomía & Cafés', 
        icono: 'Utensils', 
        desc: 'Comida típica lojana, café de especialidad y dulces tradicionales.',
        imagen_url: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=800&q=80'
    },
    { 
        id: 'productores', 
        nombre: 'Productores & Agro', 
        icono: 'Sprout', 
        desc: 'Miel, derivados agrícolas y productos orgánicos de la región.',
        imagen_url: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&w=800&q=80'
    },
    { 
        id: 'emprendimientos', 
        nombre: 'Emprendimientos & Moda', 
        icono: 'Sparkles', 
        desc: 'Marcas emergentes, cosmética natural y diseño local.',
        imagen_url: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=800&q=80'
    },
    { 
        id: 'comercio', 
        nombre: 'Comercio & Servicios', 
        icono: 'Store', 
        desc: 'Tecnología, equipamiento y servicios para el hogar y negocio.',
        imagen_url: 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?auto=format&fit=crop&w=800&q=80'
    },
    { 
        id: 'otros', 
        nombre: 'Otros Negocios', 
        icono: 'Sparkles', 
        desc: 'Otros negocios y participantes de la feria.',
        imagen_url: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=800&q=80'
    },
];


