export type GoalPriority = 'low' | 'medium' | 'high';
export type GoalStatus = 'todo' | 'in_progress' | 'completed' | 'archived';

export interface Goal {
    id: string; // UUID
    text: string;
    description?: string;
    priority: GoalPriority;
    category?: string;
    status: GoalStatus;
    completed: boolean; // Computed or legacy simple flag
    notes?: string;

    // Metadata
    createdAt: string; // ISO Date
    updatedAt?: string; // ISO Date
    completedAt?: string; // ISO Date

    // Origin tracking (for external additions)
    source?: string; // e.g., 'pwa', 'cli', 'external-app'
    externalId?: string; // ID in the source system if different
}

export type GoalTimeframe = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';

export interface GoalCollection {
    id: string; // Date string or ID
    timeframe: GoalTimeframe;
    goals: Goal[];
    updatedAt: string;
}

export interface GoalOperation {
    operation: 'add' | 'update' | 'set' | 'delete';
    goal?: Goal; // For add/update/delete
    goals?: Goal[]; // For set
    timeframe: GoalTimeframe;
    date?: string; // Target date (defaults to today)
}
