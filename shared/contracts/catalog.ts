export type DateTimeString = string;

/** Transport-safe track representation returned by the API. */
export interface Track {
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
}

/** Normalized item/track relation for new consumers. */
export interface ItemTrack {
  id: number;
  itemId: number;
  trackId: number;
  position: number;
  reason: string | null;
  addedAt: DateTimeString;
  track: Track;
}

/**
 * Compatibility shape used by existing clients: relation metadata is flattened
 * onto the track and `id` remains the persisted track id.
 */
export interface FlattenedItemTrack extends Track {
  id: number;
  reason?: string | null;
  itemTrackId?: number;
  position?: number;
  addedAt?: DateTimeString;
}

export interface Item {
  id: number;
  categoryId?: number;
  name: string;
  description: string | null;
  position: number;
  createdAt?: DateTimeString;
  updatedAt?: DateTimeString;
  tracks: FlattenedItemTrack[];
}

export interface Category {
  id: number;
  name: string;
  description: string | null;
  isPublic: boolean;
  createdAt: DateTimeString;
  updatedAt: DateTimeString;
  items: Item[];
}

export interface PublicCategorySummary {
  id: number;
  name: string;
  description: string | null;
  createdAt: DateTimeString;
  itemCount: number;
  trackCount: number;
  owner: { username: string; avatar: string | null } | null;
}

export interface Share {
  token: string;
  url: string;
  createdAt: DateTimeString;
  expiresAt: DateTimeString | null;
}

export interface LibraryExport {
  version: 1;
  exportedAt: DateTimeString;
  categories: Array<
    Pick<Category, "name" | "description" | "isPublic"> & {
      items: Array<
        Pick<Item, "name" | "description" | "position"> & {
          tracks: Array<Omit<FlattenedItemTrack, "id">>;
        }
      >;
    }
  >;
}

export interface LibraryImportResult {
  imported: {
    categories: number;
    items: number;
    tracks: number;
  };
}
