import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/infrastructure/supabase/server";

const SYSTEM_PROMPT = `Eres un experto consultor en Inteligencia Artificial Generativa con más de 10 años de experiencia implementando soluciones GenAI en empresas de diversos sectores.

ALCANCE: Solo proporcionas guías de implementación de IA Generativa (LLMs, RAG, fine-tuning, embeddings, chatbots, generación de contenido, procesamiento de documentos con IA, asistentes virtuales).
NO cubres automatizaciones RPA, diseño de apps, desarrollo web general ni infraestructura no relacionada con GenAI.

Si la solicitud está fuera de tu alcance, responde con un JSON que tenga "out_of_scope": true y un campo "message" explicando por qué.

RESPONDE ÚNICAMENTE en formato JSON válido con la siguiente estructura (sin markdown, sin backticks, solo JSON puro):

{
  "executive_summary": "Resumen ejecutivo en 2-3 párrafos sobre la implementación propuesta",
  "request_analysis": "Análisis de la solicitud: qué quiere lograr el cliente y por qué GenAI es la solución",
  "recommended_techs": [
    { "name": "Tecnología", "description": "Descripción breve", "use_case": "Caso de uso específico" }
  ],
  "architecture": {
    "description": "Descripción de la arquitectura sugerida",
    "components": ["Componente 1", "Componente 2"],
    "data_flow": "Descripción del flujo de datos"
  },
  "implementation_steps": [
    { "step": 1, "title": "Título del paso", "description": "Descripción detallada", "estimated_duration": "X semanas", "resources": ["Recurso 1"] }
  ],
  "estimated_costs": {
    "setup": { "min": 0, "max": 0 },
    "monthly": { "min": 0, "max": 0 },
    "annual": { "min": 0, "max": 0 }
  },
  "risks_and_challenges": [
    { "risk": "Descripción del riesgo", "level": "alto|medio|bajo", "mitigation": "Estrategia de mitigación" }
  ],
  "next_steps": ["Paso inmediato 1", "Paso inmediato 2"],
  "estimated_timeline": "X semanas/meses total",
  "success_metrics": ["KPI 1", "KPI 2"]
}

Responde en el mismo idioma en que se redacta la solicitud.`;

export async function POST(request: Request) {
    const startTime = Date.now();

    try {
        // Auth check
        const supabase = await createServerSupabaseClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: "No autenticado" }, { status: 401 });
        }

        const { clientRequest } = await request.json();
        if (!clientRequest || clientRequest.length < 20) {
            return NextResponse.json(
                { error: "La solicitud debe tener al menos 20 caracteres" },
                { status: 400 }
            );
        }

        const apiKey = process.env.OPENROUTER_API_KEY;
        const baseUrl = process.env.OPENROUTER_BASE_URL ?? "https://openrouter.ai/api/v1";
        const model = process.env.OPENROUTER_MODEL ?? "qwen/qwen3-coder:free";

        if (!apiKey) {
            return NextResponse.json(
                { error: "API Key de OpenRouter no configurada" },
                { status: 500 }
            );
        }

        // Call OpenRouter
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 30000);

        const response = await fetch(`${baseUrl}/chat/completions`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${apiKey}`,
                "Content-Type": "application/json",
                "HTTP-Referer": "https://potencia-agenda.vercel.app",
                "X-Title": "PotencIA Agenda",
            },
            body: JSON.stringify({
                model,
                messages: [
                    { role: "system", content: SYSTEM_PROMPT },
                    {
                        role: "user",
                        content: `Solicitud del cliente:\n\n${clientRequest}`,
                    },
                ],
                temperature: 0.7,
                max_tokens: 4000,
                response_format: { type: "json_object" },
            }),
            signal: controller.signal,
        });

        clearTimeout(timeout);

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`OpenRouter error: ${response.status} — ${errorText}`);
        }

        const result = await response.json();
        const content = result.choices?.[0]?.message?.content;
        const usage = result.usage;

        if (!content) {
            throw new Error("No se recibió respuesta del modelo de IA");
        }

        // Parse the JSON response
        let guide;
        try {
            guide = JSON.parse(content);
        } catch {
            throw new Error("La respuesta del modelo no es JSON válido");
        }

        // Check if out of scope
        if (guide.out_of_scope) {
            return NextResponse.json({
                guide: null,
                outOfScope: true,
                message: guide.message,
                model,
                tokens: (usage?.prompt_tokens ?? 0) + (usage?.completion_tokens ?? 0),
                latencyMs: Date.now() - startTime,
            });
        }

        const latencyMs = Date.now() - startTime;

        // Log the generation
        await supabase.from("ai_generation_logs").insert({
            user_id: user.id,
            model,
            prompt_tokens: usage?.prompt_tokens ?? 0,
            completion_tokens: usage?.completion_tokens ?? 0,
            status: "success",
            latency_ms: latencyMs,
        });

        return NextResponse.json({
            guide,
            model,
            tokens: (usage?.prompt_tokens ?? 0) + (usage?.completion_tokens ?? 0),
            latencyMs,
        });
    } catch (error) {
        const latencyMs = Date.now() - startTime;
        const errorMsg = error instanceof Error ? error.message : "Error desconocido";

        // Log the error
        try {
            const supabase = await createServerSupabaseClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                await supabase.from("ai_generation_logs").insert({
                    user_id: user.id,
                    model: process.env.OPENROUTER_MODEL ?? "unknown",
                    prompt_tokens: 0,
                    completion_tokens: 0,
                    status: errorMsg.includes("abort") ? "timeout" : "error",
                    error_msg: errorMsg.slice(0, 500),
                    latency_ms: latencyMs,
                });
            }
        } catch {
            // Ignore logging errors
        }

        return NextResponse.json(
            { error: errorMsg },
            { status: 500 }
        );
    }
}
