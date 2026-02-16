"use server";

import { createServerSupabaseClient } from "@/infrastructure/supabase/server";
import { createEventSchema, type CreateEventDto } from "@/core/domain/models/event";

export async function getEvents(params?: {
    startDate?: string;
    endDate?: string;
    clientId?: string;
    isDraft?: boolean;
}) {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("No autenticado");

    let query = supabase
        .from("events")
        .select("*, clients(id, full_name, company, email, phone)")
        .eq("user_id", user.id);

    if (params?.startDate) {
        query = query.gte("start_at", params.startDate);
    }
    if (params?.endDate) {
        query = query.lte("start_at", params.endDate);
    }
    if (params?.clientId) {
        query = query.eq("client_id", params.clientId);
    }
    if (params?.isDraft !== undefined) {
        query = query.eq("is_draft", params.isDraft);
    }

    query = query.order("start_at", { ascending: true });

    const { data, error } = await query;
    if (error) throw new Error(error.message);

    return data ?? [];
}

export async function getEvent(id: string) {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("No autenticado");

    const { data, error } = await supabase
        .from("events")
        .select("*, clients(id, full_name, company, email, phone)")
        .eq("id", id)
        .eq("user_id", user.id)
        .single();

    if (error) throw new Error(error.message);
    return data;
}

export async function createEvent(
    input: CreateEventDto,
    aiGuide: Record<string, unknown> | null,
    aiStatus: string,
    aiModel: string | null,
    aiTokens: number | null,
    isDraft: boolean
) {
    const parsed = createEventSchema.safeParse(input);
    if (!parsed.success) {
        throw new Error(parsed.error.issues.map((i) => i.message).join(", "));
    }

    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("No autenticado");

    // Auto-create or find client
    let clientId: string;

    const { data: existingClient } = await supabase
        .from("clients")
        .select("id")
        .eq("user_id", user.id)
        .eq("email", parsed.data.client_email)
        .maybeSingle();

    if (existingClient) {
        clientId = existingClient.id;
    } else {
        const { data: newClient, error: clientError } = await supabase
            .from("clients")
            .insert({
                user_id: user.id,
                full_name: parsed.data.client_name,
                company: parsed.data.client_company || null,
                email: parsed.data.client_email,
                phone: parsed.data.client_phone || null,
            })
            .select("id")
            .single();

        if (clientError) throw new Error(clientError.message);
        clientId = newClient.id;
    }

    // Create event
    const startAt = `${parsed.data.start_date}T${parsed.data.start_time}:00`;

    const { data, error } = await supabase
        .from("events")
        .insert({
            user_id: user.id,
            client_id: clientId,
            title: parsed.data.title,
            start_at: startAt,
            duration_min: parsed.data.duration_min,
            request: parsed.data.request,
            ai_guide: aiGuide,
            ai_status: aiStatus,
            ai_model: aiModel,
            ai_tokens: aiTokens,
            notes: parsed.data.notes || null,
            is_draft: isDraft,
        })
        .select("*, clients(id, full_name, company, email, phone)")
        .single();

    if (error) throw new Error(error.message);
    return data;
}

export async function updateEvent(
    id: string,
    updates: Record<string, unknown>
) {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("No autenticado");

    const { data, error } = await supabase
        .from("events")
        .update(updates)
        .eq("id", id)
        .eq("user_id", user.id)
        .select("*, clients(id, full_name, company, email, phone)")
        .single();

    if (error) throw new Error(error.message);
    return data;
}

export async function deleteEvent(id: string) {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("No autenticado");

    const { error } = await supabase
        .from("events")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

    if (error) throw new Error(error.message);
}

export async function confirmDraft(id: string) {
    return updateEvent(id, { is_draft: false });
}

export async function getDashboardMetrics() {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("No autenticado");

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();

    // Total clients
    const { count: totalClients } = await supabase
        .from("clients")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);

    // Meetings this month
    const { count: meetingsThisMonth } = await supabase
        .from("events")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("is_draft", false)
        .gte("start_at", startOfMonth)
        .lte("start_at", endOfMonth);

    // Pending drafts
    const { count: pendingDrafts } = await supabase
        .from("events")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("is_draft", true);

    // Total guides generated
    const { count: totalGuides } = await supabase
        .from("events")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("ai_status", "success");

    // Recent clients
    const { data: recentClients } = await supabase
        .from("clients")
        .select("id, full_name, company, email, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5);

    // Upcoming events
    const { data: upcomingEvents } = await supabase
        .from("events")
        .select("id, title, start_at, duration_min, ai_status, clients(id, full_name, company)")
        .eq("user_id", user.id)
        .eq("is_draft", false)
        .gte("start_at", now.toISOString())
        .order("start_at", { ascending: true })
        .limit(3);

    // Weekly activity (events per day of week in current month)
    const { data: monthEvents } = await supabase
        .from("events")
        .select("start_at")
        .eq("user_id", user.id)
        .eq("is_draft", false)
        .gte("start_at", startOfMonth)
        .lte("start_at", endOfMonth);

    const weeklyActivity = [0, 0, 0, 0, 0, 0, 0]; // Sun-Sat
    monthEvents?.forEach((event) => {
        const day = new Date(event.start_at).getDay();
        weeklyActivity[day]++;
    });

    return {
        totalClients: totalClients ?? 0,
        meetingsThisMonth: meetingsThisMonth ?? 0,
        pendingDrafts: pendingDrafts ?? 0,
        totalGuides: totalGuides ?? 0,
        recentClients: recentClients ?? [],
        upcomingEvents: (upcomingEvents ?? []).map((event) => ({
            ...event,
            clients: Array.isArray(event.clients) ? event.clients[0] ?? null : event.clients,
        })),
        weeklyActivity,
    };
}
