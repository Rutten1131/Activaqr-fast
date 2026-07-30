import { redirect } from "next/navigation";

// /pedir → redirige al formulario sin código de referido
export default function PedirPage() {
    redirect("/pedir/general");
}
