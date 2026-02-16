"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2, UserPlus } from "lucide-react";
import { toast } from "sonner";

import { registerSchema, type RegisterDto } from "@/core/domain/models/profile";
import { createClient } from "@/infrastructure/supabase/client";
import { Button } from "@/presentation/components/ui/button";
import { Input } from "@/presentation/components/ui/input";
import { Label } from "@/presentation/components/ui/label";

export default function RegisterPage() {
    const router = useRouter();
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<RegisterDto>({
        resolver: zodResolver(registerSchema),
    });

    const onSubmit = async (data: RegisterDto) => {
        setIsLoading(true);
        try {
            const supabase = createClient();
            const { error } = await supabase.auth.signUp({
                email: data.email,
                password: data.password,
                options: {
                    data: {
                        full_name: data.full_name,
                    },
                },
            });

            if (error) {
                toast.error("Error al registrarse", {
                    description: error.message,
                });
                return;
            }

            toast.success("¡Cuenta creada exitosamente!", {
                description: "Revisa tu correo para confirmar tu cuenta.",
            });
            router.push("/login");
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
                    Crear Cuenta
                </h2>
                <p className="text-muted-foreground">
                    Regístrate para comenzar a gestionar tus reuniones con IA
                </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div className="space-y-2">
                    <Label htmlFor="full_name">Nombre completo</Label>
                    <Input
                        id="full_name"
                        type="text"
                        placeholder="Tu nombre"
                        autoComplete="name"
                        {...register("full_name")}
                    />
                    {errors.full_name && (
                        <p className="text-sm text-destructive">{errors.full_name.message}</p>
                    )}
                </div>

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
                    <Label htmlFor="password">Contraseña</Label>
                    <div className="relative">
                        <Input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            placeholder="Mín. 8 caracteres, 1 mayúscula, 1 número"
                            autoComplete="new-password"
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

                <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
                    <Input
                        id="confirmPassword"
                        type={showPassword ? "text" : "password"}
                        placeholder="Repite tu contraseña"
                        autoComplete="new-password"
                        {...register("confirmPassword")}
                    />
                    {errors.confirmPassword && (
                        <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
                    )}
                </div>

                <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                    {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <UserPlus className="h-4 w-4" />
                    )}
                    {isLoading ? "Creando cuenta..." : "Crear Cuenta"}
                </Button>
            </form>

            <p className="text-center text-sm text-muted-foreground">
                ¿Ya tienes una cuenta?{" "}
                <Link href="/login" className="text-brand-500 hover:text-brand-600 font-medium transition-colors">
                    Inicia sesión
                </Link>
            </p>
        </div>
    );
}
