"use client";

import { cn } from '@/lib/utils';
import { getInstagramID, getFacebookURL } from '@/lib/videoUtils';

interface SocialVideoEmbedProps {
    url: string;
    isVertical?: boolean;
    className?: string;
}

/**
 * Renderiza iframes oficiales y optimizados para reproducir videos de Instagram y Facebook ahí mismo.
 */
export default function SocialVideoEmbed({ url, isVertical, className }: SocialVideoEmbedProps) {
    const isInstagram = url.toLowerCase().includes('instagram.com');
    
    if (isInstagram) {
        const igId = getInstagramID(url);
        const embedUrl = igId ? `https://www.instagram.com/reel/${igId}/embed/` : null;

        if (embedUrl) {
            return (
                <div className="w-full h-full flex items-center justify-center p-1">
                    <iframe
                        src={embedUrl}
                        className={cn(
                            "rounded-xl md:rounded-2xl shadow-2xl mx-auto w-full h-full",
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
    } else {
        // Facebook
        const fbUrl = getFacebookURL(url);
        if (fbUrl) {
            const embedUrl = `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(fbUrl)}&show_text=0&autoplay=0`;
            return (
                <div className="w-full h-full flex items-center justify-center p-1">
                    <iframe
                        src={embedUrl}
                        className={cn(
                            "rounded-xl md:rounded-2xl shadow-2xl mx-auto w-full h-full",
                            isVertical 
                                ? "max-w-[320px] md:max-w-[340px] aspect-[9/17.5] max-h-[85vh]" 
                                : "aspect-video"
                        )}
                        allowFullScreen
                        allow="autoplay; encrypted-media; picture-in-picture"
                        scrolling="no"
                    />
                </div>
            );
        }
    }

    // Fallback: Si la URL no es válida o no se pudo procesar, mostrar un botón interactivo
    const platformName = isInstagram ? 'Instagram' : 'Facebook';
    const bgGradient = isInstagram
        ? "from-purple-900 via-pink-600 to-yellow-500 hover:shadow-[0_0_30px_rgba(219,39,119,0.3)]"
        : "from-blue-900 via-blue-700 to-blue-800 hover:shadow-[0_0_30px_rgba(29,78,216,0.3)]";

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
                    {isInstagram 
                        ? <InstagramIcon className="w-8 h-8 text-white" /> 
                        : <FacebookIcon className="w-8 h-8 text-white" />
                    }
                </div>

                <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/80">
                        Abrir {platformName}
                    </span>
                    <h4 className="text-sm md:text-base font-bold text-white max-w-[280px] leading-snug drop-shadow-md">
                        {isInstagram ? "Ver Reel en Instagram" : "Ver Video en Facebook"}
                    </h4>
                    <p className="text-[11px] text-white/60 font-medium">
                        Usa un enlace directo para verlo en el catálogo
                    </p>
                </div>

                <div className="mt-2 flex items-center gap-2 px-5 py-2.5 bg-white text-black font-black text-xs uppercase tracking-widest rounded-full shadow-xl group-hover:bg-white/90 active:scale-95 transition-all">
                    <span>▶ Reproducir Video Externo</span>
                </div>
            </div>
        </a>
    );
}

// ─── Icons ───────────────────────────────────────────────

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


