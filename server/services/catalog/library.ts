import type { LibraryExport } from "../../../shared/contracts";
import {
  asObject,
  badRequest,
  booleanValue,
  nullableDescription,
  parseTrackList,
  requiredString,
} from "../../utils/validation";
import { getOwnedCategoryDetails } from "./queries";

const MAX_CATEGORIES = 500;
const MAX_ITEMS = 5_000;
const MAX_TRACK_LINKS = 20_000;

export function exportLibrary(userId: number): LibraryExport {
  const categories = getOwnedCategoryDetails(userId);
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    categories: categories.map((category) => ({
      name: category.name,
      description: category.description,
      isPublic: category.isPublic,
      items: category.items.map((item) => ({
        name: item.name,
        description: item.description,
        position: item.position,
        tracks: item.tracks.map((track) => ({
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
          reason: track.reason,
        })),
      })),
    })),
  };
}

export function validateLibraryImport(value: unknown): LibraryExport {
  const root = asObject(value);
  if (root.version !== 1) badRequest("Unsupported library export version");
  if (!Array.isArray(root.categories)) {
    badRequest("categories must be an array");
  }
  if (root.categories.length > MAX_CATEGORIES) {
    badRequest(`categories cannot contain more than ${MAX_CATEGORIES} entries`);
  }

  let itemCount = 0;
  let trackCount = 0;
  const categories = root.categories.map((rawCategory, categoryIndex) => {
    const field = `categories[${categoryIndex}]`;
    const category = asObject(rawCategory, field);
    if (!Array.isArray(category.items)) {
      badRequest(`${field}.items must be an array`);
    }
    itemCount += category.items.length;
    if (itemCount > MAX_ITEMS) {
      badRequest(`Library cannot contain more than ${MAX_ITEMS} items`);
    }

    const items = category.items.map((rawItem, itemIndex) => {
      const itemField = `${field}.items[${itemIndex}]`;
      const item = asObject(rawItem, itemField);
      const tracks = parseTrackList(
        item.tracks,
        `${itemField}.tracks`,
        MAX_TRACK_LINKS,
      );
      trackCount += tracks.length;
      if (trackCount > MAX_TRACK_LINKS) {
        badRequest(
          `Library cannot contain more than ${MAX_TRACK_LINKS} track links`,
        );
      }
      return {
        name: requiredString(item.name, `${itemField}.name`, 500),
        description: nullableDescription(
          item.description,
          `${itemField}.description`,
        ) ?? null,
        position: itemIndex,
        tracks,
      };
    });

    return {
      name: requiredString(category.name, `${field}.name`, 500),
      description:
        nullableDescription(category.description, `${field}.description`) ?? null,
      isPublic: booleanValue(category.isPublic, `${field}.isPublic`),
      items,
    };
  });

  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    categories,
  };
}
