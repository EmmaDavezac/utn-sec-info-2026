import { useCallback } from 'react'
import { useStudentsStore } from '@/app/store/students'
import { useStudentApi } from '@/app/lib/clients/useStudentApi'

export const useStudents = () => {

    const { setStudents, updateStudentDetail } = useStudentsStore()
    const { getStudentsList, updateStudentDetail: apiUpdateDetail } = useStudentApi()

    const fetchStudents = useCallback(async () => {
        const response = await getStudentsList()
        setStudents(response.list)
    }, [getStudentsList, setStudents])

    const editStudentDetail = useCallback(async (studentId: number, detail: string) => {
        await apiUpdateDetail(studentId, detail)
        updateStudentDetail(studentId, detail)
    }, [apiUpdateDetail, updateStudentDetail])

    return {
        fetchStudents,
        editStudentDetail,
    }
}