'use client'

import { api } from '@/app/lib/api'
import { GetStudentsListResponse } from '@/application/query/GetStudentsListHandler'

const BASE_URL = '/api/student'

export const useStudentApi = () => {
    const getStudentsList = async (): Promise<GetStudentsListResponse> => {
        return api.get<GetStudentsListResponse>(`${BASE_URL}/list`)
    }

    const updateStudentDetail = async (studentId: number, detail: string): Promise<void> => {
        await api.patch(`${BASE_URL}/${studentId}/detail`, { detail })
    }

    return {
        getStudentsList,
        updateStudentDetail,
    }
}