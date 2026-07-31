import { redirect } from "next/navigation";

// Redirección de compatibilidad: /pedir/[ref] → /mi-qr/[ref]
export default async function PedirRefRedirectPage({
    params,
}: {
    params: Promise<{ ref: string }>;
}) {
    const { ref } = await params;
    redirect(`/mi-qr/${ref || "general"}`);
}
