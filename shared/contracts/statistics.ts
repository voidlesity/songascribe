import type { DateTimeString } from "./catalog";

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
  mostUsedTracks: Array<{
    id: number;
    encoded: string;
    title: string;
    author: string;
    source: string;
    uri: string | null;
    artworkUrl: string | null;
    lengthMs: number;
    usageCount: number;
  }>;
  topArtists: Array<{ name: string; trackCount: number }>;
  categoryStats: Array<{
    id: number;
    name: string;
    isPublic: boolean;
    itemCount: number;
    trackCount: number;
  }>;
  recentItems: Array<{
    id: number;
    name: string;
    createdAt: DateTimeString;
    categoryId: number;
    categoryName: string;
  }>;
}
