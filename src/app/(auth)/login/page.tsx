"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2, LogIn } from "lucide-react";
import { toast } from "sonner";

import { loginSchema, type LoginDto } from "@/core/domain/models/profile";
import { createClient } from "@/infrastructure/supabase/client";
import { Button } from "@/presentation/components/ui/button";
import { Input } from "@/presentation/components/ui/input";
import { Label } from "@/presentation/components/ui/label";

export default function LoginPage() {
    const router = useRouter();
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginDto>({
        resolver: zodResolver(loginSchema),
    });

    const onSubmit = async (data: LoginDto) => {
        setIsLoading(true);
        try {
            const supabase = createClient();
            const { error } = await supabase.auth.signInWithPassword({
                email: data.email,
                password: data.password,
            });

            if (error) {
                toast.error("Error al iniciar sesión", {
                    description: error.message === "Invalid login credentials"
                        ? "Credenciales inválidas. Verifica tu correo y contraseña."
                        : error.message,
                });
                return;
            }

            toast.success("¡Bienvenido de vuelta!");
            router.push("/");
            router.refresh();
        } catch {
            toast.error("Error inesperado. Intenta de nuevo.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-8">
            {/* Mobile logo */}
            <div className="lg:hidden flex items-center gap-3 justify-center">
                <div className="w-10 h-10 rounded-xl bg-brand-500 flex items-center justify-center">
                    <span className="text-xl font-bold text-white" style={{ fontFamily: "var(--font-display)" }}>P</span>
                </div>
                <span className="text-xl font-bold tracking-tight text-brand-700" style={{ fontFamily: "var(--font-display)" }}>
                    Potenc-IA
                </span>
            </div>

            <div className="space-y-2">
                <h2 className="text-2xl font-bold tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
                    Iniciar Sesión
                </h2>
                <p className="text-muted-foreground">
                    Ingresa tus credenciales para acceder a tu agenda
                </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div className="space-y-2">
                    <Label htmlFor="email">Correo electrónico</Label>
                    <Input
                        id="email"
                        type="email"
                        placeholder="tu@email.com"
                        autoComplete="email"
                        {...register("email")}
                    />
                    {errors.email && (
                        <p className="text-sm text-destructive">{errors.email.message}</p>
                    )}
                </div>

                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="password">Contraseña</Label>
                        <Link
                            href="/forgot-password"
                            className="text-sm text-brand-500 hover:text-brand-600 transition-colors"
                        >
                            ¿Olvidaste tu contraseña?
                        </Link>
                    </div>
                    <div className="relative">
                        <Input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            autoComplete="current-password"
                            {...register("password")}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                    </div>
                    {errors.password && (
                        <p className="text-sm text-destructive">{errors.password.message}</p>
                    )}
                </div>

                <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                    {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <LogIn className="h-4 w-4" />
                    )}
                    {isLoading ? "Iniciando sesión..." : "Iniciar Sesión"}
                </Button>
            </form>

            <p className="text-center text-sm text-muted-foreground">
                ¿No tienes una cuenta?{" "}
                <Link href="/register" className="text-brand-500 hover:text-brand-600 font-medium transition-colors">
                    Regístrate aquí
                </Link>
            </p>
        </div>
    );
}
