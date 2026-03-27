export interface Customer {
    id: number;
    full_name: string;
    phone: string | null;
    dni: string;
    last_attendance_date: string | null;
    is_active: boolean;
}

export interface CustomerCard {
    id: number;
    full_name: string;
    membership_end_date: string | null;
}

export interface CustomerBoard {
    active: CustomerCard[];
    due: CustomerCard[];
    expired: CustomerCard[];
    never_active: CustomerCard[];
}
