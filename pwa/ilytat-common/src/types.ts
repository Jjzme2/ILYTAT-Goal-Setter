export interface CommonMetadata {
    collection: string;
    version: string;
    count?: number;
    last_updated: string;
    hash?: string;
    description?: string;
    environment?: string;
    license?: string;
}

export interface CommonResponse<T> {
    status: string;
    metadata: CommonMetadata;
    payload: T;
}

// Navigation Types
export interface NavigationItem {
    id: string;
    label: string;
    url: string;
    icon: string;
    description: string;
    type?: string;   // e.g., 'resource', 'fansite'
    access?: string; // e.g., 'private', 'public'
}

export interface NavigationPayload {
    [category: string]: NavigationItem[]; // e.g., 'public', 'common', 'media'
}

// Quote Types
export interface Quote {
    id: string;
    content: string;
    author: string;
    source: string | null;
    tags: string[];
    notes: string | null;
}

export interface AsciiArt {
    id: string;
    label: string;
    content: string;
    tags: string[];
}
