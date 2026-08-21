export type MenuLanguage = 'es' | 'en' | 'fr' | 'it' | 'pt' | 'de';

export interface MenuTranslations {
    sectionTitle: string;
    exploreTitle: string;
    exploreSubtitle: string;
    searchPlaceholder: string;
    viewDishes: string;
    viewProducts: string;
    dishesCount: (count: number) => string;
    allDishes: string;
    addToCart: string;
    orderViaWhatsApp: string;
    inquirePrice: string;
    orderModalTitle: string;
    sendOrder: string;
    emptyMenuTitle: string;
    emptyMenuSubtitle: string;
    backToCategories: string;
    // Cart & Order
    cartSummary: string;
    cartItemsCount: (count: number) => string;
    cartTotal: string;
    viewOrder: string;
    clearCart: string;
    orderNotes: string;
    orderNotesPlaceholder: string;
    tableOrAddress: string;
    tableOrAddressPlaceholder: string;
    emptyCartMessage: string;
    dishDetails: string;
    priceLabel: string;
    // Review Section
    reviewMotorBadge: string;
    reviewTitle: string;
    reviewSubtitle: string;
    starThanksTitle: string;
    starThanksDesc: string;
    shareOnGoogleMaps: string;
    improveTitle: string;
    improveSubtitle: string;
    feedbackLabel: string;
    feedbackPlaceholder: string;
    nameLabel: string;
    namePlaceholder: string;
    contactLabel: string;
    contactPlaceholder: string;
    sendFeedback: string;
    sendingFeedback: string;
    feedbackSuccessTitle: string;
    feedbackSuccessDesc: string;
}

export const MENU_TRANSLATIONS: Record<MenuLanguage, MenuTranslations> = {
    es: {
        sectionTitle: 'MENÚ',
        exploreTitle: 'Explora Nuestro Menú',
        exploreSubtitle: 'Elige una categoría para descubrir nuestras especialidades',
        searchPlaceholder: 'Busca cualquier plato en todo el menú (ej. Pollo, Asado, Ceviche...)',
        viewDishes: 'Ver platos',
        viewProducts: 'Ver productos',
        dishesCount: (count) => `${count} ${count === 1 ? 'plato' : 'platos'}`,
        allDishes: 'Todos los platos',
        addToCart: 'Añadir al Carrito',
        orderViaWhatsApp: 'Pedir por WhatsApp',
        inquirePrice: 'Consultar',
        orderModalTitle: 'Tu Pedido',
        sendOrder: 'Enviar Pedido por WhatsApp',
        emptyMenuTitle: 'Menú en construcción',
        emptyMenuSubtitle: 'Pronto encontrarás aquí los platillos y bebidas con precios actualizados.',
        backToCategories: 'Todas las categorías',
        cartSummary: 'Resumen de tu Pedido',
        cartItemsCount: (count) => `${count} ${count === 1 ? 'ítem' : 'ítems'}`,
        cartTotal: 'Total a Pagar',
        viewOrder: 'Ver Pedido',
        clearCart: 'Vaciar Carrito',
        orderNotes: 'Indicaciones especiales (opcional)',
        orderNotesPlaceholder: 'Ej: Sin cebolla, término medio, cubiertos extra...',
        tableOrAddress: 'Número de Mesa o Dirección de Entrega',
        tableOrAddressPlaceholder: 'Ej: Mesa 4 / Av. Principal 123',
        emptyCartMessage: 'Tu carrito de compras está vacío.',
        dishDetails: 'Detalle del Plato',
        priceLabel: 'Precio',
        reviewMotorBadge: 'TU OPINIÓN ES NUESTRO MOTOR',
        reviewTitle: '¿CÓMO FUE TU EXPERIENCIA?',
        reviewSubtitle: 'Toca las estrellas para darnos tu calificación',
        starThanksTitle: '¡GRACIAS POR TU VALORACIÓN!',
        starThanksDesc: 'Nos alegra haber superado tus expectativas. Déjanos tu reseña en Google Business para ayudar a más personas a conocernos.',
        shareOnGoogleMaps: 'COMPARTIR EN GOOGLE MAPS 🚀',
        improveTitle: '¿CÓMO PODEMOS MEJORAR?',
        improveSubtitle: 'Tus comentarios llegarán directo a la gerencia para brindarte un servicio de 5 estrellas.',
        feedbackLabel: 'Tu Observación o Sugerencia',
        feedbackPlaceholder: 'Escribe aquí tu comentario para ayudarnos a mejorar...',
        nameLabel: 'Tu Nombre (Opcional)',
        namePlaceholder: 'Nombre completo',
        contactLabel: 'Teléfono o Email (Opcional)',
        contactPlaceholder: 'Contacto para darte seguimiento',
        sendFeedback: 'ENVIAR MENSAJE',
        sendingFeedback: 'ENVIANDO...',
        feedbackSuccessTitle: '¡MENSAJE RECIBIDO CON ÉXITO!',
        feedbackSuccessDesc: 'Agradecemos enormemente tu tiempo. Tomaremos en cuenta tus observaciones de inmediato.',
    },
    en: {
        sectionTitle: 'MENU',
        exploreTitle: 'Explore Our Menu',
        exploreSubtitle: 'Choose a category to discover our specialties',
        searchPlaceholder: 'Search any dish in the entire menu (e.g. Steak, Burger, Drinks...)',
        viewDishes: 'View dishes',
        viewProducts: 'View products',
        dishesCount: (count) => `${count} ${count === 1 ? 'dish' : 'dishes'}`,
        allDishes: 'All dishes',
        addToCart: 'Add to Cart',
        orderViaWhatsApp: 'Order via WhatsApp',
        inquirePrice: 'Inquire',
        orderModalTitle: 'Your Order',
        sendOrder: 'Send Order via WhatsApp',
        emptyMenuTitle: 'Menu under construction',
        emptyMenuSubtitle: 'Dishes and prices will be available here soon.',
        backToCategories: 'All categories',
        cartSummary: 'Order Summary',
        cartItemsCount: (count) => `${count} ${count === 1 ? 'item' : 'items'}`,
        cartTotal: 'Total',
        viewOrder: 'View Order',
        clearCart: 'Clear Cart',
        orderNotes: 'Special instructions (optional)',
        orderNotesPlaceholder: 'e.g. No onions, medium rare, extra cutlery...',
        tableOrAddress: 'Table Number or Delivery Address',
        tableOrAddressPlaceholder: 'e.g. Table 4 / 123 Main Street',
        emptyCartMessage: 'Your cart is empty.',
        dishDetails: 'Dish Details',
        priceLabel: 'Price',
        reviewMotorBadge: 'YOUR OPINION IS OUR MOTIVATION',
        reviewTitle: 'HOW WAS YOUR EXPERIENCE?',
        reviewSubtitle: 'Tap the stars to give us your rating',
        starThanksTitle: 'THANK YOU FOR YOUR RATING!',
        starThanksDesc: 'We are thrilled to have exceeded your expectations. Please leave us a review on Google to help others find us.',
        shareOnGoogleMaps: 'SHARE ON GOOGLE MAPS 🚀',
        improveTitle: 'HOW CAN WE IMPROVE?',
        improveSubtitle: 'Your feedback will go straight to management to help us deliver a 5-star experience.',
        feedbackLabel: 'Your Feedback or Suggestion',
        feedbackPlaceholder: 'Write your comments here to help us improve...',
        nameLabel: 'Your Name (Optional)',
        namePlaceholder: 'Full name',
        contactLabel: 'Phone or Email (Optional)',
        contactPlaceholder: 'Contact info for follow up',
        sendFeedback: 'SEND FEEDBACK',
        sendingFeedback: 'SENDING...',
        feedbackSuccessTitle: 'FEEDBACK RECEIVED SUCCESSFULLY!',
        feedbackSuccessDesc: 'Thank you very much for your time. We will review your suggestions immediately.',
    },
    fr: {
        sectionTitle: 'MENU',
        exploreTitle: 'Découvrez Notre Menu',
        exploreSubtitle: 'Choisissez une catégorie pour découvrir nos spécialités',
        searchPlaceholder: 'Recherchez un plat dans le menu...',
        viewDishes: 'Voir les plats',
        viewProducts: 'Voir les produits',
        dishesCount: (count) => `${count} ${count === 1 ? 'plat' : 'plats'}`,
        allDishes: 'Tous les plats',
        addToCart: 'Ajouter au Panier',
        orderViaWhatsApp: 'Commander sur WhatsApp',
        inquirePrice: 'Consulter',
        orderModalTitle: 'Votre Commande',
        sendOrder: 'Envoyer la Commande sur WhatsApp',
        emptyMenuTitle: 'Menu en cours de préparation',
        emptyMenuSubtitle: 'Nos plats et tarifs seront bientôt disponibles.',
        backToCategories: 'Toutes les catégories',
        cartSummary: 'Récapitulatif de Commande',
        cartItemsCount: (count) => `${count} ${count === 1 ? 'article' : 'articles'}`,
        cartTotal: 'Total',
        viewOrder: 'Voir la Commande',
        clearCart: 'Vider le Panier',
        orderNotes: 'Instructions particulières (facultatif)',
        orderNotesPlaceholder: 'Ex: Sans oignons, bien cuit...',
        tableOrAddress: 'Numéro de Table ou Adresse de Livraison',
        tableOrAddressPlaceholder: 'Ex: Table 4 / 12 Rue Principale',
        emptyCartMessage: 'Votre panier est vide.',
        dishDetails: 'Détails du Plat',
        priceLabel: 'Prix',
        reviewMotorBadge: 'VOTRE AVIS EST NOTRE MOTEUR',
        reviewTitle: 'COMMENT S’EST PASSÉE VOTRE EXPÉRIENCE ?',
        reviewSubtitle: 'Touchez les étoiles pour donner votre note',
        starThanksTitle: 'MERCI POUR VOTRE ÉVALUATION !',
        starThanksDesc: 'Nous sommes ravis d’avoir répondu à vos attentes. Partagez votre avis sur Google pour nous soutenir.',
        shareOnGoogleMaps: 'PARTAGER SUR GOOGLE MAPS 🚀',
        improveTitle: 'COMMENT POUVONS-NOUS NOUS AMÉLIORER ?',
        improveSubtitle: 'Vos remarques parviennent directement à la direction pour vous offrir un service 5 étoiles.',
        feedbackLabel: 'Votre Observation ou Suggestion',
        feedbackPlaceholder: 'Écrivez votre commentaire ici...',
        nameLabel: 'Votre Nom (Facultatif)',
        namePlaceholder: 'Nom complet',
        contactLabel: 'Téléphone ou Email (Facultatif)',
        contactPlaceholder: 'Coordonnées de suivi',
        sendFeedback: 'ENVOYER LE MESSAGE',
        sendingFeedback: 'ENVOI EN COURS...',
        feedbackSuccessTitle: 'MESSAGE REÇU AVEC SUCCÈS !',
        feedbackSuccessDesc: 'Nous vous remercions chaleureusement pour votre retour précieux.',
    },
    it: {
        sectionTitle: 'MENU',
        exploreTitle: 'Esplora il Nostro Menu',
        exploreSubtitle: 'Scegli una categoria per scoprire le nostre specialità',
        searchPlaceholder: 'Cerca un piatto nel menu...',
        viewDishes: 'Vedi piatti',
        viewProducts: 'Vedi prodotti',
        dishesCount: (count) => `${count} ${count === 1 ? 'piatto' : 'piatti'}`,
        allDishes: 'Tutti i piatti',
        addToCart: 'Aggiungi al Carrello',
        orderViaWhatsApp: 'Ordina su WhatsApp',
        inquirePrice: 'Richiedi',
        orderModalTitle: 'Il Tuo Ordine',
        sendOrder: 'Invia Ordine su WhatsApp',
        emptyMenuTitle: 'Menu in costruzione',
        emptyMenuSubtitle: 'I piatti e i prezzi saranno disponibili a breve.',
        backToCategories: 'Tutte le categorie',
        cartSummary: 'Riepilogo Ordine',
        cartItemsCount: (count) => `${count} ${count === 1 ? 'articolo' : 'articoli'}`,
        cartTotal: 'Totale',
        viewOrder: 'Visualizza Ordine',
        clearCart: 'Svuota Carrello',
        orderNotes: 'Indicazioni speciali (opzionale)',
        orderNotesPlaceholder: 'Es: Senza cipolla, ben cotto...',
        tableOrAddress: 'Numero Tavolo o Indirizzo di Consegna',
        tableOrAddressPlaceholder: 'Es: Tavolo 4 / Via Roma 10',
        emptyCartMessage: 'Il tuo carrello è vuoto.',
        dishDetails: 'Dettaglio Piatto',
        priceLabel: 'Prezzo',
        reviewMotorBadge: 'LA TUA OPINIONE È IL NOSTRO MOTORE',
        reviewTitle: 'COM’È STATA LA TUA ESPERIENZA?',
        reviewSubtitle: 'Tocca le stelle per lasciare la tua valutazione',
        starThanksTitle: 'GRAZIE PER LA TUA RECENSIONE!',
        starThanksDesc: 'Siamo felici di aver soddisfatto le tue aspettative. Lascia una recensione su Google per aiutarci.',
        shareOnGoogleMaps: 'CONDIVIDI SU GOOGLE MAPS 🚀',
        improveTitle: 'COME POSSIAMO MIGLIORARE?',
        improveSubtitle: 'I tuoi commenti arriveranno direttamente alla direzione per offrirti un servizio a 5 stelle.',
        feedbackLabel: 'La Tua Osservazione o Suggerimento',
        feedbackPlaceholder: 'Scrivi qui il tuo commento per aiutarci a migliorare...',
        nameLabel: 'Il Tuo Nome (Opzionale)',
        namePlaceholder: 'Nome completo',
        contactLabel: 'Telefono o Email (Opzionale)',
        contactPlaceholder: 'Contatto per ricontattarti',
        sendFeedback: 'INVIA MESSAGGIO',
        sendingFeedback: 'INVIO IN CORSO...',
        feedbackSuccessTitle: 'MESSAGGIO RICEVUTO CON SUCCESSO!',
        feedbackSuccessDesc: 'Ti ringraziamo per il tuo prezioso tempo. Esamineremo subito le tue osservazioni.',
    },
    pt: {
        sectionTitle: 'CARDÁPIO',
        exploreTitle: 'Explore Nosso Cardápio',
        exploreSubtitle: 'Escolha uma categoria para descobrir nossas especialidades',
        searchPlaceholder: 'Busque qualquer prato no cardápio...',
        viewDishes: 'Ver pratos',
        viewProducts: 'Ver produtos',
        dishesCount: (count) => `${count} ${count === 1 ? 'prato' : 'pratos'}`,
        allDishes: 'Todos os pratos',
        addToCart: 'Adicionar ao Carrinho',
        orderViaWhatsApp: 'Pedir pelo WhatsApp',
        inquirePrice: 'Consultar',
        orderModalTitle: 'Seu Pedido',
        sendOrder: 'Enviar Pedido pelo WhatsApp',
        emptyMenuTitle: 'Cardápio em construção',
        emptyMenuSubtitle: 'Em breve nossos pratos e preços estarão disponíveis aqui.',
        backToCategories: 'Todas as categorias',
        cartSummary: 'Resumo do Pedido',
        cartItemsCount: (count) => `${count} ${count === 1 ? 'item' : 'itens'}`,
        cartTotal: 'Total',
        viewOrder: 'Ver Pedido',
        clearCart: 'Limpar Carrinho',
        orderNotes: 'Observações especiais (opcional)',
        orderNotesPlaceholder: 'Ex: Sem cebola, bem passado...',
        tableOrAddress: 'Número da Mesa ou Endereço de Entrega',
        tableOrAddressPlaceholder: 'Ex: Mesa 4 / Rua Principal 123',
        emptyCartMessage: 'Seu carrinho está vazio.',
        dishDetails: 'Detalhes do Prato',
        priceLabel: 'Preço',
        reviewMotorBadge: 'SUA OPINIÃO É O NOSSO MOTOR',
        reviewTitle: 'COMO FOI SUA EXPERIÊNCIA?',
        reviewSubtitle: 'Toque nas estrelas para avaliar',
        starThanksTitle: 'OBRIGADO PELA SUA AVALIAÇÃO!',
        starThanksDesc: 'Ficamos muito felizes em superar suas expectativas. Deixe sua avaliação no Google para nos ajudar.',
        shareOnGoogleMaps: 'COMPARTILHAR NO GOOGLE MAPS 🚀',
        improveTitle: 'COMO PODEMOS MELHORAR?',
        improveSubtitle: 'Seus comentários irão direto para a gerência para oferecer um serviço 5 estrelas.',
        feedbackLabel: 'Sua Observação ou Sugestão',
        feedbackPlaceholder: 'Escreva seu comentário aqui para nos ajudar...',
        nameLabel: 'Seu Nome (Opcional)',
        namePlaceholder: 'Nome completo',
        contactLabel: 'Telefone ou Email (Opcional)',
        contactPlaceholder: 'Contato para retorno',
        sendFeedback: 'ENVIAR MENSAGEM',
        sendingFeedback: 'ENVIANDO...',
        feedbackSuccessTitle: 'MENSAGEM RECEBIDA COM SUCESSO!',
        feedbackSuccessDesc: 'Agradecemos muito pelo seu tempo. Vamos considerar suas observações imediatamente.',
    },
    de: {
        sectionTitle: 'SPEISEKARTE',
        exploreTitle: 'Entdecken Sie Unsere Speisekarte',
        exploreSubtitle: 'Wählen Sie eine Kategorie, um unsere Spezialitäten zu entdecken',
        searchPlaceholder: 'Gericht suchen...',
        viewDishes: 'Gerichte anzeigen',
        viewProducts: 'Produkte anzeigen',
        dishesCount: (count) => `${count} ${count === 1 ? 'Gericht' : 'Gerichte'}`,
        allDishes: 'Alle Gerichte',
        addToCart: 'In den Warenkorb',
        orderViaWhatsApp: 'Per WhatsApp bestellen',
        inquirePrice: 'Anfragen',
        orderModalTitle: 'Ihre Bestellung',
        sendOrder: 'Bestellung per WhatsApp senden',
        emptyMenuTitle: 'Speisekarte im Aufbau',
        emptyMenuSubtitle: 'Unsere Gerichte und Preise sind in Kürze verfügbar.',
        backToCategories: 'Alle Kategorien',
        cartSummary: 'Bestellübersicht',
        cartItemsCount: (count) => `${count} ${count === 1 ? 'Artikel' : 'Artikel'}`,
        cartTotal: 'Gesamtbetrag',
        viewOrder: 'Bestellung ansehen',
        clearCart: 'Warenkorb leeren',
        orderNotes: 'Besondere Wünsche (optional)',
        orderNotesPlaceholder: 'z.B. Ohne Zwiebeln, medium...',
        tableOrAddress: 'Tischnummer oder Lieferadresse',
        tableOrAddressPlaceholder: 'z.B. Tisch 4 / Hauptstraße 12',
        emptyCartMessage: 'Ihr Warenkorb ist leer.',
        dishDetails: 'Gerichtdetails',
        priceLabel: 'Preis',
        reviewMotorBadge: 'IHRE MEINUNG IST UNSER ANTRIEB',
        reviewTitle: 'WIE WAR IHRE ERFAHRUNG?',
        reviewSubtitle: 'Tippen Sie auf die Sterne, um uns zu bewerten',
        starThanksTitle: 'VIELEN DANK FÜR IHRE BEWERTUNG!',
        starThanksDesc: 'Wir freuen uns, Ihre Erwartungen übertroffen zu haben. Hinterlassen Sie uns eine Google-Bewertung.',
        shareOnGoogleMaps: 'AUF GOOGLE MAPS TEILEN 🚀',
        improveTitle: 'WIE KÖNNEN WIR UNS VERBESSERN?',
        improveSubtitle: 'Ihr Feedback geht direkt an die Geschäftsleitung für einen 5-Sterne-Service.',
        feedbackLabel: 'Ihre Anmerkung oder Ihr Vorschlag',
        feedbackPlaceholder: 'Schreiben Sie hier Ihr Feedback...',
        nameLabel: 'Ihr Name (Optional)',
        namePlaceholder: 'Vollständiger Name',
        contactLabel: 'Telefon oder E-Mail (Optional)',
        contactPlaceholder: 'Kontakt für Rückfragen',
        sendFeedback: 'NACHRICHT SENDEN',
        sendingFeedback: 'WIRD GESENDET...',
        feedbackSuccessTitle: 'NACHRICHT ERFOLGREICH EMPFANGEN!',
        feedbackSuccessDesc: 'Vielen Dank für Ihre Zeit. Wir werden Ihre Hinweise umgehend berücksichtigen.',
    }
};

export const getMenuTranslations = (lang?: string): MenuTranslations => {
    const validLang = (lang && ['es', 'en', 'fr', 'it', 'pt', 'de'].includes(lang.toLowerCase()))
        ? (lang.toLowerCase() as MenuLanguage)
        : 'es';
    return MENU_TRANSLATIONS[validLang];
};

// ─── Diccionario de Categorías Comunes ─────────────────────────────────────────

const CATEGORY_MAP: Record<string, Partial<Record<MenuLanguage, string>>> = {
    'carnes a la parrilla': {
        en: 'GRILLED MEATS & STEAKS',
        fr: 'VIANDES GRILLÉES',
        it: 'CARNI ALLA GRIGLIA',
        pt: 'CARNES NA GRELHA',
        de: 'GEGRILLTES FLEISCH',
    },
    'carnes': {
        en: 'MEATS & STEAKS',
        fr: 'VIANDES',
        it: 'CARNI',
        pt: 'CARNES',
        de: 'FLEISCHGERICHTE',
    },
    'parrilladas': {
        en: 'BBQ & GRILL PLATTERS',
        fr: 'GRILLADES & BBQ',
        it: 'GRIGLIATE MISTE',
        pt: 'CHURRASCOS & GRELHADOS',
        de: 'GRILLPLATTEN & BBQ',
    },
    'platos tradicionales': {
        en: 'TRADITIONAL DISHES',
        fr: 'PLATS TRADITIONNELS',
        it: 'PIATTI TRADIZIONALI',
        pt: 'PRATOS TRADICIONAIS',
        de: 'TRADITIONELLE GERICHTE',
    },
    'tradicionales': {
        en: 'TRADITIONAL',
        fr: 'TRADITIONNEL',
        it: 'TRADIZIONALI',
        pt: 'TRADICIONAIS',
        de: 'TRADITIONELL',
    },
    'ent& acompañamientos': {
        en: 'STARTERS & SIDES',
        fr: 'ENTRÉES & ACCOMPAGNEMENTS',
        it: 'ANTIPASTI & CONTORNI',
        pt: 'ENTRADAS & ACOMPANHAMENTOS',
        de: 'VORSPEISEN & BEILAGEN',
    },
    'acompañamientos': {
        en: 'SIDE DISHES',
        fr: 'ACCOMPAGNEMENTS',
        it: 'CONTORNI',
        pt: 'ACOMPANHAMENTOS',
        de: 'BEILAGEN',
    },
    'entradas': {
        en: 'APPETIZERS & STARTERS',
        fr: 'ENTRÉES',
        it: 'ANTIPASTI',
        pt: 'ENTRADAS & PETISCOS',
        de: 'VORSPEISEN',
    },
    'bebidas': {
        en: 'DRINKS & BEVERAGES',
        fr: 'BOISSONS',
        it: 'BEVANDE',
        pt: 'BEBIDAS',
        de: 'GETRÄNKE',
    },
    'comida rapida': {
        en: 'FAST FOOD & SNACKS',
        fr: 'FAST-FOOD & EN-CAS',
        it: 'FAST FOOD & SNACK',
        pt: 'FAST FOOD & LANCHES',
        de: 'FAST FOOD & SNACKS',
    },
    'postres': {
        en: 'DESSERTS & SWEETS',
        fr: 'DESSERTS & DOUCEURS',
        it: 'DOLCI & DESSERT',
        pt: 'SOBREMESAS & DOCES',
        de: 'DESSERTS & SÜSSES',
    },
    'sopas': {
        en: 'SOUPS & BROTHS',
        fr: 'SOUPES & POTAGES',
        it: 'ZUPPE & MINESTRE',
        pt: 'SOPAS & CALDOS',
        de: 'SUPPEN',
    },
    'mariscos': {
        en: 'SEAFOOD & FISH',
        fr: 'FRUITS DE MER & POISSONS',
        it: 'FRUTTI DI MARE & PESCE',
        pt: 'FRUTOS DO MAR & PEIXES',
        de: 'MEERESFRÜCHTE & FISCH',
    },
    'especialidades': {
        en: 'SPECIALTIES OF THE HOUSE',
        fr: 'SPÉCIALITÉS DE LA MAISON',
        it: 'SPECIALITÀ DELLA CASA',
        pt: 'ESPECIALIDADES DA CASA',
        de: 'SPEZIALITÄTEN DES HAUSES',
    },
    'combos': {
        en: 'COMBOS & DEALS',
        fr: 'MENUS & COMBOS',
        it: 'COMBO & OFFERTE',
        pt: 'COMBOS & PROMOÇÕES',
        de: 'COMBOS & MENÜS',
    },
    'desayunos': {
        en: 'BREAKFAST',
        fr: 'PETIT-DÉJEUNER',
        it: 'COLAZIONE',
        pt: 'CAFÉ DA MANHÃ',
        de: 'FRÜHSTÜCK',
    },
    'almuerzos': {
        en: 'LUNCH SPECIALS',
        fr: 'DÉJEUNERS',
        it: 'PRANZI',
        pt: 'ALMOÇOS',
        de: 'MITTAGESSEN',
    },
    'cenas': {
        en: 'DINNER',
        fr: 'DÎNERS',
        it: 'CENE',
        pt: 'JANTARES',
        de: 'ABENDESSEN',
    },
    'pollos': {
        en: 'CHICKEN & POULTRY',
        fr: 'POULET & VOLAILLES',
        it: 'POLLO & VOLATILI',
        pt: 'FRANGO & AVES',
        de: 'HÄHNCHEN',
    },
    'pizzas': {
        en: 'PIZZAS',
        fr: 'PIZZAS',
        it: 'PIZZE',
        pt: 'PIZZAS',
        de: 'PIZZEN',
    },
    'hamburguesas': {
        en: 'BURGERS',
        fr: 'BURGER',
        it: 'HAMBURGER',
        pt: 'HAMBÚRGUERES',
        de: 'BURGER',
    },
    'ensaladas': {
        en: 'SALADS & GREENS',
        fr: 'SALADES',
        it: 'INSALATE',
        pt: 'SALADAS',
        de: 'SALATE',
    },
    'cafeteria': {
        en: 'COFFEE & TEA',
        fr: 'CAFÉ & THÉ',
        it: 'CAFFÈ & TÈ',
        pt: 'CAFÉ & CHÁ',
        de: 'KAFFEE & TEE',
    },
    'cocteles': {
        en: 'COCKTAILS',
        fr: 'COCKTAILS',
        it: 'COCKTAIL',
        pt: 'COQUETÉIS',
        de: 'COCKTAILS',
    },
    'licores': {
        en: 'LIQUORS & SPIRITS',
        fr: 'ALCOOLS & SPIRITUEUX',
        it: 'LIQUORI & DISTILLATI',
        pt: 'DESTILADOS & BEBIDAS',
        de: 'SPIRITUOSEN',
    },
    'cervezas': {
        en: 'BEERS',
        fr: 'BIÈRES',
        it: 'BIRRE',
        pt: 'CERVEJAS',
        de: 'BIERE',
    },
    'vinos': {
        en: 'WINES',
        fr: 'VINS',
        it: 'VINI',
        pt: 'VINHOS',
        de: 'WEINE',
    },
    'pastas': {
        en: 'PASTAS',
        fr: 'PÂTES',
        it: 'PASTE',
        pt: 'MASSAS',
        de: 'PASTA',
    },
    'menu infantil': {
        en: 'KIDS MENU',
        fr: 'MENU ENFANT',
        it: 'MENU BAMBINI',
        pt: 'CARDÁPIO INFANTIL',
        de: 'KINDERMENÜ',
    },
    'picadas': {
        en: 'PLATTERS & SHARING',
        fr: 'PLANCHES À PARTAGER',
        it: 'TAGLIERI & DA CONDIVIDERE',
        pt: 'PETISCOS & PORÇÕES',
        de: 'PLATTER ZUM TEILEN',
    },
};

export const translateCategory = (catName: string, lang?: string): string => {
    if (!catName || !lang || lang === 'es') return catName;
    const key = catName.trim().toLowerCase();
    
    // Exact match
    if (CATEGORY_MAP[key] && CATEGORY_MAP[key][lang as MenuLanguage]) {
        return CATEGORY_MAP[key][lang as MenuLanguage]!;
    }

    // Partial search
    for (const [dictKey, translations] of Object.entries(CATEGORY_MAP)) {
        if (key.includes(dictKey) || dictKey.includes(key)) {
            if (translations[lang as MenuLanguage]) {
                return translations[lang as MenuLanguage]!;
            }
        }
    }

    return catName;
};

