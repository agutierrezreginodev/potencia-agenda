import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
    return (
        <div className="min-h-screen grid lg:grid-cols-[1fr_1fr]">
            {/* Brand panel */}
            <div className="hidden lg:flex flex-col justify-between relative overflow-hidden bg-gradient-to-br from-brand-600 via-brand-500 to-brand-400 p-12 text-white">
                {/* Decorative blobs */}
                <div className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full bg-white/5 blur-[80px]" />
                <div className="absolute -bottom-32 -right-32 w-[400px] h-[400px] rounded-full bg-white/10 blur-[60px]" />

                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                            <span className="text-xl font-bold" style={{ fontFamily: "var(--font-display)" }}>P</span>
                        </div>
                        <span className="text-xl font-bold tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
                            Potenc-IA
                        </span>
                    </div>
                </div>

                <div className="relative z-10 space-y-6">
                    <h1
                        className="text-5xl font-black leading-[1.05] tracking-tight"
                        style={{ fontFamily: "var(--font-display)" }}
                    >
                        Gestión Inteligente<br />
                        de Reuniones<br />
                        <span className="text-white/80">con IA Generativa</span>
                    </h1>
                    <p className="text-lg text-white/70 max-w-md leading-relaxed">
                        Registra reuniones, genera guías de implementación de IA automáticamente y gestiona tu agenda de clientes en un solo lugar.
                    </p>
                </div>

                <div className="relative z-10">
                    <p className="text-sm text-white/50">
                        © 2026 PotencIA Agenda. Todos los derechos reservados.
                    </p>
                </div>
            </div>

            {/* Form panel */}
            <div className="flex items-center justify-center p-8">
                <div className="w-full max-w-[420px]">{children}</div>
            </div>
        </div>
    );
}
