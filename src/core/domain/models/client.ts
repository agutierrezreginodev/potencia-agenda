import { z } from "zod";

export interface IClient {
    id: string;
    user_id: string;
    full_name: string;
    company: string | null;
    email: string;
    phone: string | null;
    notes: string | null;
    created_at: string;
    updated_at: string;
    // Virtual fields from joins
    meetings_count?: number;
    last_meeting_date?: string | null;
}

export const createClientSchema = z.object({
    full_name: z
        .string()
        .min(2, "El nombre debe tener al menos 2 caracteres")
        .max(100, "El nombre no puede exceder 100 caracteres"),
    company: z
        .string()
        .max(100, "La empresa no puede exceder 100 caracteres")
        .optional()
        .or(z.literal("")),
    email: z.string().email("El correo electrónico no es válido"),
    phone: z
        .string()
        .max(20, "El teléfono no puede exceder 20 caracteres")
        .optional()
        .or(z.literal("")),
    notes: z
        .string()
        .max(500, "Las notas no pueden exceder 500 caracteres")
        .optional()
        .or(z.literal("")),
});

export const updateClientSchema = createClientSchema.partial();

export type CreateClientDto = z.infer<typeof createClientSchema>;
export type UpdateClientDto = z.infer<typeof updateClientSchema>;
