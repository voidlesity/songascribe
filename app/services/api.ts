import type { ApiError } from "#shared/contracts";

/** Nuxt's client and request-scoped fetchers have different helper members. */
export type ApiFetcher = unknown;

type FetchCall = (
  request: string,
  options?: Record<string, unknown>,
) => Promise<unknown>;

export function apiFetch<T>(
  fetcher: ApiFetcher,
  request: string,
  options?: Record<string, unknown>,
): Promise<T> {
  return (fetcher as FetchCall)(request, options) as Promise<T>;
}

export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === "object") {
    const candidate = error as Partial<ApiError> & { data?: Partial<ApiError> };
    return (
      candidate.data?.statusMessage ??
      candidate.statusMessage ??
      candidate.data?.message ??
      candidate.message ??
      fallback
    );
  }
  return fallback;
}
