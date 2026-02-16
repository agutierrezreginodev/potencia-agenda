"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, User, Lock, ArrowLeft, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

import { createClient } from "@/infrastructure/supabase/client";
import { Button } from "@/presentation/components/ui/button";
import { Input } from "@/presentation/components/ui/input";
import { Label } from "@/presentation/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/presentation/components/ui/card";
import { Separator } from "@/presentation/components/ui/separator";
import Link from "next/link";

const profileSchema = z.object({
    full_name: z
        .string()
        .min(2, "El nombre debe tener al menos 2 caracteres")
        .max(100, "El nombre no puede exceder 100 caracteres"),
});

const passwordSchema = z
    .object({
        new_password: z
            .string()
            .min(8, "La contraseña debe tener al menos 8 caracteres")
            .regex(/[A-Z]/, "Debe contener al menos una mayúscula")
            .regex(/[0-9]/, "Debe contener al menos un número"),
        confirm_password: z.string(),
    })
    .refine((data) => data.new_password === data.confirm_password, {
        message: "Las contraseñas no coinciden",
        path: ["confirm_password"],
    });

type ProfileDto = z.infer<typeof profileSchema>;
type PasswordDto = z.infer<typeof passwordSchema>;

export default function ProfilePage() {
    const router = useRouter();
    const supabase = createClient();
    const [email, setEmail] = useState("");
    const [savingProfile, setSavingProfile] = useState(false);
    const [savingPassword, setSavingPassword] = useState(false);
    const [loading, setLoading] = useState(true);

    const {
        register: registerProfile,
        handleSubmit: handleProfileSubmit,
        formState: { errors: profileErrors },
        setValue: setProfileValue,
    } = useForm<ProfileDto>({
        resolver: zodResolver(profileSchema),
    });

    const {
        register: registerPassword,
        handleSubmit: handlePasswordSubmit,
        formState: { errors: passwordErrors },
        reset: resetPassword,
    } = useForm<PasswordDto>({
        resolver: zodResolver(passwordSchema),
    });

    useEffect(() => {
        const loadProfile = async () => {
            const {
                data: { user },
            } = await supabase.auth.getUser();
            if (!user) {
                router.push("/login");
                return;
            }

            setEmail(user.email ?? "");

            const { data: profile } = await supabase
                .from("profiles")
                .select("full_name")
                .eq("id", user.id)
                .single();

            if (profile) {
                setProfileValue("full_name", profile.full_name);
            }
            setLoading(false);
        };

        loadProfile();
    }, [supabase, router, setProfileValue]);

    const onProfileSubmit = async (data: ProfileDto) => {
        setSavingProfile(true);
        try {
            const {
                data: { user },
            } = await supabase.auth.getUser();
            if (!user) throw new Error("No autenticado");

            const { error } = await supabase
                .from("profiles")
                .update({ full_name: data.full_name })
                .eq("id", user.id);

            if (error) throw new Error(error.message);

            await supabase.auth.updateUser({
                data: { full_name: data.full_name },
            });

            toast.success("Perfil actualizado correctamente");
        } catch (error) {
            toast.error("Error al actualizar perfil", {
                description: error instanceof Error ? error.message : "Error desconocido",
            });
        } finally {
            setSavingProfile(false);
        }
    };

    const onPasswordSubmit = async (data: PasswordDto) => {
        setSavingPassword(true);
        try {
            const { error } = await supabase.auth.updateUser({
                password: data.new_password,
            });

            if (error) throw new Error(error.message);

            resetPassword();
            toast.success("Contraseña actualizada correctamente");
        } catch (error) {
            toast.error("Error al cambiar contraseña", {
                description: error instanceof Error ? error.message : "Error desconocido",
            });
        } finally {
            setSavingPassword(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-2xl mx-auto">
            <Link
                href="/"
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
                <ArrowLeft className="h-4 w-4" />
                Volver al dashboard
            </Link>

            <div>
                <h1
                    className="text-3xl font-bold tracking-tight"
                    style={{ fontFamily: "var(--font-display)" }}
                >
                    Mi Perfil
                </h1>
                <p className="text-muted-foreground mt-1">
                    Gestiona tu información personal y seguridad
                </p>
            </div>

            {/* Profile form */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <User className="h-5 w-5 text-brand-500" />
                        Información Personal
                    </CardTitle>
                    <CardDescription>
                        Actualiza tu nombre de perfil
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleProfileSubmit(onProfileSubmit)} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Correo electrónico</Label>
                            <Input
                                id="email"
                                type="email"
                                value={email}
                                disabled
                                className="bg-muted/50"
                            />
                            <p className="text-xs text-muted-foreground">
                                El correo no se puede cambiar
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="full_name">Nombre completo</Label>
                            <Input
                                id="full_name"
                                placeholder="Tu nombre completo"
                                {...registerProfile("full_name")}
                            />
                            {profileErrors.full_name && (
                                <p className="text-xs text-destructive">
                                    {profileErrors.full_name.message}
                                </p>
                            )}
                        </div>

                        <Button type="submit" disabled={savingProfile} className="gap-2">
                            {savingProfile ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <CheckCircle2 className="h-4 w-4" />
                            )}
                            Guardar cambios
                        </Button>
                    </form>
                </CardContent>
            </Card>

            <Separator />

            {/* Password form */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Lock className="h-5 w-5 text-brand-500" />
                        Cambiar Contraseña
                    </CardTitle>
                    <CardDescription>
                        Actualiza tu contraseña de acceso
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="new_password">Nueva contraseña</Label>
                            <Input
                                id="new_password"
                                type="password"
                                placeholder="Mínimo 8 caracteres"
                                {...registerPassword("new_password")}
                            />
                            {passwordErrors.new_password && (
                                <p className="text-xs text-destructive">
                                    {passwordErrors.new_password.message}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirm_password">Confirmar contraseña</Label>
                            <Input
                                id="confirm_password"
                                type="password"
                                placeholder="Repite la contraseña"
                                {...registerPassword("confirm_password")}
                            />
                            {passwordErrors.confirm_password && (
                                <p className="text-xs text-destructive">
                                    {passwordErrors.confirm_password.message}
                                </p>
                            )}
                        </div>

                        <Button type="submit" variant="outline" disabled={savingPassword} className="gap-2">
                            {savingPassword ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Lock className="h-4 w-4" />
                            )}
                            Cambiar contraseña
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
