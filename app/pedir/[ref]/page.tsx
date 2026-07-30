import type { Metadata } from "next";
import { Suspense } from "react";
import PedirVCardClient from "./PedirVCardClient";

export async function generateMetadata({
    params,
}: {
    params: Promise<{ ref: string }>;
}): Promise<Metadata> {
    const { ref } = await params;
    const isGeneral = ref === "general";

    return {
        title: "Crea tu Contacto Profesional Digital — ActivaQR",
        description:
            "Regístrate ahora y obtén tu Contacto Digital profesional por $35. Comparte tu información de forma moderna y profesional con un simple QR.",
        openGraph: {
            title: "Crea tu Contacto Profesional Digital — ActivaQR",
            description:
                "Regístrate ahora y obtén tu Contacto Digital profesional por $35.",
            url: `https://www.activaqr.com/pedir/${isGeneral ? "" : ref}`,
            siteName: "ActivaQR",
            locale: "es_EC",
            type: "website",
        },
        robots: {
            index: false, // No indexar — es una página de pedido interno
            follow: false,
        },
    };
}

export default async function PedirVCardPage({
    params,
}: {
    params: Promise<{ ref: string }>;
}) {
    const { ref } = await params;
    const refCode = ref === "general" ? null : ref;

    return (
        <main className="min-h-screen bg-[#0a0a0a] text-white">
            <Suspense
                fallback={
                    <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a]">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#f66739]"></div>
                    </div>
                }
            >
                <PedirVCardClient refCode={refCode} />
            </Suspense>
        </main>
    );
}
