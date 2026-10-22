/** Normalized track, as returned by search and stored on items. */
export interface Track {
  /** Persisted track id; absent on fresh search results. */
  id?: number;
  encoded: string;
  identifier: string;
  source: string;
  title: string;
  author: string;
  lengthMs: number;
  uri: string | null;
  artworkUrl: string | null;
  isrc: string | null;
  isStream: boolean;
  isSeekable: boolean;
  /** Why the track belongs to an item. */
  reason?: string | null;
}

/** A persisted track attached to an item. */
export interface ItemTrack extends Track {
  id: number;
  reason: string | null;
}

export interface Item {
  id: number;
  categoryId?: number;
  name: string;
  description: string | null;
  position: number;
  createdAt?: string;
  updatedAt?: string;
  tracks: ItemTrack[];
}

export interface Category {
  id: number;
  name: string;
  description: string | null;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  items: Item[];
}

export type PublicCategory = Pick<
  Category,
  "id" | "name" | "description" | "createdAt" | "items"
>;

export type SharedCategory = Pick<
  Category,
  "id" | "name" | "description" | "items"
>;

export interface PublicCategorySummary {
  id: number;
  name: string;
  description: string | null;
  createdAt: string;
  itemCount: number;
  trackCount: number;
  owner: { username: string; avatar: string | null } | null;
}

export interface Paginated<T> {
  data: T[];
  pagination: { page: number; limit: number; total: number; pages: number };
}

export interface Share {
  token: string;
  url: string;
  createdAt: string;
  expiresAt: string | null;
}

export interface LibraryExport {
  version: 1;
  exportedAt: string;
  categories: {
    name: string;
    description: string | null;
    isPublic: boolean;
    items: {
      name: string;
      description: string | null;
      position: number;
      tracks: Omit<Track, "id">[];
    }[];
  }[];
}

export interface LibraryImportResult {
  imported: { categories: number; items: number; tracks: number };
}
