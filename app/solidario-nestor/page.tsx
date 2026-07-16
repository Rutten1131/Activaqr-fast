import type { Metadata } from "next";
import { Suspense } from "react";
import SolidarioNestorClient from "./SolidarioNestorClient";

export const metadata: Metadata = {
    title: "Juntos por Néstor - Campaña Solidaria ActivaQR",
    description: "Apoya a Néstor Javier Morales Espinosa en su rehabilitación física. Con tu aporte solidario de $35 obtienes tu Contacto Profesional y ayudas directamente a su recuperación.",
    openGraph: {
        title: "Juntos por Néstor - Campaña Solidaria ActivaQR",
        description: "Apoya a Néstor Javier Morales Espinosa en su rehabilitación física. Con tu aporte solidario de $35 obtienes tu Contacto Profesional y ayudas directamente a su recuperación.",
        url: "https://www.activaqr.com/solidario-nestor",
        siteName: "ActivaQR",
        images: [
            {
                url: "/images/nestor-solidario-2.jpg",
                width: 768,
                height: 1024,
                alt: "Campaña Solidaria por Néstor",
            }
        ],
        locale: "es_EC",
        type: "website",
    },
    twitter: {
        card: "summary_large_image",
        title: "Juntos por Néstor - Campaña Solidaria ActivaQR",
        description: "Apoya a Néstor Javier Morales Espinosa en su rehabilitación física. Con tu aporte solidario de $35 obtienes tu Contacto Profesional.",
        images: ["/images/nestor-solidario-2.jpg"],
    }
};

export default function SolidarioNestorPage() {
    return (
        <main className="min-h-screen bg-[#0a0a0a] text-white">
            <Suspense fallback={
                <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a]">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#f66739]"></div>
                </div>
            }>
                <SolidarioNestorClient />
            </Suspense>
        </main>
    );
}
