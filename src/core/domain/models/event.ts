import { z } from "zod";

export interface IAiGuide {
    markdown?: string;
    out_of_scope?: boolean;
    message?: string;
    /** @deprecated Field from legacy format, kept for backward compatibility check */
    executive_summary?: string;
}

export type AiStatus = "pending" | "success" | "error";

export interface IEvent {
    id: string;
    user_id: string;
    client_id: string;
    title: string;
    start_at: string;
    duration_min: number;
    request: string;
    ai_guide: IAiGuide | null;
    ai_status: AiStatus;
    ai_model: string | null;
    ai_tokens: number | null;
    notes: string | null;
    is_draft: boolean;
    created_at: string;
    updated_at: string;
    // Virtual fields from joins
    client?: {
        id: string;
        full_name: string;
        company: string | null;
        email: string;
        phone: string | null;
    };
}

export const createEventSchema = z.object({
    client_name: z
        .string()
        .min(2, "El nombre del cliente debe tener al menos 2 caracteres"),
    client_company: z.string().optional().or(z.literal("")),
    client_email: z.string().email("El correo electrónico no es válido"),
    client_phone: z.string().optional().or(z.literal("")),
    title: z
        .string()
        .min(3, "El título debe tener al menos 3 caracteres")
        .max(150, "El título no puede exceder 150 caracteres"),
    start_date: z.string().min(1, "La fecha es requerida"),
    start_time: z.string().min(1, "La hora es requerida"),
    duration_min: z
        .number()
        .min(15, "La duración mínima es 15 minutos")
        .max(480, "La duración máxima es 8 horas"),
    request: z
        .string()
        .min(20, "La solicitud debe tener al menos 20 caracteres")
        .max(5000, "La solicitud no puede exceder 5000 caracteres"),
    notes: z.string().optional().or(z.literal("")),
});

export type CreateEventDto = z.infer<typeof createEventSchema>;
