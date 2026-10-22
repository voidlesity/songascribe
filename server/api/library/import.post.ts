defineRouteMeta({
  openAPI: {
    tags: ["Library"],
    summary: "Import library JSON",
    description:
      "Validates a library export and appends all of its categories, items, tracks and reasons to the authenticated user's library in one transaction.",
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["version", "categories"],
            properties: {
              version: { type: "integer", enum: [1] },
              categories: { type: "array", items: { type: "object" } },
            },
          },
        },
      },
    },
    responses: {
      201: { description: "Import summary" },
      400: { description: "Invalid export or limits exceeded" },
      401: { description: "Unauthorized" },
      413: { description: "Import larger than 5 MiB" },
    },
  },
});

const MAX_BYTES = 5 * 1024 * 1024;
const MAX_CATEGORIES = 500;
const MAX_ITEMS = 5_000;
const MAX_TRACKS = 20_000;

function parseLibrary(value: unknown) {
  const root = asObject(value);
  if (root.version !== 1) badRequest("Unsupported library export version");
  if (!Array.isArray(root.categories))
    badRequest("categories must be an array");
  if (root.categories.length > MAX_CATEGORIES) {
    badRequest(`A library can have at most ${MAX_CATEGORIES} categories`);
  }

  let itemCount = 0;
  let trackCount = 0;
  return root.categories.map((rawCategory, categoryIndex) => {
    const field = `categories[${categoryIndex}]`;
    const category = asObject(rawCategory, field);
    if (!Array.isArray(category.items)) {
      badRequest(`${field}.items must be an array`);
    }
    itemCount += category.items.length;
    if (itemCount > MAX_ITEMS) {
      badRequest(`A library can have at most ${MAX_ITEMS} items`);
    }

    return {
      name: requiredString(category.name, `${field}.name`, 500),
      description:
        nullableString(category.description, `${field}.description`) ?? null,
      isPublic:
        optionalBoolean(category.isPublic, `${field}.isPublic`) ?? false,
      items: category.items.map((rawItem, itemIndex) => {
        const itemField = `${field}.items[${itemIndex}]`;
        const item = asObject(rawItem, itemField);
        const tracks = parseTrackList(item.tracks, `${itemField}.tracks`);
        trackCount += tracks.length;
        if (trackCount > MAX_TRACKS) {
          badRequest(`A library can have at most ${MAX_TRACKS} tracks`);
        }
        return {
          name: requiredString(item.name, `${itemField}.name`, 500),
          description:
            nullableString(item.description, `${itemField}.description`) ??
            null,
          tracks,
        };
      }),
    };
  });
}

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event);
  if (Number(getHeader(event, "content-length")) > MAX_BYTES) {
    throw createError({ statusCode: 413, statusMessage: "Import too large" });
  }
  const raw = await readRawBody(event, "utf8");
  if (!raw) badRequest("Body is required");
  if (Buffer.byteLength(raw) > MAX_BYTES) {
    throw createError({ statusCode: 413, statusMessage: "Import too large" });
  }

  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    badRequest("Body must be valid JSON");
  }
  const categories = parseLibrary(json);

  const imported = { categories: 0, items: 0, tracks: 0 };
  db.transaction((tx) => {
    const now = new Date();
    for (const { items, ...category } of categories) {
      const { id: categoryId } = tx
        .insert(tables.categories)
        .values({
          ...category,
          userId: user.id,
          createdAt: now,
          updatedAt: now,
        })
        .returning({ id: tables.categories.id })
        .get();
      imported.categories++;

      items.forEach(({ tracks, ...item }, position) => {
        const { id: itemId } = tx
          .insert(tables.items)
          .values({
            ...item,
            categoryId,
            position,
            createdAt: now,
            updatedAt: now,
          })
          .returning({ id: tables.items.id })
          .get();
        setItemTracks(tx, itemId, tracks);
        imported.items++;
        imported.tracks += tracks.length;
      });
    }
  });

  setResponseStatus(event, 201);
  return { imported };
});
