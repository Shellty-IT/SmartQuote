// src/lib/api/search.api.ts

import { api } from './client';
import type { SearchResults } from '@/types/search.types';

export const searchApi = {
    search: (q: string, limit = 10) =>
        api.get<SearchResults>('/search', { q, limit }),
};
