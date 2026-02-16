"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, ArrowLeft, Mail } from "lucide-react";
import { toast } from "sonner";

import { forgotPasswordSchema, type ForgotPasswordDto } from "@/core/domain/models/profile";
import { createClient } from "@/infrastructure/supabase/client";
import { Button } from "@/presentation/components/ui/button";
import { Input } from "@/presentation/components/ui/input";
import { Label } from "@/presentation/components/ui/label";

export default function ForgotPasswordPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [emailSent, setEmailSent] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<ForgotPasswordDto>({
        resolver: zodResolver(forgotPasswordSchema),
    });

    const onSubmit = async (data: ForgotPasswordDto) => {
        setIsLoading(true);
        try {
            const supabase = createClient();
            const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
                redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
            });

            if (error) {
                toast.error("Error al enviar el enlace", {
                    description: error.message,
                });
                return;
            }

            setEmailSent(true);
            toast.success("Enlace enviado", {
                description: "Revisa tu correo para restablecer tu contraseña.",
            });
        } catch {
            toast.error("Error inesperado. Intenta de nuevo.");
        } finally {
            setIsLoading(false);
        }
    };

    if (emailSent) {
        return (
            <div className="space-y-8 text-center">
                <div className="mx-auto w-16 h-16 rounded-2xl bg-brand-50 flex items-center justify-center">
                    <Mail className="h-8 w-8 text-brand-500" />
                </div>
                <div className="space-y-2">
                    <h2 className="text-2xl font-bold tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
                        Revisa tu correo
                    </h2>
                    <p className="text-muted-foreground">
                        Te hemos enviado un enlace para restablecer tu contraseña. El enlace expira en 24 horas.
                    </p>
                </div>
                <Link href="/login">
                    <Button variant="outline" className="gap-2">
                        <ArrowLeft className="h-4 w-4" />
                        Volver al inicio de sesión
                    </Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <Link
                href="/login"
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
                <ArrowLeft className="h-4 w-4" />
                Volver al inicio de sesión
            </Link>

            <div className="space-y-2">
                <h2 className="text-2xl font-bold tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
                    Recuperar Contraseña
                </h2>
                <p className="text-muted-foreground">
                    Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.
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

                <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                    {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <Mail className="h-4 w-4" />
                    )}
                    {isLoading ? "Enviando..." : "Enviar enlace de recuperación"}
                </Button>
            </form>
        </div>
    );
}
