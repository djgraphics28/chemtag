export type User = {
    id: number;
    name: string;
    username: string;
    avatar_path: string | null;
    xp_total: number;
    two_factor_enabled?: boolean;
    created_at: string;
    updated_at: string;
    roles?: string[];
    [key: string]: unknown;
};

export type Auth = {
    user: User;
};

export type TwoFactorSetupData = {
    svg: string;
    url: string;
};

export type TwoFactorSecretKey = {
    secretKey: string;
};
