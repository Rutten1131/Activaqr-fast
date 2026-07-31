import { redirect } from "next/navigation";

// /mi-qr → redirige al formulario sin código de referido
export default function MiQrPage() {
    redirect("/mi-qr/general");
}
