import type { Track } from "./catalog";

export interface Statistics {
  overview: {
    totalCategories: number;
    totalItems: number;
    totalTracks: number;
    totalTrackLinks: number;
    avgTracksPerItem: number;
    totalDurationMs: number;
    totalDurationMinutes: number;
    totalDurationHours: number;
  };
  mostUsedTracks: (Pick<
    Track,
    | "encoded"
    | "title"
    | "author"
    | "source"
    | "uri"
    | "artworkUrl"
    | "lengthMs"
  > & { id: number; usageCount: number })[];
  topArtists: { name: string; trackCount: number }[];
  categoryStats: {
    id: number;
    name: string;
    isPublic: boolean;
    itemCount: number;
    trackCount: number;
  }[];
  recentItems: {
    id: number;
    name: string;
    createdAt: string;
    categoryId: number;
    categoryName: string;
  }[];
}
