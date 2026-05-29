import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

type ApiRouteHandler = (request: NextRequest, userId: string) => Promise<NextResponse> | NextResponse;

/**
 * Wrapper para Route Handlers de Next.js.
 * Maneja la extracción del userId, la validación de sesión y atrapa errores genéricos (500).
 */
export function withApiRoute(handler: ApiRouteHandler) {
    // Retornamos la firma estándar que espera Next.js para un Route Handler
    return async (request: NextRequest): Promise<NextResponse> => {
        try {
            const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
            
            if (!token) {
                return NextResponse.json(
                    { error: "No autorizado. Inicia sesión para continuar." },
                    { status: 401 }
                );
            }

            const userId = token.id as string;

            // Ejecutamos la lógica de negocio inyectando el userId extraído
            return await handler(request, userId);
        } catch (error) {
            console.error("[[API Error] %s %s:",request.method,request.nextUrl.pathname,error);
            return NextResponse.json(
                { error: "Ocurrió un error al procesar la solicitud" },
                { status: 500 }
            );
        }
    };
}