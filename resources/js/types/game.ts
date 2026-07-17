export type GameModeCode =
    'structure_to_name' | 'name_to_structure' | 'pattern_clue';

export type SessionStatus = 'in_progress' | 'completed' | 'failed';

export interface GameMode {
    id: number;
    code: GameModeCode;
    title: string;
    description?: string;
    icon?: string;
}

export interface Topic {
    id: number;
    name: string;
    order: number;
    questions_per_game: number;
    best_score?: number;
}

export interface ChoiceData {
    id: number;
    choice_text: string | null;
    choice_image_path: string | null;
    choice_smiles: string | null;
}

export interface QuestionData {
    id: number;
    game_mode_code: string;
    prompt_text: string | null;
    prompt_image_path: string | null;
    prompt_smiles: string | null;
    clue_image_urls: string[];
    word_length: number | null;
    letters: string[] | null;
    points: number;
    time_limit_seconds: number;
}

export interface SessionState {
    id: number;
    score: number;
    lives_remaining: number;
    streak_count: number;
    status: SessionStatus;
    game_mode: Pick<GameMode, 'id' | 'code' | 'title'>;
    topic: Pick<Topic, 'id' | 'name' | 'order'>;
}

export interface Progress {
    answered: number;
    total: number;
}

export interface AnswerResult {
    is_correct: boolean;
    timed_out: boolean;
    correct_word?: string | null;
    explanation: string | null;
    choice_feedback: Record<number, string>;
    points_earned: number;
    correct_choice_id: number;
    score: number;
    lives_remaining: number;
    streak_count: number;
    session_status: SessionStatus;
    is_game_over: boolean;
}

export interface RecentSession {
    id: number;
    score: number;
    status: SessionStatus;
    game_mode: Pick<GameMode, 'code' | 'title'> | null;
    topic: Pick<Topic, 'name'> | null;
    ended_at: string | null;
}

export interface PlayerStats {
    games_played: number;
    games_completed: number;
    best_score: number;
    avg_score: number;
    accuracy: number;
    fastest_correct_seconds: number | null;
}
