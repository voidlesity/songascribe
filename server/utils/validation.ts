import type { H3Event } from "h3";

const MAX_TEXT_LENGTH = 10_000;
const MAX_ENCODED_TRACK_LENGTH = 64 * 1024;

export function badRequest(message: string): never {
  throw createError({ statusCode: 400, statusMessage: message });
}

export function asObject(
  value: unknown,
  field = "body",
): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    badRequest(`${field} must be an object`);
  }
  return value as Record<string, unknown>;
}

export async function readObjectBody(event: H3Event) {
  return asObject((await readBody(event)) ?? {});
}

export function parseInteger(
  value: unknown,
  field: string,
  { min = 0, max = Number.MAX_SAFE_INTEGER } = {},
): number {
  const number =
    typeof value === "number"
      ? value
      : typeof value === "string" && value.trim()
        ? Number(value)
        : Number.NaN;
  if (!Number.isSafeInteger(number) || number < min || number > max) {
    badRequest(`${field} must be an integer between ${min} and ${max}`);
  }
  return number;
}

export function parseRouteId(event: H3Event, label: string): number {
  const id = Number(getRouterParam(event, "id"));
  if (!Number.isSafeInteger(id) || id <= 0) badRequest(`Invalid ${label} id`);
  return id;
}

export function parseIdList(
  value: unknown,
  field: string,
  maxLength = 1_000,
): number[] {
  if (!Array.isArray(value)) badRequest(`${field} must be an array`);
  if (value.length > maxLength) {
    badRequest(`${field} cannot contain more than ${maxLength} ids`);
  }
  return value.map((id, index) =>
    parseInteger(id, `${field}[${index}]`, { min: 1 }),
  );
}

export function requiredString(
  value: unknown,
  field: string,
  maxLength = MAX_TEXT_LENGTH,
): string {
  if (typeof value !== "string" || !value.trim()) {
    badRequest(`${field} is required`);
  }
  const result = value.trim();
  if (result.length > maxLength) {
    badRequest(`${field} must be at most ${maxLength} characters`);
  }
  return result;
}

export function optionalString(
  value: unknown,
  field: string,
  maxLength = MAX_TEXT_LENGTH,
): string | undefined {
  return value === undefined
    ? undefined
    : requiredString(value, field, maxLength);
}

/** `undefined` means "not provided"; empty strings are stored as `null`. */
export function nullableString(
  value: unknown,
  field: string,
  maxLength = MAX_TEXT_LENGTH,
): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value !== "string") badRequest(`${field} must be a string`);
  const result = value.trim();
  if (result.length > maxLength) {
    badRequest(`${field} must be at most ${maxLength} characters`);
  }
  return result || null;
}

export function optionalBoolean(
  value: unknown,
  field: string,
): boolean | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== "boolean") badRequest(`${field} must be a boolean`);
  return value;
}

export function requiredPassword(value: unknown): string {
  if (typeof value !== "string" || !value || value.length > 1024) {
    badRequest("password is required and must be at most 1024 characters");
  }
  return value;
}

export function parseTrack(value: unknown, field = "track"): Track {
  const track = asObject(value, field);
  return {
    encoded: requiredString(
      track.encoded,
      `${field}.encoded`,
      MAX_ENCODED_TRACK_LENGTH,
    ),
    identifier: requiredString(track.identifier, `${field}.identifier`, 2_048),
    source: requiredString(track.source, `${field}.source`, 128),
    title: requiredString(track.title, `${field}.title`, 2_048),
    author: requiredString(track.author, `${field}.author`, 1_024),
    lengthMs: parseInteger(track.lengthMs ?? 0, `${field}.lengthMs`),
    uri: nullableString(track.uri, `${field}.uri`, 8_192) ?? null,
    artworkUrl:
      nullableString(track.artworkUrl, `${field}.artworkUrl`, 8_192) ?? null,
    isrc: nullableString(track.isrc, `${field}.isrc`, 128) ?? null,
    isStream: optionalBoolean(track.isStream, `${field}.isStream`) ?? false,
    isSeekable:
      optionalBoolean(track.isSeekable, `${field}.isSeekable`) ?? true,
    reason: nullableString(track.reason, `${field}.reason`, 5_000) ?? null,
  };
}

export function parseTrackList(
  value: unknown,
  field = "tracks",
  maxLength = 1_000,
): Track[] {
  if (!Array.isArray(value)) badRequest(`${field} must be an array`);
  if (value.length > maxLength) {
    badRequest(`${field} cannot contain more than ${maxLength} tracks`);
  }
  return value.map((track, index) => parseTrack(track, `${field}[${index}]`));
}

/** `undefined` keeps the current expiry, `null` removes it. */
export function parseOptionalExpiry(value: unknown): Date | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  const date = typeof value === "string" ? new Date(value) : null;
  if (!date || !Number.isFinite(date.getTime()) || date <= new Date()) {
    badRequest("expiresAt must be a future ISO-8601 timestamp or null");
  }
  return date;
}
