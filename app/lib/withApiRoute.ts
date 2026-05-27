import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

type ApiRouteHandler = (request: NextRequest, userId: string) => Promise<NextResponse> | NextResponse;

/**
 * Wrapper para Route Handlers de Next.js.
 * Maneja la extracción del userId, la validación de sesión y atrapa errores genéricos (500).
 */
export function withApiRoute(handler: ApiRouteHandler) {
    // Retornamos la firma estándar que espera Next.js para un Route Handler
    return async (request: NextRequest, context: any): Promise<NextResponse> => {
        try {
            const { userId } = await auth();
            
            if (!userId) {
                return NextResponse.json(
                    { error: "No autorizado. Inicia sesión para continuar." },
                    { status: 401 }
                );
            }

            // Ejecutamos la lógica de negocio inyectando el userId extraído
            return await handler(request, userId);
        } catch (error) {
            console.error(`[API Error] ${request.method} ${request.nextUrl.pathname}:`, error);
            return NextResponse.json(
                { error: "Ocurrió un error al procesar la solicitud" },
                { status: 500 }
            );
        }
    };
}