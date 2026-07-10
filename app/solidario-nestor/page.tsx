import type { Metadata } from "next";
import { Suspense } from "react";
import SolidarioNestorClient from "./SolidarioNestorClient";

export const metadata: Metadata = {
    title: "Ayuda Solidaria para Néstor - ActivaQR",
    description: "Únete a la campaña solidaria para Néstor. Colabora y recibe tu Contacto Digital profesional de agradecimiento.",
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
