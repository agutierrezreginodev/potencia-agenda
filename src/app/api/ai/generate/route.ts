import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/infrastructure/supabase/server";

const SYSTEM_PROMPT = `Eres un consultor Senior en Implementación de Inteligencia Artificial Generativa enfocada en soluciones rápidas, prácticas y de bajo costo.

ALCANCE:
Tu objetivo es generar una GUÍA DE IMPLEMENTACIÓN ALTAMENTE PRÁCTICA que pueda ejecutarse en 2 HORAS O MENOS utilizando EXCLUSIVAMENTE herramientas no-code o low-code como:

- ChatGPT
- Claude
- NotebookLM
- Canva AI
- Gemini
- Microsoft Copilot
- Perplexity
- O herramientas equivalentes basadas en IA generativa

Si la solicitud coloca de manera explicita que utilices una sola herramienta, genera la guía de implementación utilizando únicamente esa herramienta.

NO se permite:
- Desarrollo de software
- Backend personalizado
- APIs
- Bases de datos
- Infraestructura cloud
- Programación
- Automatizaciones complejas

Si la solicitud implica desarrollo técnico avanzado, automatizaciones, integraciones con sistemas internos o arquitectura tecnológica personalizada, responde únicamente:

OUT_OF_SCOPE  
Este caso requiere desarrollo técnico o automatización estructural.  
Debe escalarse como proyecto tecnológico formal con equipo de desarrollo, arquitectura definida y evaluación de infraestructura.

No agregues contenido adicional fuera de esa respuesta en ese escenario.

RESPONDE ÚNICAMENTE en formato MARKDOWN con estos encabezados EXACTOS:

---

## Resumen Ejecutivo
(1 párrafo enfocado en impacto inmediato, rapidez de implementación y retorno en menos de 30 días)

## Caso de Uso Específico
(Define claramente el problema operativo o de negocio que se resolverá en máximo 2 horas de implementación)

## Herramientas de IA a Utilizar
(Mínimo 3 herramientas concretas y por qué se usan en esta solución específica)
* **Nombre de la herramienta**: Rol exacto dentro del flujo de trabajo y por qué es suficiente sin necesidad de desarrollo técnico.
* **Otra herramienta**: ...

## Arquitectura Simplificada (No Técnica)
(Describe el flujo paso a paso SIN términos técnicos complejos)
Ejemplo:
Usuario → Prompt estructurado → IA → Revisión humana → Entrega final

Explica cómo fluye la información entre herramientas.

## Paso a Paso de Implementación (2 Horas o Menos)
(Esta es la sección más importante. Debe ser extremadamente accionable)

Divide por bloques de tiempo reales.

FORMATO OBLIGATORIO PARA CADA PASO:
1. **[HERRAMIENTA] TÍTULO DEL PASO (DURACIÓN)**
   Descripción detallada y accionable del paso.
   (Incluye configuración, prompts, y acciones específicas)

Ejemplo:
1. **[ChatGPT] Preparación de Entorno (Minuto 0-15)**
   Configura una nueva conversación en ChatGPT. Copia y pega el prompt de contexto proporcionado en la sección de plantillas...

4. **[Canva] Diseño Final (Minuto 100-120)**
   Exporta el contenido y abre Canva...

## Plantillas Clave
(Incluye ejemplos de prompts estructurados listos para copiar y pegar)

## Costos Estimados (USD)
(Solo suscripciones de herramientas, cero infraestructura técnica)
* Plan gratuito viable: Qué limitaciones tendría
* Plan recomendado: Rango mensual estimado

## Riesgos y Limitaciones
* Dependencia de calidad de prompts
* Riesgo de errores de la IA
* Cómo mitigarlo sin tecnología adicional

## Casos de Uso Adicionales que se pueden crear con la misma estructura
(Mínimo 3 extensiones posibles reutilizando el mismo sistema)

## Indicadores de Impacto Rápido
(KPIs simples medibles en 7-30 días)
* Reducción de tiempo en %
* Aumento de productividad
* Reducción de costos operativos

REGLAS CRÍTICAS:

1. SOLO herramientas IA listas para usar.
2. Implementable por un equipo administrativo sin conocimientos técnicos.
3. Enfoque práctico y accionable, no teórico.
4. No mencionar APIs, servidores, bases de datos ni código.
5. La solución debe poder ejecutarse completamente en 2 horas o menos.
6. Markdown limpio sin bloques de código.`;

function parseMarkdownGuide(text: string): any {
    const out_of_scope = text.includes("OUT_OF_SCOPE");
    return {
        markdown: text,
        out_of_scope,
        message: out_of_scope ? text : undefined
    };
}

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

        const apiKey = process.env.GROQ_API_KEY;
        const modelName = process.env.GROQ_MODEL ?? "openai/gpt-oss-120b";

        if (!apiKey) {
            return NextResponse.json(
                { error: "API Key de Groq no configurada" },
                { status: 500 }
            );
        }

        const url = "https://api.groq.com/openai/v1/chat/completions";

        // Call Groq API
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 300000); // 5 minutes timeout

        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: modelName,
                messages: [
                    { role: "system", content: SYSTEM_PROMPT },
                    { role: "user", content: `Solicitud del cliente:\n\n${clientRequest}` }
                ],
                temperature: 0.7,
                max_tokens: 8192,
            }),
            signal: controller.signal,
        });

        clearTimeout(timeout);

        if (!response.ok) {
            const errorText = await response.text();
            let errorMessage = `Groq API error: ${response.status}`;

            try {
                const errorJson = JSON.parse(errorText);
                if (errorJson.error) {
                    const msg = errorJson.error.message;
                    if (response.status === 401) {
                        errorMessage = "API Key inválida o expirada.";
                    } else if (response.status === 429) {
                        errorMessage = "Límite de cuota excedido. Intenta más tarde.";
                    } else if (msg) {
                        errorMessage = `Error de IA: ${msg}`;
                    }
                }
            } catch {
                // Keep default message if parsing fails
            }

            throw new Error(errorMessage);
        }

        const result = await response.json();
        const content = result.choices?.[0]?.message?.content;
        const usage = result.usage;

        if (!content) {
            throw new Error("No se recibió respuesta del modelo de IA");
        }

        console.log("--- GROQ MARKDOWN CONTENT ---");
        console.log(content);
        console.log("-----------------------------");

        // Parse the Markdown response
        const guide = parseMarkdownGuide(content);

        // Check if out of scope
        if (guide.out_of_scope) {
            return NextResponse.json({
                guide: null,
                outOfScope: true,
                message: guide.message,
                model: modelName,
                tokens: (usage?.prompt_tokens ?? 0) + (usage?.completion_tokens ?? 0),
                latencyMs: Date.now() - startTime,
            });
        }

        const latencyMs = Date.now() - startTime;

        // Log the generation
        await supabase.from("ai_generation_logs").insert({
            user_id: user.id,
            model: modelName,
            prompt_tokens: usage?.prompt_tokens ?? 0,
            completion_tokens: usage?.completion_tokens ?? 0,
            status: "success",
            latency_ms: latencyMs,
        });

        return NextResponse.json({
            guide,
            model: modelName,
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
                    model: process.env.GROQ_MODEL ?? "unknown",
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
