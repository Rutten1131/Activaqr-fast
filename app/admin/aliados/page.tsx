"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Award, Users } from "lucide-react";
import AffiliatePipelineDashboard from "@/components/admin/AffiliatePipelineDashboard";

export default function AliadosAdminPage() {
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const storedKey = localStorage.getItem("admin_access_key");
        if (storedKey) {
            fetch("/api/admin/validate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ key: storedKey }),
            })
                .then((res) => res.json())
                .then((data) => {
                    if (data.valid) {
                        setIsAuthorized(true);
                    } else {
                        localStorage.removeItem("admin_access_key");
                        router.push("/admin");
                    }
                })
                .catch(() => {
                    localStorage.removeItem("admin_access_key");
                    router.push("/admin");
                })
                .finally(() => setLoading(false));
        } else {
            router.push("/admin");
        }
    }, [router]);

    if (loading) {
        return (
            <div className="min-h-screen bg-navy flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!isAuthorized) {
        return null;
    }

    return (
        <div className="min-h-screen bg-navy text-white p-4 md:p-8">
            <div className="max-w-7xl mx-auto">
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 border-b border-white/10 pb-6">
                    <div>
                        <div className="flex items-center gap-4 mb-2">
                            <Link
                                href="/admin"
                                className="p-2 bg-white/5 hover:bg-white/10 rounded-xl transition-all text-white/40 hover:text-white"
                            >
                                <ArrowLeft size={20} />
                            </Link>
                            <h1 className="text-3xl md:text-4xl font-black uppercase italic tracking-tighter">
                                Aliados & 10 Casos de Éxito
                            </h1>
                        </div>
                        <p className="text-white/40 text-xs font-black uppercase tracking-widest pl-12">
                            Motor de Afiliados, Pipeline de Restaurantes y Campaña de Lanzamiento
                        </p>
                    </div>
                </header>

                <AffiliatePipelineDashboard />
            </div>
        </div>
    );
}
