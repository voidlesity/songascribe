import type { Track } from "./nodelink";

/**
 * Look up a track by encoded string, or insert it if new. Returns the persisted
 * row (always includes `id`).
 */
export async function upsertTrack(
  input: Track,
): Promise<Track & { id: number }> {
  const existing = db
    .select()
    .from(tables.tracks)
    .where(eq(tables.tracks.encoded, input.encoded))
    .get();

  const now = new Date();

  if (existing) {
    return {
      id: existing.id,
      encoded: existing.encoded,
      identifier: existing.identifier,
      source: existing.source,
      title: existing.title,
      author: existing.author,
      lengthMs: existing.lengthMs,
      uri: existing.uri,
      artworkUrl: existing.artworkUrl,
      isrc: existing.isrc,
      isStream: existing.isStream,
      isSeekable: existing.isSeekable,
    };
  }

  const [row] = await db
    .insert(tables.tracks)
    .values({
      encoded: input.encoded,
      identifier: input.identifier,
      source: input.source,
      title: input.title,
      author: input.author,
      lengthMs: input.lengthMs,
      uri: input.uri,
      artworkUrl: input.artworkUrl,
      isrc: input.isrc,
      isStream: input.isStream,
      isSeekable: input.isSeekable,
      pluginInfo: null,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  return {
    id: row!.id,
    encoded: row!.encoded,
    identifier: row!.identifier,
    source: row!.source,
    title: row!.title,
    author: row!.author,
    lengthMs: row!.lengthMs,
    uri: row!.uri,
    artworkUrl: row!.artworkUrl,
    isrc: row!.isrc,
    isStream: row!.isStream,
    isSeekable: row!.isSeekable,
  };
}

/** Fetch ordered tracks attached to an item. */
export async function getItemTracks(
  itemId: number,
): Promise<(Track & { id: number })[]> {
  const rows = await db
    .select({ track: tables.tracks, link: tables.itemTracks })
    .from(tables.itemTracks)
    .innerJoin(tables.tracks, eq(tables.itemTracks.trackId, tables.tracks.id))
    .where(eq(tables.itemTracks.itemId, itemId))
    .orderBy(asc(tables.itemTracks.position));

  return rows.map(({ track }) => ({
    id: track.id,
    encoded: track.encoded,
    identifier: track.identifier,
    source: track.source,
    title: track.title,
    author: track.author,
    lengthMs: track.lengthMs,
    uri: track.uri,
    artworkUrl: track.artworkUrl,
    isrc: track.isrc,
    isStream: track.isStream,
    isSeekable: track.isSeekable,
  }));
}

/**
 * Replace the tracks attached to an item with the given list (in order).
 * Unknown encoded strings are upserted into `tracks`.
 */
export async function setItemTracks(
  itemId: number,
  inputTracks: Track[],
): Promise<void> {
  await db
    .delete(tables.itemTracks)
    .where(eq(tables.itemTracks.itemId, itemId));

  const now = new Date();
  let position = 0;
  for (const t of inputTracks) {
    if (!t?.encoded) continue;
    const persisted = await upsertTrack(t);
    await db.insert(tables.itemTracks).values({
      itemId,
      trackId: persisted.id,
      position: position++,
      addedAt: now,
    });
  }
}
