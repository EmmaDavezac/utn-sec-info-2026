import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { PERMISSION, PERMISSIONS_BY_ROLE } from '@/domain/identity/permissions';

export interface UserInfo {
    userId: string
    role: string
    email: string | null
    jwt: string | null
}

type PermissionedHandler = (request: NextRequest, userInfo: UserInfo, context: unknown) => Promise<NextResponse> | NextResponse;

export function withPermission(permission: PERMISSION, handler: PermissionedHandler) {
    return async (request: NextRequest, context: unknown): Promise<NextResponse> => {
        try {
            const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
            if (!token) {
                return NextResponse.json(
                    { error: 'No autorizado. Inicia sesión para continuar.' },
                    { status: 401 }
                );
            }

            const userId = token.id as string;
            const email = token.email as string ?? null;
            const rawRole = (token.role as string) ?? 'Estudiante';
            const role = rawRole.toLowerCase() === 'administrador' ? 'admin' : 'student';

            const hasPermission = !!role && PERMISSIONS_BY_ROLE.some(
                p => p.role === role && p.permission === permission
            );
            if (!hasPermission) {
                return NextResponse.json(
                    { error: 'No tenés permiso para realizar esta acción.' },
                    { status: 403 }
                );
            }

            const userInfo: UserInfo = { userId, role, email, jwt: null };

            return await handler(request, userInfo, context);
        } catch (error) {
            console.error(`[API Error] ${request.method} ${request.nextUrl.pathname}:`, error);
            return NextResponse.json(
                { error: 'Ocurrió un error al procesar la solicitud.' },
                { status: 500 }
            );
        }
    };
}
