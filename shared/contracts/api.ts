import type { Track } from "./catalog";

export interface ApiError {
  statusCode: number;
  statusMessage: string;
  message?: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface Paginated<T> {
  data: T[];
  pagination: Pagination;
}

export interface CreateCategoryBody {
  name: string;
  description?: string | null;
  isPublic?: boolean;
}

export interface UpdateCategoryBody {
  name?: string;
  description?: string | null;
  isPublic?: boolean;
}

export interface CreateItemBody {
  name: string;
  description?: string | null;
  tracks?: TrackInput[];
}

export interface UpdateItemBody {
  name?: string;
  description?: string | null;
  position?: number;
  tracks?: TrackInput[];
}

export type TrackInput = Track & { reason?: string | null };

export interface ReorderCategoryItemsBody {
  itemIds: number[];
}

export interface ReorderItemTracksBody {
  /** Persisted track ids in the desired order; duplicate ids are supported. */
  trackIds: number[];
}

export interface ShareExpiryBody {
  /** ISO-8601 timestamp in the future, or null for no expiry. */
  expiresAt?: string | null;
}

export interface LoginBody {
  login: string;
  password: string;
}

export interface RegisterBody {
  email: string;
  username: string;
  password: string;
}

export interface UpdateUserBody {
  theme?: string;
}
