declare module "#auth-utils" {
  interface User {
    id: number;
    username: string;
    avatar: string | null;
    theme: string;
  }
}

export {};
