export const AVATAR_MAX_BYTES = 2 * 1024 * 1024; // 2 MB

export type AvatarKind = { ext: string; mime: string };

const SIGNATURES: { kind: AvatarKind; test: (b: Buffer) => boolean }[] = [
  {
    kind: { ext: "webp", mime: "image/webp" },
    test: (b) =>
      b.length > 12 &&
      b.toString("ascii", 0, 4) === "RIFF" &&
      b.toString("ascii", 8, 12) === "WEBP",
  },
  {
    kind: { ext: "png", mime: "image/png" },
    test: (b) =>
      b.length > 8 &&
      b[0] === 0x89 &&
      b[1] === 0x50 &&
      b[2] === 0x4e &&
      b[3] === 0x47,
  },
  {
    kind: { ext: "jpg", mime: "image/jpeg" },
    test: (b) => b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  },
  {
    kind: { ext: "gif", mime: "image/gif" },
    test: (b) => b.length > 4 && b.toString("ascii", 0, 4) === "GIF8",
  },
];

/**
 * Inspect the leading bytes of a buffer to confirm it is a real image.
 * Returns the detected kind or `null` if the content is not a supported image.
 */
export function detectImage(buffer: Buffer): AvatarKind | null {
  for (const { kind, test } of SIGNATURES) {
    if (test(buffer)) return kind;
  }
  return null;
}

/**
 * Build the public, cache-busted URL that serves a user's avatar from the
 * database. Only this short string is stored in the session/`avatar` column.
 */
export function avatarUrl(userId: number): string {
  return `/api/avatars/${userId}?v=${Date.now()}`;
}
