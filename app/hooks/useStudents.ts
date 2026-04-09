import { useCallback } from 'react'
import { useStudentsStore } from '@/app/store/students'
import { useStudentApi } from '@/app/lib/clients/useStudentApi'

export const useStudents = () => {
  
    const { setStudents } = useStudentsStore()
    const { getStudentsList } = useStudentApi()

    const fetchStudents = useCallback(async () => {
        const response = await getStudentsList()
        setStudents(response.list)
    }, [getStudentsList, setStudents])

    return {
        fetchStudents,
    }
}