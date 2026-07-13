import type { LibraryExport, LibraryImportResult } from "#shared/contracts";
import { apiFetch, type ApiFetcher } from "./api";

export const libraryApi = {
  export(fetcher: ApiFetcher = $fetch) {
    return apiFetch<LibraryExport>(fetcher, "/api/library/export");
  },
  import(data: LibraryExport, fetcher: ApiFetcher = $fetch) {
    return apiFetch<LibraryImportResult>(fetcher, "/api/library/import", { method: "POST", body: data });
  },
};
