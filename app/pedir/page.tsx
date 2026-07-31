import { redirect } from "next/navigation";

// Redirección de compatibilidad: /pedir → /mi-qr/general
export default function PedirRedirectPage() {
    redirect("/mi-qr/general");
}
