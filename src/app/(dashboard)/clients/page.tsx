"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
    Search,
    Plus,
    Pencil,
    Trash2,
    Loader2,
    ChevronLeft,
    ChevronRight,
    Users,
    Mail,
    Phone,
    Building2,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";

import {
    getClients,
    createClient,
    updateClient,
    deleteClient,
} from "@/core/application/actions/client-actions";
import {
    createClientSchema,
    type CreateClientDto,
    type IClient,
} from "@/core/domain/models/client";
import { Button } from "@/presentation/components/ui/button";
import { Input } from "@/presentation/components/ui/input";
import { Label } from "@/presentation/components/ui/label";
import { Textarea } from "@/presentation/components/ui/textarea";
import { Card, CardContent } from "@/presentation/components/ui/card";
import { Skeleton } from "@/presentation/components/ui/skeleton";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/presentation/components/ui/dialog";

export default function ClientsPage() {
    const [clients, setClients] = useState<IClient[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);

    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [editingClient, setEditingClient] = useState<IClient | null>(null);
    const [deletingClient, setDeletingClient] = useState<IClient | null>(null);
    const [saving, setSaving] = useState(false);

    const fetchClients = useCallback(async () => {
        setLoading(true);
        try {
            const result = await getClients({ search, page, pageSize: 10 });
            setClients(result.clients as unknown as IClient[]);
            setTotalPages(result.totalPages);
            setTotal(result.total);
        } catch (error) {
            toast.error("Error al cargar clientes", {
                description: error instanceof Error ? error.message : "Error desconocido",
            });
        } finally {
            setLoading(false);
        }
    }, [search, page]);

    useEffect(() => {
        const debounce = setTimeout(fetchClients, 300);
        return () => clearTimeout(debounce);
    }, [fetchClients]);

    const handleCreate = async (data: CreateClientDto) => {
        setSaving(true);
        try {
            await createClient(data);
            toast.success("Cliente creado exitosamente");
            setShowCreateDialog(false);
            fetchClients();
        } catch (error) {
            toast.error("Error al crear cliente", {
                description: error instanceof Error ? error.message : "Error desconocido",
            });
        } finally {
            setSaving(false);
        }
    };

    const handleUpdate = async (data: CreateClientDto) => {
        if (!editingClient) return;
        setSaving(true);
        try {
            await updateClient(editingClient.id, data);
            toast.success("Cliente actualizado exitosamente");
            setEditingClient(null);
            fetchClients();
        } catch (error) {
            toast.error("Error al actualizar cliente", {
                description: error instanceof Error ? error.message : "Error desconocido",
            });
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!deletingClient) return;
        setSaving(true);
        try {
            await deleteClient(deletingClient.id);
            toast.success("Cliente eliminado");
            setDeletingClient(null);
            fetchClients();
        } catch (error) {
            toast.error("Error al eliminar cliente", {
                description: error instanceof Error ? error.message : "Error desconocido",
            });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1
                        className="text-3xl font-bold tracking-tight"
                        style={{ fontFamily: "var(--font-display)" }}
                    >
                        Clientes
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        {total} clientes registrados
                    </p>
                </div>
                <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Nuevo Cliente
                </Button>
            </div>

            {/* Search */}
            <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Buscar por nombre, empresa o email..."
                    value={search}
                    onChange={(e) => {
                        setSearch(e.target.value);
                        setPage(1);
                    }}
                    className="pl-10"
                />
            </div>

            {/* Client list */}
            {loading ? (
                <div className="space-y-3">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <Skeleton key={i} className="h-20 rounded-xl" />
                    ))}
                </div>
            ) : clients.length === 0 ? (
                <Card>
                    <CardContent className="py-16 text-center">
                        <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                        <h3 className="text-lg font-medium mb-1">
                            {search ? "No se encontraron clientes" : "Sin clientes aún"}
                        </h3>
                        <p className="text-sm text-muted-foreground mb-4">
                            {search
                                ? "Prueba con otro término de búsqueda"
                                : "Crea tu primer cliente o agrega uno al crear una reunión"}
                        </p>
                        {!search && (
                            <Button onClick={() => setShowCreateDialog(true)} variant="soft">
                                <Plus className="h-4 w-4" />
                                Crear Cliente
                            </Button>
                        )}
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-3">
                    {clients.map((client) => (
                        <Card key={client.id} className="hover:border-brand-200 transition-colors">
                            <CardContent className="p-4 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-11 h-11 rounded-full bg-brand-100 flex items-center justify-center text-sm font-semibold text-brand-700 shrink-0">
                                        {client.full_name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="min-w-0">
                                        <Link
                                            href={`/clients/${client.id}`}
                                            className="text-sm font-semibold hover:text-brand-500 transition-colors"
                                        >
                                            {client.full_name}
                                        </Link>
                                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-muted-foreground">
                                            {client.company && (
                                                <span className="flex items-center gap-1">
                                                    <Building2 className="h-3 w-3" />
                                                    {client.company}
                                                </span>
                                            )}
                                            <span className="flex items-center gap-1">
                                                <Mail className="h-3 w-3" />
                                                {client.email}
                                            </span>
                                            {client.phone && (
                                                <span className="flex items-center gap-1">
                                                    <Phone className="h-3 w-3" />
                                                    {client.phone}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => setEditingClient(client)}
                                    >
                                        <Pencil className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => setDeletingClient(client)}
                                        className="text-destructive hover:text-destructive"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm text-muted-foreground px-3">
                        Página {page} de {totalPages}
                    </span>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            )}

            {/* Create/Edit Dialog */}
            <ClientFormDialog
                open={showCreateDialog || !!editingClient}
                onOpenChange={(open) => {
                    if (!open) {
                        setShowCreateDialog(false);
                        setEditingClient(null);
                    }
                }}
                client={editingClient}
                onSubmit={editingClient ? handleUpdate : handleCreate}
                saving={saving}
            />

            {/* Delete Dialog */}
            <Dialog
                open={!!deletingClient}
                onOpenChange={(open) => !open && setDeletingClient(null)}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Eliminar Cliente</DialogTitle>
                        <DialogDescription>
                            ¿Estás seguro de que deseas eliminar a{" "}
                            <strong>{deletingClient?.full_name}</strong>? Se eliminarán también
                            todos los eventos asociados. Esta acción no se puede deshacer.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeletingClient(null)}>
                            Cancelar
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDelete}
                            disabled={saving}
                        >
                            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                            Eliminar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

function ClientFormDialog({
    open,
    onOpenChange,
    client,
    onSubmit,
    saving,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    client: IClient | null;
    onSubmit: (data: CreateClientDto) => void;
    saving: boolean;
}) {
    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
    } = useForm<CreateClientDto>({
        resolver: zodResolver(createClientSchema),
        values: client
            ? {
                full_name: client.full_name,
                company: client.company ?? "",
                email: client.email,
                phone: client.phone ?? "",
                notes: client.notes ?? "",
            }
            : undefined,
    });

    useEffect(() => {
        if (!open) reset();
    }, [open, reset]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        {client ? "Editar Cliente" : "Nuevo Cliente"}
                    </DialogTitle>
                    <DialogDescription>
                        {client
                            ? "Actualiza los datos del cliente"
                            : "Completa los datos para crear un nuevo cliente"}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="full_name">Nombre completo *</Label>
                            <Input id="full_name" {...register("full_name")} />
                            {errors.full_name && (
                                <p className="text-xs text-destructive">{errors.full_name.message}</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="company">Empresa</Label>
                            <Input id="company" {...register("company")} />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Correo electrónico *</Label>
                            <Input id="email" type="email" {...register("email")} />
                            {errors.email && (
                                <p className="text-xs text-destructive">{errors.email.message}</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phone">Teléfono</Label>
                            <Input id="phone" {...register("phone")} />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="notes">Notas</Label>
                        <Textarea id="notes" rows={3} {...register("notes")} />
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={saving}>
                            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                            {client ? "Guardar cambios" : "Crear Cliente"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
