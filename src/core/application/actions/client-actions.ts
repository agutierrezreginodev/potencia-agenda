"use server";

import { createServerSupabaseClient } from "@/infrastructure/supabase/server";
import { createClientSchema, updateClientSchema, type CreateClientDto, type UpdateClientDto } from "@/core/domain/models/client";

export async function getClients(params?: {
    search?: string;
    page?: number;
    pageSize?: number;
    orderBy?: string;
    orderDir?: "asc" | "desc";
}) {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("No autenticado");

    const page = params?.page ?? 1;
    const pageSize = params?.pageSize ?? 10;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
        .from("clients")
        .select("*, events(count)", { count: "exact" })
        .eq("user_id", user.id);

    if (params?.search) {
        query = query.or(
            `full_name.ilike.%${params.search}%,company.ilike.%${params.search}%,email.ilike.%${params.search}%`
        );
    }

    const orderBy = params?.orderBy ?? "created_at";
    const orderDir = params?.orderDir ?? "desc";
    query = query.order(orderBy, { ascending: orderDir === "asc" });
    query = query.range(from, to);

    const { data, error, count } = await query;
    if (error) throw new Error(error.message);

    return {
        clients: data ?? [],
        total: count ?? 0,
        page,
        pageSize,
        totalPages: Math.ceil((count ?? 0) / pageSize),
    };
}

export async function getClient(id: string) {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("No autenticado");

    const { data, error } = await supabase
        .from("clients")
        .select("*")
        .eq("id", id)
        .eq("user_id", user.id)
        .single();

    if (error) throw new Error(error.message);
    return data;
}

export async function getClientEvents(clientId: string) {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("No autenticado");

    const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("client_id", clientId)
        .eq("user_id", user.id)
        .order("start_at", { ascending: false });

    if (error) throw new Error(error.message);
    return data ?? [];
}

export async function createClient(input: CreateClientDto) {
    const parsed = createClientSchema.safeParse(input);
    if (!parsed.success) {
        throw new Error(parsed.error.issues.map((i) => i.message).join(", "));
    }

    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("No autenticado");

    const { data, error } = await supabase
        .from("clients")
        .insert({
            user_id: user.id,
            full_name: parsed.data.full_name,
            company: parsed.data.company || null,
            email: parsed.data.email,
            phone: parsed.data.phone || null,
            notes: parsed.data.notes || null,
        })
        .select()
        .single();

    if (error) {
        if (error.code === "23505") {
            throw new Error("Ya existe un cliente con ese correo electrónico.");
        }
        throw new Error(error.message);
    }

    return data;
}

export async function updateClient(id: string, input: UpdateClientDto) {
    const parsed = updateClientSchema.safeParse(input);
    if (!parsed.success) {
        throw new Error(parsed.error.issues.map((i) => i.message).join(", "));
    }

    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("No autenticado");

    const updateData: Record<string, unknown> = {};
    if (parsed.data.full_name !== undefined) updateData.full_name = parsed.data.full_name;
    if (parsed.data.company !== undefined) updateData.company = parsed.data.company || null;
    if (parsed.data.email !== undefined) updateData.email = parsed.data.email;
    if (parsed.data.phone !== undefined) updateData.phone = parsed.data.phone || null;
    if (parsed.data.notes !== undefined) updateData.notes = parsed.data.notes || null;

    const { data, error } = await supabase
        .from("clients")
        .update(updateData)
        .eq("id", id)
        .eq("user_id", user.id)
        .select()
        .single();

    if (error) throw new Error(error.message);
    return data;
}

export async function deleteClient(id: string) {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("No autenticado");

    // Check for associated events
    const { count } = await supabase
        .from("events")
        .select("*", { count: "exact", head: true })
        .eq("client_id", id)
        .eq("user_id", user.id);

    if (count && count > 0) {
        // Delete associated events first
        await supabase.from("events").delete().eq("client_id", id).eq("user_id", user.id);
    }

    const { error } = await supabase
        .from("clients")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

    if (error) throw new Error(error.message);
}

export async function searchClientByEmail(email: string) {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("No autenticado");

    const { data } = await supabase
        .from("clients")
        .select("id, full_name, company, email, phone")
        .eq("user_id", user.id)
        .eq("email", email)
        .maybeSingle();

    return data;
}
