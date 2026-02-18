import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { AlertTriangle, CheckCircle2, ChevronRight } from "lucide-react";
import type { IAiGuide } from "@/core/domain/models/event";

export function AiGuidePreview({ guide }: { guide: IAiGuide }) {
    if (guide.out_of_scope) {
        return (
            <div className="p-4 rounded-lg bg-orange-50 border border-orange-200 mt-4 animate-fade-up">
                <div className="flex items-center gap-2 text-orange-700 font-medium mb-2">
                    <AlertTriangle className="h-5 w-5" />
                    <span>Solicitud Fuera de Alcance</span>
                </div>
                <p className="text-sm text-orange-600 leading-relaxed">
                    {guide.message || guide.markdown || "La solicitud excede las capacidades actuales del sistema."}
                </p>
            </div>
        );
    }

    if (!guide.markdown && !guide.executive_summary) {
        return null;
    }

    // Fallback for legacy data if markdown is missing but executive_summary exists
    if (!guide.markdown && guide.executive_summary) {
        return (
            <div className="p-4 rounded-lg border bg-surface text-sm text-muted-foreground mt-4">
                <p>Formato de guía antiguo. Por favor regenera la guía para ver el formato actualizado.</p>
            </div>
        );
    }

    return (
        <div className="mt-6 animate-fade-up">
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                    h2: ({ node, ...props }) => (
                        <h2 className="text-xl font-display font-bold text-foreground mt-8 mb-4 flex items-center gap-2 border-b border-border pb-2" {...props} />
                    ),
                    h3: ({ node, ...props }) => (
                        <h3 className="text-lg font-semibold text-foreground mt-6 mb-3" {...props} />
                    ),
                    p: ({ node, ...props }) => (
                        <p className="text-sm text-muted-foreground leading-relaxed mb-4" {...props} />
                    ),
                    ul: ({ node, ...props }) => (
                        <ul className="space-y-2 mb-4 list-none pl-1" {...props} />
                    ),
                    ol: ({ node, ...props }) => (
                        <ol className="space-y-2 mb-4 list-decimal pl-5 text-sm text-muted-foreground marker:font-medium marker:text-foreground" {...props} />
                    ),
                    li: ({ node, ...props }) => {
                        const parent = (node as any)?.parent;
                        if (parent?.tagName === 'ul') {
                            return (
                                <li className="text-sm text-muted-foreground pl-0 flex gap-2 items-start" {...props}>
                                    <span className="mt-2 h-1.5 w-1.5 rounded-full bg-brand-500 shrink-0" />
                                    <span>{props.children}</span>
                                </li>
                            );
                        }
                        return <li className="pl-1 text-sm text-muted-foreground" {...props} />;
                    },
                    strong: ({ node, ...props }) => (
                        <strong className="font-semibold text-foreground" {...props} />
                    ),
                    table: ({ node, ...props }) => (
                        <div className="my-6 w-full overflow-y-auto rounded-lg border bg-surface">
                            <table className="w-full text-sm" {...props} />
                        </div>
                    ),
                    thead: ({ node, ...props }) => (
                        <thead className="bg-muted/50 text-left font-medium text-foreground" {...props} />
                    ),
                    tbody: ({ node, ...props }) => (
                        <tbody className="divide-y divide-border bg-card" {...props} />
                    ),
                    tr: ({ node, ...props }) => (
                        <tr className="transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted" {...props} />
                    ),
                    th: ({ node, ...props }) => (
                        <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0" {...props} />
                    ),
                    td: ({ node, ...props }) => (
                        <td className="p-4 align-middle [&:has([role=checkbox])]:pr-0 leading-relaxed text-muted-foreground" {...props} />
                    ),
                    blockquote: ({ node, ...props }) => (
                        <blockquote className="mt-6 border-l-2 border-brand-500 pl-6 italic text-muted-foreground" {...props} />
                    ),
                }}
            >
                {guide.markdown}
            </ReactMarkdown>
        </div>
    );
}
