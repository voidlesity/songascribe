import { requireUserSession } from "#imports";
import { createError, getRouterParam, type H3Event } from "h3";

import type { TrackInput } from "../../shared/contracts";

const MAX_TEXT_LENGTH = 10_000;
const MAX_TRACK_ENCODED_LENGTH = 64 * 1024;

export function badRequest(message: string): never {
  throw createError({ statusCode: 400, statusMessage: message });
}

export function notFound(message: string): never {
  throw createError({ statusCode: 404, statusMessage: message });
}

export function parsePositiveId(
  event: H3Event,
  parameter: string,
  label: string,
): number {
  return parseInteger(getRouterParam(event, parameter), label, {
    min: 1,
    max: Number.MAX_SAFE_INTEGER,
  });
}

export function parseInteger(
  value: unknown,
  field: string,
  bounds: { min: number; max: number },
): number {
  const number =
    typeof value === "number"
      ? value
      : typeof value === "string" && value.trim() !== ""
        ? Number(value)
        : Number.NaN;

  if (
    !Number.isSafeInteger(number) ||
    number < bounds.min ||
    number > bounds.max
  ) {
    badRequest(`${field} must be an integer between ${bounds.min} and ${bounds.max}`);
  }
  return number;
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
  if (value === undefined) return undefined;
  return requiredString(value, field, maxLength);
}

export function nullableDescription(
  value: unknown,
  field = "description",
): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value !== "string") badRequest(`${field} must be a string or null`);
  const result = value.trim();
  if (result.length > MAX_TEXT_LENGTH) {
    badRequest(`${field} must be at most ${MAX_TEXT_LENGTH} characters`);
  }
  return result || null;
}

export function booleanValue(value: unknown, field: string): boolean {
  if (typeof value !== "boolean") badRequest(`${field} must be a boolean`);
  return value;
}

export function parseIdList(
  value: unknown,
  field: string,
  maxLength: number,
): number[] {
  if (!Array.isArray(value)) badRequest(`${field} must be an array`);
  if (value.length > maxLength) {
    badRequest(`${field} cannot contain more than ${maxLength} ids`);
  }

  const ids = value.map((id, index) =>
    parseInteger(id, `${field}[${index}]`, {
      min: 1,
      max: Number.MAX_SAFE_INTEGER,
    }),
  );
  if (new Set(ids).size !== ids.length) {
    badRequest(`${field} cannot contain duplicate ids`);
  }
  return ids;
}

function nullableTrackString(
  value: unknown,
  field: string,
  maxLength: number,
): string | null {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string") badRequest(`${field} must be a string or null`);
  if (value.length > maxLength) {
    badRequest(`${field} must be at most ${maxLength} characters`);
  }
  return value;
}

export function parseTrackInput(value: unknown, field = "track"): TrackInput {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    badRequest(`${field} must be an object`);
  }
  const track = value as Record<string, unknown>;
  const encoded = requiredString(
    track.encoded,
    `${field}.encoded`,
    MAX_TRACK_ENCODED_LENGTH,
  );

  return {
    encoded,
    identifier: requiredString(track.identifier, `${field}.identifier`, 2_048),
    source: requiredString(track.source, `${field}.source`, 128),
    title: requiredString(track.title, `${field}.title`, 2_048),
    author: requiredString(track.author, `${field}.author`, 1_024),
    lengthMs: parseInteger(track.lengthMs ?? 0, `${field}.lengthMs`, {
      min: 0,
      max: Number.MAX_SAFE_INTEGER,
    }),
    uri: nullableTrackString(track.uri, `${field}.uri`, 8_192),
    artworkUrl: nullableTrackString(
      track.artworkUrl,
      `${field}.artworkUrl`,
      8_192,
    ),
    isrc: nullableTrackString(track.isrc, `${field}.isrc`, 128),
    isStream: track.isStream === undefined ? false : booleanValue(track.isStream, `${field}.isStream`),
    isSeekable:
      track.isSeekable === undefined
        ? true
        : booleanValue(track.isSeekable, `${field}.isSeekable`),
    reason:
      track.reason === undefined
        ? undefined
        : nullableTrackString(track.reason, `${field}.reason`, 5_000),
  };
}

export function parseTrackList(
  value: unknown,
  field = "tracks",
  maxLength = 1_000,
): TrackInput[] {
  if (!Array.isArray(value)) badRequest(`${field} must be an array`);
  if (value.length > maxLength) {
    badRequest(`${field} cannot contain more than ${maxLength} tracks`);
  }
  return value.map((track, index) => parseTrackInput(track, `${field}[${index}]`));
}

export function parseOptionalExpiry(value: unknown): Date | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  if (typeof value !== "string" || value.length > 100) {
    badRequest("expiresAt must be an ISO-8601 timestamp or null");
  }
  const date = new Date(value);
  if (!Number.isFinite(date.getTime()) || date.getTime() <= Date.now()) {
    badRequest("expiresAt must be a valid future timestamp");
  }
  return date;
}

export async function requireSessionUserId(event: H3Event): Promise<number> {
  const session = await requireUserSession(event);
  const id = (session.user as { id?: unknown } | undefined)?.id;
  if (!Number.isSafeInteger(id) || (id as number) <= 0) {
    throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
  }
  return id as number;
}

export function asObject(value: unknown, field = "body"): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    badRequest(`${field} must be an object`);
  }
  return value as Record<string, unknown>;
}
