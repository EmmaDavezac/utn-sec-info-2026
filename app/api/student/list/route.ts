import { NextRequest, NextResponse } from 'next/server'
import { GetStudentsListHandler, GetStudentsListQuery } from '@/application/query/GetStudentsListHandler'
import { withPermission, UserInfo } from '@/app/lib/withPermission'
import { PERMISSION } from '@/domain/identity/permissions'

const getStudentsListQueryHandler = async (_request: NextRequest, userInfo: UserInfo): Promise<NextResponse> => {
    const handler = new GetStudentsListHandler()
    const query: GetStudentsListQuery = {
        user: { email: userInfo.email ?? '', role: userInfo.role },
    }
    const response = await handler.handle(query)
    return NextResponse.json(response)
}

export const GET = withPermission(PERMISSION.STUDENTS_LIST, getStudentsListQueryHandler)