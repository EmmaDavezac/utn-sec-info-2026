import { ROLES } from './roles'

export enum PERMISSION {
    HOME_CHAT = 'home.chat',
    STUDENTS_LIST = 'students.list',
    STUDENT_DETAIL_EDIT = 'students.detail.edit',
    STUDENT_DNI_VIEW = 'students.dni.view',
    ADMIN_PANEL = 'admin.panel',
}

export const PERMISSIONS_BY_ROLE = [
    // Administrador
    { role: ROLES.Admin, permission: PERMISSION.HOME_CHAT },
    { role: ROLES.Admin, permission: PERMISSION.STUDENTS_LIST },
    { role: ROLES.Admin, permission: PERMISSION.STUDENT_DETAIL_EDIT },
    { role: ROLES.Admin, permission: PERMISSION.STUDENT_DNI_VIEW },
    { role: ROLES.Admin, permission: PERMISSION.ADMIN_PANEL },

    // Profesor
    { role: ROLES.Teacher, permission: PERMISSION.HOME_CHAT },
    { role: ROLES.Teacher, permission: PERMISSION.STUDENTS_LIST },

    // Estudiante
    { role: ROLES.Student, permission: PERMISSION.HOME_CHAT },
]