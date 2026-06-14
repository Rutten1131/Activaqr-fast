/**
 * lib/videoUtils.ts
 * Utilidades centralizadas para extracción de IDs de video.
 * Fuente única de verdad — NO duplicar en templates individuales.
 */

export const getYouTubeID = (url: string): string | null => {
    if (!url) return null;
    // Soporte para IDs directos de 11 caracteres
    if (url.length === 11 && /^[a-zA-Z0-9_-]{11}$/.test(url)) return url;
    const regExp = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|shorts\/|live\/)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
};

export const getYouTubeThumbnail = (url: string): string | null => {
    const id = getYouTubeID(url);
    if (id) {
        return `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
    }
    return null;
};

export const getTikTokID = (url: string): string | null => {
    if (!url) return null;
    if (!url.includes('tiktok.com')) return null;
    
    // Formato embed directo: https://www.tiktok.com/embed/123456789012345678
    const embedMatch = url.match(/tiktok\.com\/embed\/(\d+)/);
    if (embedMatch) return embedMatch[1];
    
    // Formato estandar: https://www.tiktok.com/@usuario/video/123456789012345678
    const videoMatch = url.match(/\/video\/(\d+)/);
    if (videoMatch) return videoMatch[1];
    
    // Formato antiguo: /v/123456789012345678
    const vMatch = url.match(/\/v\/(\d+)/);
    if (vMatch) return vMatch[1];
    
    // Formato share largo: https://www.tiktok.com/i18n/share/{username}/{videoId}
    const shareMatch = url.match(/tiktok\.com\/i18n\/share\/[^\/]+\/(\d+)/);
    if (shareMatch) return shareMatch[1];
    
    // Formato share simple: https://www.tiktok.com/i18n/share/{videoId}
    const shareSimpleMatch = url.match(/tiktok\.com\/i18n\/share\/(\d+)/);
    if (shareSimpleMatch) return shareSimpleMatch[1];
    
    // Links cortos vm.tiktok.com - NO se puede extraer ID sin hacer fetch
    // Estos retornaran null pero el template puede intentar usar el link directo
    if (url.includes('vm.tiktok.com') || url.includes('vt.tiktok.com')) {
        // Retornar el URL tal cual para que el template intente embed de otra forma
        return null;
    }
    
    return null;
};

export const getInstagramID = (url: string): string | null => {
    if (!url) return null;
    if (url.includes('instagram.com')) {
        const match = url.match(/\/(?:p|reels|reel)\/([A-Za-z0-9_-]+)/);
        return match ? match[1] : null;
    }
    return null;
};

export const getFacebookURL = (url: string): string | null => {
    if (!url) return null;
    if (url.includes('facebook.com') || url.includes('fb.watch')) {
        // Si ya es un reel real con ID numérico en la ruta, retornar la URL base limpia
        const canonicalReelMatch = url.match(/facebook\.com\/reel\/(\d+)/);
        if (canonicalReelMatch) {
            return `https://www.facebook.com/reel/${canonicalReelMatch[1]}`;
        }
        const canonicalVideoMatch = url.match(/facebook\.com\/watch\/\?v=(\d+)/) || url.match(/facebook\.com\/video\.php\?v=(\d+)/) || url.match(/facebook\.com\/[^\/]+\/videos\/(\d+)/);
        if (canonicalVideoMatch) {
            return `https://www.facebook.com/video.php?v=${canonicalVideoMatch[1]}`;
        }

        // Transformar links de redirección móvil /share/r/ a links nativos de Reel
        const shareReelMatch = url.match(/\/share\/r\/([A-Za-z0-9_-]+)/);
        if (shareReelMatch) {
            // Usar URL original porque el short code NO es un ID de reel válido para el embed
            return url;
        }
        // Transformar links de redirección móvil /share/v/ a links nativos de Video
        const shareVideoMatch = url.match(/\/share\/v\/([A-Za-z0-9_-]+)/);
        if (shareVideoMatch) {
            // Usar URL original porque el short code NO es un ID de video válido para el embed
            return url;
        }
        return url;
    }
    return null;
};

/**
 * Detecta si una URL es un video directo (MP4, WebM, MOV, AVI, MKV, etc.)
 * Incluye soporte para BunnyNet, Vimeo directo, Cloudflare Stream, etc.
 */
export const isDirectVideoUrl = (url: string | null | undefined): boolean => {
    if (!url) return false;
    const cleanUrl = url.trim().toLowerCase();
    
    // Si ya es un iframe, no es video directo
    if (cleanUrl.startsWith('<iframe')) return false;
    
    // EXCLUIR redes sociales - tienen /video en URL pero NO son videos directos
    // TikTok, YouTube, Facebook, Instagram, Twitter, etc.
    const socialMediaHosts = [
        'tiktok.com',
        'youtube.com',
        'youtu.be',
        'facebook.com',
        'fb.watch',
        'instagram.com',
        'twitter.com',
        'x.com',
        'linkedin.com',
        'threads.net',
    ];
    if (socialMediaHosts.some(host => cleanUrl.includes(host))) {
        return false;
    }
    
    // Extensiones comunes de video directo
    const videoExtensions = ['.mp4', '.webm', '.mov', '.avi', '.mkv', '.m4v', '.ogv', '.3gp', '.flv'];
    const hasVideoExtension = videoExtensions.some(ext => cleanUrl.includes(ext));
    
    // CDNs y servicios de video conocidos que usan links directos
    const videoHosts = [
        'bunny.net',
        'bunnycdn.com',
        'vimeo.com',          // archivos directos de Vimeo
        'cloudflare.com',     // Cloudflare Stream
        'streamable.com',
        'vidyard.com',
        'wistia.com',
        'jwplayer.com',
        'videoask.com',
        'loom.com',
        'cdn77.org',
        'cdnsun.net',
    ];
    const isVideoHost = videoHosts.some(host => cleanUrl.includes(host));
    
    // URLs que terminan en /video o contienen /videos/ (solo para CDNs no-sociales)
    const hasVideoPath = (cleanUrl.includes('/video') || cleanUrl.includes('/videos/')) && !socialMediaHosts.some(host => cleanUrl.includes(host));
    
    return hasVideoExtension || isVideoHost || hasVideoPath;
};

/**
 * Retorna la URL directa de video si es un video directo, o null si es un embed de plataforma.
 */
export const getDirectVideoUrl = (url: string | null | undefined): string | null => {
    if (!url) return null;
    if (isDirectVideoUrl(url)) {
        // Si es un iframe, extraer el src
        if (url.trim().toLowerCase().startsWith('<iframe')) {
            const srcMatch = url.match(/src=["'](.*?)["']/);
            if (srcMatch && srcMatch[1]) return srcMatch[1];
        }
        return url;
    }
    return null;
};

/**
 * Retorna la URL de embed correcta según la plataforma detectada.
 */
export const getVideoEmbedUrl = (url: string | null | undefined): string | null => {
    if (!url) return null;
    
    // Si es un video directo, retornar null (el template debe usar <video> tag)
    if (isDirectVideoUrl(url)) return null;
    
    const ytId = getYouTubeID(url);
    if (ytId) return `https://www.youtube.com/embed/${ytId}`;

    const ttId = getTikTokID(url);
    if (ttId) return `https://www.tiktok.com/embed/v2/${ttId}`;

    // TikTok short links (vm.tiktok.com, vt.tiktok.com) - usar ?url= parametro
    if (url.includes('tiktok.com') && (url.includes('vm.tiktok.com') || url.includes('vt.tiktok.com'))) {
        // TikTok acepta la URL original como parametro para resolver el video
        return `https://www.tiktok.com/embed/?url=${encodeURIComponent(url)}`;
    }

    const igId = getInstagramID(url);
    if (igId) return `https://www.instagram.com/p/${igId}/embed`;

    const fbUrl = getFacebookURL(url);
    if (fbUrl) return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(fbUrl)}&show_text=0`;

    // Si pasaron un iframe de YouTube/TikTok/Vimeo, intentar extraer el src
    if (url.trim().toLowerCase().startsWith('<iframe')) {
        const srcMatch = url.match(/src=["'](.*?)["']/);
        if (srcMatch && srcMatch[1]) {
            return srcMatch[1];
        }
    }

    return null;
};

/**
 * Determina si un video es vertical (TikTok, Instagram, YouTube Shorts, Facebook Reels).
 */
export const checkIsVerticalVideo = (url: string | null | undefined): boolean => {
    if (!url) return false;
    let cleanUrl = url.trim().toLowerCase();

    // Si es un iframe, extraemos la URL de src
    if (cleanUrl.startsWith('<iframe')) {
        const srcMatch = url.match(/src=["'](.*?)["']/i);
        if (srcMatch && srcMatch[1]) {
            cleanUrl = srcMatch[1].toLowerCase();
        }
    }

    // 0. Query param explícito: ?aspect=vertical o ?aspect=vertical
    // Ejemplo: https://bunny.net/video.mp4?aspect=vertical
    try {
        const urlObj = new URL(cleanUrl.startsWith('http') ? cleanUrl : 'https://example.com' + cleanUrl);
        const aspect = urlObj.searchParams.get('aspect');
        if (aspect && aspect.toLowerCase() === 'vertical') return true;
    } catch {
        // Si falla el parsing de URL, continuamos con las detecciones basadas en plataforma
    }

    // 1. TikTok siempre es vertical (9:16)
    if (cleanUrl.includes('tiktok.com')) return true;

    // 2. Instagram suele ser vertical o cuadrado (lo tratamos como vertical en la UI)
    if (cleanUrl.includes('instagram.com')) return true;

    // 3. YouTube Shorts son verticales (9:16)
    if (cleanUrl.includes('youtube.com/shorts') || cleanUrl.includes('youtu.be/shorts')) return true;

    // 4. Facebook Reels son verticales (9:16)
    if (
        cleanUrl.includes('facebook.com/reel') || 
        cleanUrl.includes('/share/r/') || 
        (cleanUrl.includes('facebook.com/plugins/video') && cleanUrl.includes('/reel/'))
    ) {
        return true;
    }

    return false;
};

