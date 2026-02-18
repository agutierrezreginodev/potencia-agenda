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
    const sections: Record<string, string> = {};
    const regex = /## (.*?)\n([\s\S]*?)(?=## |$)/g;
    let match;
    while ((match = regex.exec(text)) !== null) {
        sections[match[1].trim()] = match[2].trim();
    }

    // Helper to find key with partial match
    const findContent = (keyPart: string) => {
        const key = Object.keys(sections).find(k => k.toLowerCase().includes(keyPart.toLowerCase())) || "";
        return sections[key] || "";
    };

    return {
        executive_summary: sections["Resumen Ejecutivo"] || "Resumen no disponible.",
        request_analysis: sections["Caso de Uso Específico"] || sections["Análisis de la Solicitud"] || "Análisis no disponible.",
        recommended_techs: (findContent("Herramientas de IA") || findContent("Tecnologías Recomendadas"))
            .split("\n")
            .filter(l => l.trim().startsWith("*") || l.trim().startsWith("-"))
            .map(l => {
                const clean = l.replace(/^[\*\-] /, "").trim();
                const splitIndex = clean.search(/[:\-]/);
                let name = "Tecnología";
                let description = clean;
                let use_case = "";

                if (splitIndex !== -1) {
                    name = clean.substring(0, splitIndex).replace(/\*\*/g, "").trim();
                    const rest = clean.substring(splitIndex + 1).trim();
                    description = rest;
                }
                return { name, description, use_case };
            })
            .slice(0, 6),
        architecture: {
            description: (findContent("Arquitectura") || "").split("\n")[0] || "",
            components: (findContent("Arquitectura") || "")
                .split("\n")
                .filter(l => l.trim().startsWith("*") || l.trim().startsWith("-"))
                .map(l => l.replace(/^[\*\-] /, "").trim())
                .slice(0, 8),
            data_flow: ""
        },
        implementation_steps: (() => {
            const raw = findContent("Paso a Paso") || findContent("Pasos de Implementación");
            const steps: any[] = [];
            const lines = raw.split("\n");
            let currentStep: any = null;

            for (const line of lines) {
                // Matches format: 1. **[Tool] Title (Duration)**
                const stepMatch = line.trim().match(/^(\d+)[\.)]\s*\*\*(?:\[(.*?)\]\s*)?([^\(]*)(?:\((.*?)\))?\*\*/);

                if (stepMatch) {
                    if (currentStep) steps.push(currentStep);
                    currentStep = {
                        step: parseInt(stepMatch[1]),
                        tool: stepMatch[2]?.trim() || "General",
                        title: stepMatch[3]?.trim() || `Paso ${stepMatch[1]}`,
                        estimated_duration: stepMatch[4]?.trim() || "Variable",
                        description: "",
                        resources: []
                    };
                } else if (currentStep && line.trim()) {
                    currentStep.description += (currentStep.description ? "\n" : "") + line.trim();
                }
            }
            if (currentStep) steps.push(currentStep);

            // Fallback for legacy format
            if (steps.length === 0) {
                return lines
                    .filter(l => /^\d+[\.)]/.test(l.trim()))
                    .map((l, i) => {
                        const clean = l.replace(/^\d+[\.)] /, "").trim();
                        const splitIndex = clean.indexOf(":");
                        return {
                            step: i + 1,
                            title: splitIndex !== -1 ? clean.substring(0, splitIndex).replace(/\*\*/g, "").trim() : `Paso ${i + 1}`,
                            description: splitIndex !== -1 ? clean.substring(splitIndex + 1).trim() : clean,
                            estimated_duration: "Variable",
                            resources: [],
                            tool: "General"
                        };
                    })
                    .slice(0, 12);
            }

            return steps.slice(0, 12);
        })(),
        estimated_costs: findContent("Costos Estimados") || "Costos no disponibles.",
        risks_and_challenges: (findContent("Riesgos") || "")
            .split("\n")
            .filter(l => l.trim().startsWith("*") || l.trim().startsWith("-"))
            .map(l => {
                const clean = l.replace(/^[\*\-] /, "").trim();
                const splitIndex = clean.indexOf(":");
                return {
                    risk: splitIndex !== -1 ? clean.substring(0, splitIndex).replace(/\*\*/g, "") : "Riesgo",
                    level: clean.toLowerCase().includes("alto") ? "alto" : clean.toLowerCase().includes("bajo") ? "bajo" : "medio",
                    mitigation: splitIndex !== -1 ? clean.substring(splitIndex + 1).trim() : clean
                };
            })
            .slice(0, 5),
        next_steps: (findContent("Casos de Uso Adicionales") || findContent("Próximos Pasos"))
            .split("\n")
            .filter(l => l.trim().startsWith("*") || l.trim().startsWith("-"))
            .map(l => l.replace(/^[\*\-] /, "").trim())
            .slice(0, 5),
        estimated_timeline: sections["Cronograma Estimado"] || "Consultar detalles en pasos.",
        success_metrics: (findContent("Indicadores") || findContent("Métricas"))
            .split("\n")
            .filter(l => l.trim().startsWith("*") || l.trim().startsWith("-"))
            .map(l => l.replace(/^[\*\-] /, "").trim())
            .slice(0, 5),
        out_of_scope: text.includes("OUT_OF_SCOPE")
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

        const apiKey = process.env.GOOGLE_API_KEY;
        const modelName = process.env.GOOGLE_AI_MODEL ?? "gemini-3-flash-preview";

        if (!apiKey) {
            return NextResponse.json(
                { error: "API Key de Google AI no configurada" },
                { status: 500 }
            );
        }

        const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

        const systemInstruction = {
            role: "user",
            parts: [{ text: SYSTEM_PROMPT }]
        };

        const userMessage = {
            role: "user",
            parts: [{ text: `Solicitud del cliente:\n\n${clientRequest}` }]
        };

        // Call Google Gemini API
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 60000); // Increased timeout

        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                contents: [systemInstruction, userMessage],
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 8192,
                }
            }),
            signal: controller.signal,
        });

        clearTimeout(timeout);

        if (!response.ok) {
            const errorText = await response.text();
            let errorMessage = `Google AI error: ${response.status}`;

            try {
                const errorJson = JSON.parse(errorText);
                if (errorJson.error) {
                    // Extract cleaner message
                    const msg = errorJson.error.message;
                    if (msg.includes("not found") || response.status === 404) {
                        errorMessage = "Modelo no encontrado o región no soportada. Verifica tu API Key.";
                    } else if (response.status === 400 && msg.includes("API key")) {
                        errorMessage = "API Key inválida o expirada.";
                    } else if (response.status === 429) {
                        errorMessage = "Límite de cuota excedido. Intenta más tarde.";
                    } else {
                        errorMessage = `Error de IA: ${msg}`;
                    }
                }
            } catch {
                // Keep default message if parsing fails
            }

            throw new Error(errorMessage);
        }

        const result = await response.json();
        const content = result.candidates?.[0]?.content?.parts?.[0]?.text;
        const usage = result.usageMetadata;

        if (!content) {
            throw new Error("No se recibió respuesta del modelo de IA");
        }

        console.log("--- GEMINI MARKDOWN CONTENT ---");
        console.log(content);
        console.log("-------------------------------");

        // Parse the Markdown response
        const guide = parseMarkdownGuide(content);

        // Check if out of scope
        if (guide.out_of_scope) {
            return NextResponse.json({
                guide: null,
                outOfScope: true,
                message: guide.message,
                model: modelName,
                tokens: (usage?.promptTokenCount ?? 0) + (usage?.candidatesTokenCount ?? 0),
                latencyMs: Date.now() - startTime,
            });
        }

        const latencyMs = Date.now() - startTime;

        // Log the generation
        await supabase.from("ai_generation_logs").insert({
            user_id: user.id,
            model: modelName,
            prompt_tokens: usage?.promptTokenCount ?? 0,
            completion_tokens: usage?.candidatesTokenCount ?? 0,
            status: "success",
            latency_ms: latencyMs,
        });

        return NextResponse.json({
            guide,
            model: modelName,
            tokens: (usage?.promptTokenCount ?? 0) + (usage?.candidatesTokenCount ?? 0),
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
                    model: process.env.GOOGLE_AI_MODEL ?? "unknown",
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
