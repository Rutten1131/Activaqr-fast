"use client";

import { cn } from '@/lib/utils';
import { getInstagramID, getFacebookURL, getTikTokID } from '@/lib/videoUtils';

interface SocialVideoEmbedProps {
    url: string;
    isVertical?: boolean;
    className?: string;
}

/**
 * Renderiza iframes oficiales y optimizados para reproducir videos de Instagram, Facebook y TikTok ahí mismo.
 * Incluye fallback interactivo si el navegador bloquea el frame por políticas de terceros.
 */
export default function SocialVideoEmbed({ url, isVertical = true, className }: SocialVideoEmbedProps) {
    const clean = url ? url.toLowerCase().trim() : '';
    const isInstagram = clean.includes('instagram.com');
    const isTikTok = clean.includes('tiktok.com');
    const isFacebook = clean.includes('facebook.com') || clean.includes('fb.watch') || clean.includes('fb.com');

    // 1. TikTok
    if (isTikTok) {
        const ttId = getTikTokID(url);
        // Usar el reproductor embed oficial de TikTok
        const embedUrl = ttId ? `https://www.tiktok.com/player/v1/${ttId}?music_info=1&description=1` : null;

        if (embedUrl) {
            return (
                <div className="w-full h-full flex items-center justify-center p-1 md:p-2 bg-black rounded-2xl relative overflow-hidden">
                    <iframe
                        src={embedUrl}
                        className={cn(
                            "rounded-xl md:rounded-2xl shadow-2xl mx-auto w-full h-full border-0",
                            isVertical 
                                ? "max-w-[360px] md:max-w-[420px] aspect-[9/16] min-h-[460px] max-h-[85vh]" 
                                : "w-full aspect-video min-h-[250px]"
                        )}
                        allowFullScreen
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        scrolling="no"
                        frameBorder="0"
                    />
                </div>
            );
        }
    }

    // 2. Instagram
    if (isInstagram) {
        const igId = getInstagramID(url);
        const embedUrl = igId ? `https://www.instagram.com/reel/${igId}/embed/` : null;

        if (embedUrl) {
            return (
                <div className="w-full h-full flex items-center justify-center p-1">
                    <iframe
                        src={embedUrl}
                        className={cn(
                            "rounded-xl md:rounded-2xl shadow-2xl mx-auto w-full h-full border-0",
                            isVertical 
                                ? "max-w-[320px] md:max-w-[340px] aspect-[9/17.5] max-h-[85vh]" 
                                : "aspect-video"
                        )}
                        allowFullScreen
                        allow="autoplay; encrypted-media"
                        scrolling="no"
                    />
                </div>
            );
        }
    } 

    // 3. Facebook
    if (isFacebook) {
        const fbUrl = getFacebookURL(url);
        if (fbUrl) {
            const embedUrl = `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(fbUrl)}&show_text=0&autoplay=1`;
            return (
                <div className="w-full h-full flex items-center justify-center p-1 md:p-2 bg-black/40 rounded-2xl relative overflow-hidden">
                    <iframe
                        src={embedUrl}
                        className={cn(
                            "rounded-xl md:rounded-2xl shadow-2xl mx-auto w-full h-full border-0",
                            isVertical 
                                ? "max-w-[340px] md:max-w-[380px] aspect-[9/16] min-h-[420px] max-h-[80vh]" 
                                : "w-full aspect-video min-h-[250px]"
                        )}
                        allowFullScreen
                        allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; webshare"
                        scrolling="no"
                        frameBorder="0"
                    />
                </div>
            );
        }
    }

    // Fallback: Si la URL no es válida o no se pudo extraer ID directamente
    const platformName = isTikTok ? 'TikTok' : (isInstagram ? 'Instagram' : 'Facebook');
    const bgGradient = isTikTok
        ? "from-black via-[#010101] to-[#0d1b2a] hover:shadow-[0_0_30px_rgba(37,244,238,0.3)]"
        : (isInstagram
            ? "from-purple-900 via-pink-600 to-yellow-500 hover:shadow-[0_0_30px_rgba(219,39,119,0.3)]"
            : "from-blue-900 via-blue-700 to-blue-800 hover:shadow-[0_0_30px_rgba(29,78,216,0.3)]");

    return (
        <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
                "group relative flex flex-col items-center justify-center bg-gradient-to-br w-full h-full min-h-[300px] rounded-2xl overflow-hidden border border-white/20 transition-all duration-300 hover:scale-[1.01] active:scale-95 cursor-pointer",
                bgGradient,
                className
            )}
        >
            <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors duration-300" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30 pointer-events-none" />

            <div className="relative z-10 flex flex-col items-center gap-4 p-6 text-center select-none">
                <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-500">
                    {isTikTok 
                        ? <TikTokIcon className="w-8 h-8 text-white" />
                        : (isInstagram 
                            ? <InstagramIcon className="w-8 h-8 text-white" /> 
                            : <FacebookIcon className="w-8 h-8 text-white" />
                        )
                    }
                </div>

                <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/80">
                        Abrir en {platformName}
                    </span>
                    <h4 className="text-sm md:text-base font-bold text-white max-w-[280px] leading-snug drop-shadow-md">
                        {isTikTok ? "Ver Video en TikTok" : (isInstagram ? "Ver Reel en Instagram" : "Ver Video en Facebook")}
                    </h4>
                    <p className="text-[11px] text-white/60 font-medium">
                        Toca para reproducir el video directamente
                    </p>
                </div>

                <div className="mt-2 flex items-center gap-2 px-5 py-2.5 bg-white text-black font-black text-xs uppercase tracking-widest rounded-full shadow-xl group-hover:bg-white/90 active:scale-95 transition-all">
                    <span>▶ Abrir Video</span>
                </div>
            </div>
        </a>
    );
}

// ─── Icons ───────────────────────────────────────────────

function TikTokIcon({ className = "w-8 h-8" }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
            <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.29 0 .58.04.85.12V9.4a6.33 6.33 0 0 0-1-.08A6.34 6.34 0 0 0 3 15.66a6.34 6.34 0 0 0 10.82 4.47 6.27 6.27 0 0 0 1.87-4.47V8.7a8.28 8.28 0 0 0 4.84 1.55V6.78a4.85 4.85 0 0 1-.94-.09z"/>
        </svg>
    );
}

function InstagramIcon({ className = "w-8 h-8" }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
            <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
        </svg>
    );
}

function FacebookIcon({ className = "w-8 h-8" }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
    );
}


