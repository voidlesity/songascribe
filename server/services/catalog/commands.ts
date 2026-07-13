import { and, asc, eq, sql } from "drizzle-orm";
import { createError } from "h3";

import type {
  LibraryExport,
  TrackInput,
  UpdateItemBody,
} from "../../../shared/contracts";
import { db, tables } from "../../utils/drizzle";

export interface NewItemInput {
  name: string;
  description: string | null;
  tracks: TrackInput[];
}

export interface ItemPatch extends Pick<UpdateItemBody, "name" | "position"> {
  description?: string | null;
  tracks?: TrackInput[];
}

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

function ownedCategory(tx: Transaction, categoryId: number, userId: number) {
  const category = tx
    .select()
    .from(tables.categories)
    .where(
      and(
        eq(tables.categories.id, categoryId),
        eq(tables.categories.userId, userId),
      ),
    )
    .get();
  if (!category) {
    throw createError({ statusCode: 404, statusMessage: "Category not found" });
  }
  return category;
}

function ownedItem(tx: Transaction, itemId: number, userId: number) {
  const row = tx
    .select({ item: tables.items, category: tables.categories })
    .from(tables.items)
    .innerJoin(
      tables.categories,
      eq(tables.items.categoryId, tables.categories.id),
    )
    .where(
      and(eq(tables.items.id, itemId), eq(tables.categories.userId, userId)),
    )
    .get();
  if (!row) {
    throw createError({ statusCode: 404, statusMessage: "Item not found" });
  }
  return row.item;
}

/** One statement handles both first insert and an encoded-track conflict. */
function upsertTrack(tx: Transaction, input: TrackInput): number {
  const now = new Date();
  const row = tx
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
    .onConflictDoUpdate({
      target: tables.tracks.encoded,
      set: {
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
        updatedAt: now,
      },
    })
    .returning({ id: tables.tracks.id })
    .get();

  return row.id;
}

function replaceTracks(tx: Transaction, itemId: number, tracks: TrackInput[]) {
  tx.delete(tables.itemTracks)
    .where(eq(tables.itemTracks.itemId, itemId))
    .run();

  if (tracks.length === 0) return;
  const addedAt = new Date();
  const links = tracks.map((track, position) => ({
    itemId,
    trackId: upsertTrack(tx, track),
    position,
    reason: track.reason?.trim() || null,
    addedAt,
  }));
  tx.insert(tables.itemTracks).values(links).run();
}

export function createItemWithTracks(
  categoryId: number,
  userId: number,
  input: NewItemInput,
): number {
  return db.transaction((tx) => {
    ownedCategory(tx, categoryId, userId);
    const maxPosition = tx
      .select({ value: sql<number>`COALESCE(MAX(${tables.items.position}), -1)` })
      .from(tables.items)
      .where(eq(tables.items.categoryId, categoryId))
      .get()?.value;
    const now = new Date();
    const item = tx
      .insert(tables.items)
      .values({
        categoryId,
        name: input.name,
        description: input.description,
        position: (maxPosition ?? -1) + 1,
        createdAt: now,
        updatedAt: now,
      })
      .returning({ id: tables.items.id })
      .get();
    replaceTracks(tx, item.id, input.tracks);
    return item.id;
  });
}

export function updateItemWithTracks(
  itemId: number,
  userId: number,
  patch: ItemPatch,
): void {
  db.transaction((tx) => {
    ownedItem(tx, itemId, userId);
    const values: {
      name?: string;
      description?: string | null;
      position?: number;
      updatedAt: Date;
    } = { updatedAt: new Date() };
    if (patch.name !== undefined) values.name = patch.name;
    if (patch.description !== undefined) values.description = patch.description;
    if (patch.position !== undefined) values.position = patch.position;

    if (
      patch.name !== undefined ||
      patch.description !== undefined ||
      patch.position !== undefined
    ) {
      tx.update(tables.items)
        .set(values)
        .where(eq(tables.items.id, itemId))
        .run();
    }
    if (patch.tracks !== undefined) replaceTracks(tx, itemId, patch.tracks);
  });
}

export function replaceItemTracks(
  itemId: number,
  userId: number,
  tracks: TrackInput[],
): void {
  db.transaction((tx) => {
    ownedItem(tx, itemId, userId);
    replaceTracks(tx, itemId, tracks);
    tx.update(tables.items)
      .set({ updatedAt: new Date() })
      .where(eq(tables.items.id, itemId))
      .run();
  });
}

export function reorderCategoryItems(
  categoryId: number,
  userId: number,
  itemIds: number[],
): void {
  db.transaction((tx) => {
    ownedCategory(tx, categoryId, userId);
    const existing = tx
      .select({ id: tables.items.id })
      .from(tables.items)
      .where(eq(tables.items.categoryId, categoryId))
      .orderBy(asc(tables.items.position), asc(tables.items.id))
      .all();

    const existingIds = existing.map((row) => row.id);
    if (
      existingIds.length !== itemIds.length ||
      existingIds.some((id) => !itemIds.includes(id))
    ) {
      throw createError({
        statusCode: 400,
        statusMessage: "itemIds must contain every category item exactly once",
      });
    }

    const now = new Date();
    itemIds.forEach((id, position) => {
      tx.update(tables.items)
        .set({ position, updatedAt: now })
        .where(eq(tables.items.id, id))
        .run();
    });
  });
}

export function reorderItemTracks(
  itemId: number,
  userId: number,
  trackIds: number[],
): void {
  db.transaction((tx) => {
    ownedItem(tx, itemId, userId);
    const links = tx
      .select({ id: tables.itemTracks.id, trackId: tables.itemTracks.trackId })
      .from(tables.itemTracks)
      .where(eq(tables.itemTracks.itemId, itemId))
      .orderBy(asc(tables.itemTracks.position), asc(tables.itemTracks.id))
      .all();

    const queues = new Map<number, number[]>();
    for (const link of links) {
      const queue = queues.get(link.trackId) ?? [];
      queue.push(link.id);
      queues.set(link.trackId, queue);
    }
    const orderedLinkIds: number[] = [];
    for (const trackId of trackIds) {
      const linkId = queues.get(trackId)?.shift();
      if (linkId === undefined) {
        throw createError({
          statusCode: 400,
          statusMessage: "trackIds must match the item's tracks exactly",
        });
      }
      orderedLinkIds.push(linkId);
    }
    if (
      orderedLinkIds.length !== links.length ||
      [...queues.values()].some((queue) => queue.length > 0)
    ) {
      throw createError({
        statusCode: 400,
        statusMessage: "trackIds must match the item's tracks exactly",
      });
    }

    orderedLinkIds.forEach((linkId, position) => {
      tx.update(tables.itemTracks)
        .set({ position })
        .where(eq(tables.itemTracks.id, linkId))
        .run();
    });
    tx.update(tables.items)
      .set({ updatedAt: new Date() })
      .where(eq(tables.items.id, itemId))
      .run();
  });
}

export function createOrUpdateShare(
  categoryId: number,
  userId: number,
  expiresAt: Date | null | undefined,
) {
  return db.transaction((tx) => {
    ownedCategory(tx, categoryId, userId);
    const existing = tx
      .select()
      .from(tables.shares)
      .where(eq(tables.shares.categoryId, categoryId))
      .get();
    if (existing) {
      if (expiresAt !== undefined) {
        const share = tx
          .update(tables.shares)
          .set({ expiresAt })
          .where(eq(tables.shares.id, existing.id))
          .returning()
          .get();
        return { share, created: false };
      }
      return { share: existing, created: false };
    }

    const share = tx
      .insert(tables.shares)
      .values({
        categoryId,
        token: crypto.randomUUID(),
        createdAt: new Date(),
        expiresAt: expiresAt ?? null,
      })
      .returning()
      .get();
    return { share, created: true };
  });
}

export function rotateShare(
  categoryId: number,
  userId: number,
  expiresAt: Date | null | undefined,
) {
  return db.transaction((tx) => {
    ownedCategory(tx, categoryId, userId);
    const existing = tx
      .select()
      .from(tables.shares)
      .where(eq(tables.shares.categoryId, categoryId))
      .get();
    if (!existing) {
      throw createError({ statusCode: 404, statusMessage: "Share not found" });
    }
    return tx
      .update(tables.shares)
      .set({
        token: crypto.randomUUID(),
        expiresAt: expiresAt === undefined ? existing.expiresAt : expiresAt,
      })
      .where(eq(tables.shares.id, existing.id))
      .returning()
      .get();
  });
}

function cloneCategory(
  tx: Transaction,
  sourceCategoryId: number,
  userId: number,
  isPublic: boolean,
): { categoryId: number; itemCount: number; trackCount: number } {
  const source = tx
    .select()
    .from(tables.categories)
    .where(eq(tables.categories.id, sourceCategoryId))
    .get();
  if (!source) {
    throw createError({ statusCode: 404, statusMessage: "Category not found" });
  }

  const now = new Date();
  const category = tx
    .insert(tables.categories)
    .values({
      userId,
      name: source.name,
      description: source.description,
      isPublic,
      createdAt: now,
      updatedAt: now,
    })
    .returning({ id: tables.categories.id })
    .get();

  const sourceItems = tx
    .select()
    .from(tables.items)
    .where(eq(tables.items.categoryId, sourceCategoryId))
    .orderBy(asc(tables.items.position), asc(tables.items.id))
    .all();
  let trackCount = 0;
  for (const sourceItem of sourceItems) {
    const item = tx
      .insert(tables.items)
      .values({
        categoryId: category.id,
        name: sourceItem.name,
        description: sourceItem.description,
        position: sourceItem.position,
        createdAt: now,
        updatedAt: now,
      })
      .returning({ id: tables.items.id })
      .get();
    const links = tx
      .select()
      .from(tables.itemTracks)
      .where(eq(tables.itemTracks.itemId, sourceItem.id))
      .orderBy(asc(tables.itemTracks.position), asc(tables.itemTracks.id))
      .all();
    if (links.length > 0) {
      tx.insert(tables.itemTracks)
        .values(
          links.map((link) => ({
            itemId: item.id,
            trackId: link.trackId,
            position: link.position,
            reason: link.reason,
            addedAt: now,
          })),
        )
        .run();
      trackCount += links.length;
    }
  }
  return { categoryId: category.id, itemCount: sourceItems.length, trackCount };
}

export function importPublicCategory(categoryId: number, userId: number) {
  return db.transaction((tx) => {
    const source = tx
      .select({ id: tables.categories.id })
      .from(tables.categories)
      .where(
        and(
          eq(tables.categories.id, categoryId),
          eq(tables.categories.isPublic, true),
        ),
      )
      .get();
    if (!source) {
      throw createError({ statusCode: 404, statusMessage: "Category not found" });
    }
    return cloneCategory(tx, source.id, userId, false);
  });
}

export function importLibrary(userId: number, input: LibraryExport) {
  return db.transaction((tx) => {
    let itemCount = 0;
    let trackCount = 0;
    const now = new Date();

    for (const categoryInput of input.categories) {
      const category = tx
        .insert(tables.categories)
        .values({
          userId,
          name: categoryInput.name,
          description: categoryInput.description,
          isPublic: categoryInput.isPublic,
          createdAt: now,
          updatedAt: now,
        })
        .returning({ id: tables.categories.id })
        .get();

      for (const [position, itemInput] of categoryInput.items.entries()) {
        const item = tx
          .insert(tables.items)
          .values({
            categoryId: category.id,
            name: itemInput.name,
            description: itemInput.description,
            position,
            createdAt: now,
            updatedAt: now,
          })
          .returning({ id: tables.items.id })
          .get();
        replaceTracks(tx, item.id, itemInput.tracks);
        itemCount += 1;
        trackCount += itemInput.tracks.length;
      }
    }

    return {
      imported: {
        categories: input.categories.length,
        items: itemCount,
        tracks: trackCount,
      },
    };
  });
}
