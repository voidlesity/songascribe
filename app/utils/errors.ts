interface ErrorLike {
  message?: string;
  statusMessage?: string;
  data?: { message?: string; statusMessage?: string };
}

/** Extracts a user-facing message from an H3/ofetch error. */
export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (!error || typeof error !== "object") return fallback;
  const { data, statusMessage, message } = error as ErrorLike;
  return (
    data?.statusMessage || statusMessage || data?.message || message || fallback
  );
}
