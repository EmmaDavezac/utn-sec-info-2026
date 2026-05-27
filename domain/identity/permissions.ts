import { ROLES} from './roles'

export enum PERMISSION {
    HOME_CHAT = 'home.chat',
    STUDENTS_LIST = 'students.list',
    STUDENT_DETAIL_EDIT = 'students.detail.edit',
    STUDENT_DNI_VIEW = 'students.dni.view',
}

export const PERMISSIONS_BY_ROLE = [
    { role: ROLES.Admin, permission: PERMISSION.HOME_CHAT },
    { role: ROLES.Admin, permission: PERMISSION.STUDENTS_LIST },
    { role: ROLES.Admin, permission: PERMISSION.STUDENT_DETAIL_EDIT },
    { role: ROLES.Admin, permission: PERMISSION.STUDENT_DNI_VIEW },
    { role: ROLES.Student, permission: PERMISSION.HOME_CHAT },
    { role: ROLES.Student, permission: PERMISSION.STUDENTS_LIST },
]