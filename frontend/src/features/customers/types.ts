export interface Customer {
    id: number;
    full_name: string;
    phone: string | null;
    dni: string;
    last_attendance_date: string | null;
    is_active: boolean;
}
