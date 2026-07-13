import type { UpdateUserBody } from "#shared/contracts";
import { apiFetch, type ApiFetcher } from "./api";

export const accountApi = {
  update(body: UpdateUserBody, fetcher: ApiFetcher = $fetch) {
    return apiFetch<unknown>(fetcher, "/api/users/me", { method: "PATCH", body });
  },
  delete(fetcher: ApiFetcher = $fetch) {
    return apiFetch<null>(fetcher, "/api/users/me", { method: "DELETE" });
  },
  uploadAvatar(body: FormData, fetcher: ApiFetcher = $fetch) {
    return apiFetch<{ avatar: string | null }>(fetcher, "/api/users/me/avatar", { method: "POST", body });
  },
  deleteAvatar(fetcher: ApiFetcher = $fetch) {
    return apiFetch<null>(fetcher, "/api/users/me/avatar", { method: "DELETE" });
  },
};
