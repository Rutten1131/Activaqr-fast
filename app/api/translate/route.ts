import { NextRequest, NextResponse } from 'next/server';

// In-memory cache to avoid repeated API calls for the same texts
const translationCache = new Map<string, string>();

const LANG_CODES: Record<string, string> = {
    es: 'es',
    en: 'en',
    fr: 'fr',
    it: 'it',
    pt: 'pt',
    de: 'de',
};

async function translateSingleText(text: string, fromCode: string, toCode: string): Promise<string> {
    if (!text || !text.trim()) return text;

    const cacheKey = `${fromCode}|${toCode}|${text}`;
    if (translationCache.has(cacheKey)) {
        return translationCache.get(cacheKey)!;
    }

    // 1. Try Google Translate public endpoint (ultra-fast and handles multiline)
    try {
        const gUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${fromCode}&tl=${toCode}&dt=t&q=${encodeURIComponent(text)}`;
        const gRes = await fetch(gUrl, {
            signal: AbortSignal.timeout(4000),
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
        });
        if (gRes.ok) {
            const gData = await gRes.json();
            if (Array.isArray(gData) && Array.isArray(gData[0])) {
                const combined = gData[0].map((item: any) => item[0]).filter(Boolean).join('');
                if (combined && combined.trim()) {
                    translationCache.set(cacheKey, combined);
                    return combined;
                }
            }
        }
    } catch {
        // Fallback to MyMemory
    }

    // 2. Fallback: MyMemory API
    try {
        const mUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text.slice(0, 500))}&langpair=${fromCode}|${toCode}`;
        const mRes = await fetch(mUrl, {
            signal: AbortSignal.timeout(4000),
            headers: { 'User-Agent': 'ActivaQR/2.0' }
        });
        if (mRes.ok) {
            const mData = await mRes.json();
            const translated = mData?.responseData?.translatedText;
            if (translated && translated !== text) {
                translationCache.set(cacheKey, translated);
                return translated;
            }
        }
    } catch {
        // Final fallback: return original text
    }

    return text;
}

/**
 * POST /api/translate
 * Body: { texts: string[], from: string, to: string }
 * Returns: { translations: string[] }
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { texts, from = 'es', to } = body as { texts: string[]; from?: string; to: string };

        if (!texts || !Array.isArray(texts) || !to) {
            return NextResponse.json({ error: 'Missing texts[] or to language' }, { status: 400 });
        }

        if (from === to || !LANG_CODES[to]) {
            return NextResponse.json({ translations: texts });
        }

        const fromCode = LANG_CODES[from] || 'es';
        const toCode = LANG_CODES[to];

        // Translate in parallel with a concurrency limit
        const results = await Promise.all(
            texts.map(text => translateSingleText(text, fromCode, toCode))
        );

        return NextResponse.json({ translations: results });
    } catch {
        return NextResponse.json({ error: 'Translation failed' }, { status: 500 });
    }
}
