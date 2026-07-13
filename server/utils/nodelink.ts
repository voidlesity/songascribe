import { useRuntimeConfig } from "#imports";

import type { Track } from "../../shared/contracts";

export type { Track } from "../../shared/contracts";

const MAX_RESULTS = 100;
const MAX_ENCODED_LENGTH = 64 * 1024;

export interface NodelinkRawTrackInfo {
  identifier: string;
  isSeekable: boolean;
  author: string;
  length: number;
  isStream: boolean;
  position: number;
  title: string;
  uri: string | null;
  sourceName: string;
  artworkUrl: string | null;
  isrc: string | null;
}

export interface NodelinkRawTrack {
  encoded: string;
  info: NodelinkRawTrackInfo;
  pluginInfo?: Record<string, unknown>;
  userData?: Record<string, unknown>;
}

export interface NodelinkLoadResult {
  loadType: "track" | "playlist" | "search" | "empty" | "error";
  data: unknown;
}

export class NodeLinkError extends Error {
  constructor(
    message: string,
    readonly statusCode: 502 | 504 = 502,
  ) {
    super(message);
    this.name = "NodeLinkError";
  }
}

function getConnection() {
  const config = useRuntimeConfig();
  const host = String(config.nodelink.host || "localhost");
  const port = Number(config.nodelink.port);
  const configuredTimeout = Number(config.nodelink.timeoutMs);
  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new NodeLinkError("NodeLink is misconfigured");
  }
  const timeoutMs = Number.isInteger(configuredTimeout)
    ? Math.min(30_000, Math.max(1_000, configuredTimeout))
    : 8_000;
  return {
    baseUrl: `http://${host}:${port}`,
    headers: { Authorization: String(config.nodelink.password) },
    timeoutMs,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function nullableString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function normalizeRawTrack(value: unknown): NodelinkRawTrack | null {
  if (!isRecord(value) || !isRecord(value.info)) return null;
  const info = value.info;
  if (
    typeof value.encoded !== "string" ||
    !value.encoded ||
    value.encoded.length > MAX_ENCODED_LENGTH ||
    typeof info.identifier !== "string" ||
    typeof info.author !== "string" ||
    typeof info.title !== "string" ||
    typeof info.sourceName !== "string"
  ) {
    return null;
  }
  const length = Number(info.length);
  return {
    encoded: value.encoded,
    info: {
      identifier: info.identifier,
      isSeekable: info.isSeekable !== false,
      author: info.author,
      length: Number.isSafeInteger(length) && length >= 0 ? length : 0,
      isStream: Boolean(info.isStream),
      position: Number.isFinite(Number(info.position)) ? Number(info.position) : 0,
      title: info.title,
      uri: nullableString(info.uri),
      sourceName: info.sourceName,
      artworkUrl: nullableString(info.artworkUrl),
      isrc: nullableString(info.isrc),
    },
    pluginInfo: isRecord(value.pluginInfo) ? value.pluginInfo : undefined,
    userData: isRecord(value.userData) ? value.userData : undefined,
  };
}

function mapNodeLinkFailure(error: unknown): NodeLinkError {
  if (error instanceof NodeLinkError) return error;
  const name =
    error instanceof Error
      ? `${error.name} ${(error.cause as Error | undefined)?.name ?? ""}`
      : "";
  if (/abort|timeout/i.test(name)) {
    return new NodeLinkError("NodeLink request timed out", 504);
  }
  return new NodeLinkError("NodeLink is unavailable");
}

export function toTrack(raw: NodelinkRawTrack): Track {
  return {
    encoded: raw.encoded,
    identifier: raw.info.identifier,
    source: raw.info.sourceName,
    title: raw.info.title,
    author: raw.info.author,
    lengthMs: raw.info.length,
    uri: raw.info.uri,
    artworkUrl: raw.info.artworkUrl,
    isrc: raw.info.isrc,
    isStream: raw.info.isStream,
    isSeekable: raw.info.isSeekable,
  };
}

export async function searchTracks(query: string): Promise<Track[]> {
  const { baseUrl, headers, timeoutMs } = getConnection();
  const identifier = /^https?:\/\//i.test(query) ? query : `ytmsearch:${query}`;

  try {
    const result = await $fetch<NodelinkLoadResult>(`${baseUrl}/v4/loadtracks`, {
      headers,
      params: { identifier },
      timeout: timeoutMs,
    });
    if (!result || typeof result.loadType !== "string") {
      throw new NodeLinkError("NodeLink returned an invalid response");
    }

    let rawTracks: unknown[];
    switch (result.loadType) {
      case "track":
        rawTracks = [result.data];
        break;
      case "search":
        rawTracks = Array.isArray(result.data) ? result.data : [];
        break;
      case "playlist":
        rawTracks =
          isRecord(result.data) && Array.isArray(result.data.tracks)
            ? result.data.tracks
            : [];
        break;
      case "empty":
        return [];
      case "error":
        throw new NodeLinkError("NodeLink could not load the requested media");
      default:
        throw new NodeLinkError("NodeLink returned an unsupported response");
    }

    return rawTracks
      .slice(0, MAX_RESULTS)
      .map(normalizeRawTrack)
      .filter((track): track is NodelinkRawTrack => track !== null)
      .map(toTrack);
  } catch (error) {
    throw mapNodeLinkFailure(error);
  }
}

export async function decodeTrack(encoded: string): Promise<Track | null> {
  const { baseUrl, headers, timeoutMs } = getConnection();
  try {
    const value = await $fetch<unknown>(`${baseUrl}/v4/decodetrack`, {
      headers,
      params: { track: encoded },
      timeout: timeoutMs,
    });
    const raw = normalizeRawTrack(value);
    return raw ? toTrack({ ...raw, encoded }) : null;
  } catch (error) {
    const status = isRecord(error) ? Number(error.statusCode) : 0;
    if (status === 400 || status === 404) return null;
    throw mapNodeLinkFailure(error);
  }
}

export interface LoadStreamOptions {
  encoded: string;
  positionMs?: number;
  volume?: number;
  signal?: AbortSignal;
}

export async function loadStream(options: LoadStreamOptions): Promise<Response> {
  const { baseUrl, headers, timeoutMs } = getConnection();
  const timeoutController = new AbortController();
  const timeout = setTimeout(() => timeoutController.abort(), timeoutMs);
  const signal = options.signal
    ? AbortSignal.any([options.signal, timeoutController.signal])
    : timeoutController.signal;

  try {
    const response = await fetch(`${baseUrl}/v4/loadstream`, {
      method: "POST",
      headers: {
        ...headers,
        "Content-Type": "application/json",
        Accept: "audio/l16;rate=48000;channels=2",
      },
      body: JSON.stringify({
        encodedTrack: options.encoded,
        position: options.positionMs ?? 0,
        volume: options.volume ?? 100,
        filters: {},
      }),
      signal,
    });
    clearTimeout(timeout);
    return response;
  } catch (error) {
    clearTimeout(timeout);
    throw mapNodeLinkFailure(error);
  }
}

export async function checkNodeLink(): Promise<boolean> {
  try {
    const { baseUrl, headers, timeoutMs } = getConnection();
    const response = await fetch(`${baseUrl}/version`, {
      headers,
      signal: AbortSignal.timeout(Math.min(timeoutMs, 2_500)),
    });
    return response.ok;
  } catch {
    return false;
  }
}
