import { readZipArchiveEntries } from "@/domain/archive-lab/zip-archive";

const maximumCachedArchives = 16;
const cache = new Map<
  string,
  Promise<Awaited<ReturnType<typeof readZipArchiveEntries>>>
>();

/** ZIP blobs are immutable, so their central-directory index is revision-safe. */
export function getArchiveIndex(contentRevisionId: string, sourcePath: string) {
  const cached = cache.get(contentRevisionId);
  if (cached) {
    cache.delete(contentRevisionId);
    cache.set(contentRevisionId, cached);
    return cached;
  }

  const pending = readZipArchiveEntries(sourcePath).catch((error) => {
    cache.delete(contentRevisionId);
    throw error;
  });
  cache.set(contentRevisionId, pending);

  while (cache.size > maximumCachedArchives) {
    const oldestRevision = cache.keys().next().value;
    if (oldestRevision === undefined) break;
    cache.delete(oldestRevision);
  }

  return pending;
}
