import type { DateTimeString } from "./catalog";

export interface SessionUser {
  id: number;
  username: string;
  avatar: string | null;
  theme: string;
}

export interface User extends SessionUser {
  email: string;
  createdAt: DateTimeString;
  updatedAt?: DateTimeString;
}
