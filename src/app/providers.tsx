"use client";


import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/presentation/components/providers/theme-provider";


export function Providers({ children }: { children: ReactNode }) {
    const [queryClient] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        staleTime: 60 * 1000, // 1 minute
                        retry: 1,
                    },
                },
            })
    );

    return (
        <QueryClientProvider client={queryClient}>
            <ThemeProvider
                attribute="class"
                defaultTheme="system"
                enableSystem
                disableTransitionOnChange
            >
                {children}
                <Toaster
                    position="top-right"
                    richColors
                    closeButton
                    toastOptions={{
                        style: {
                            fontFamily: "var(--font-sans)",
                        },
                    }}
                />
            </ThemeProvider>
        </QueryClientProvider>
    );
}
