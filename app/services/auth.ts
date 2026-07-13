import type { LoginBody, RegisterBody, SessionUser } from "#shared/contracts";
import { apiFetch, type ApiFetcher } from "./api";

export const authApi = {
  login(body: LoginBody, fetcher: ApiFetcher = $fetch) {
    return apiFetch<SessionUser>(fetcher, "/api/auth/login", { method: "POST", body });
  },
  register(body: RegisterBody, fetcher: ApiFetcher = $fetch) {
    return apiFetch<SessionUser>(fetcher, "/api/auth/register", { method: "POST", body });
  },
};
