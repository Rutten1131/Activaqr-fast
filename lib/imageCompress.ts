/**
 * lib/imageCompress.ts
 * Comprime y convierte imágenes a formato WebP directamente en el cliente
 * ANTES de enviarlas al servidor y a BunnyCDN.
 *
 * - Reduce el peso de las imágenes entre un 70% y 85%.
 * - Evita errores 413 (Payload Too Large) y tiempos de subida lentos en redes móviles.
 * - Dimensiones óptimas máximas: 1400px (mantiene nitidez HD en retinas y banners).
 * - Calidad WebP: 0.80 (alta fidelidad y mínimo peso).
 */

const MAX_DIMENSION = 1400;
const DEFAULT_QUALITY = 0.80;

export async function compressImage(file: File, maxDimension: number = MAX_DIMENSION, quality: number = DEFAULT_QUALITY): Promise<File> {
    if (!file || !file.type.startsWith('image/')) return file;

    // Si ya es un SVG o GIF animado, no lo alteramos
    if (file.type === 'image/svg+xml' || file.type === 'image/gif') return file;

    try {
        const result = await compressImageToBlob(file, maxDimension, quality);
        if (result.blob && result.blob.size < file.size) {
            const baseName = file.name.replace(/\.[^.]+$/, "");
            const newFileName = `${baseName}.${result.ext}`;
            return new File([result.blob], newFileName, { type: result.mimeType });
        }
        return file;
    } catch (err) {
        console.warn('[compressImage] Falló la compresión en cliente, usando original:', err);
        return file;
    }
}

function compressImageToBlob(file: File, maxDim: number, quality: number): Promise<{ blob: Blob; mimeType: string; ext: string }> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const url = URL.createObjectURL(file);

        img.onload = () => {
            URL.revokeObjectURL(url);
            let { width, height } = img;

            // Redimensionar proporcionalmente si supera el máximo
            if (width > maxDim || height > maxDim) {
                const ratio = Math.min(maxDim / width, maxDim / height);
                width = Math.round(width * ratio);
                height = Math.round(height * ratio);
            }

            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d', { alpha: true });
            if (!ctx) {
                reject(new Error('No se pudo inicializar contexto Canvas 2D'));
                return;
            }

            // Suavizado de alta calidad
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(img, 0, 0, width, height);

            // Intentar WebP nativo
            tryFormat('image/webp', 'webp');

            function tryFormat(fmt: 'image/webp' | 'image/jpeg', ext: string) {
                canvas.toBlob(
                    (blob) => {
                        if (blob && blob.size > 0) {
                            resolve({ blob, mimeType: fmt, ext });
                        } else if (fmt === 'image/webp') {
                            tryFormat('image/jpeg', 'jpg'); // fallback para navegadores muy antiguos
                        } else {
                            reject(new Error('Canvas toBlob retornó null'));
                        }
                    },
                    fmt,
                    quality
                );
            }
        };

        img.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error('No se pudo cargar la imagen para compresión'));
        };

        img.src = url;
    });
}
