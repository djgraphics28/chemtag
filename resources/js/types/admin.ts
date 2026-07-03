export interface AdminUser {
    id: number;
    name: string;
    username: string;
    xp_total: number;
    roles: string[];
    created_at: string;
}

export interface AdminRole {
    id: number;
    name: string;
    permissions: string[];
    users_count: number;
}

export interface AdminQuestion {
    id: number;
    prompt_text: string | null;
    prompt_image_path: string | null;
    points: number;
    is_active: boolean;
    game_mode: { id: number; code: string; title: string } | null;
    topic: { id: number; name: string } | null;
    choices_count: number;
}

export interface AdminGameMode {
    id: number;
    code: string;
    title: string;
    description: string | null;
    icon: string | null;
    is_active: boolean;
    questions_count: number;
}

export interface AdminTopic {
    id: number;
    name: string;
    order: number;
    questions_per_game: number;
    questions_count: number;
}

export interface PaginatedData<T> {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
    links: { url: string | null; label: string; active: boolean }[];
}
