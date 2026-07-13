export interface NavLink {
  to: string;
  label: string;
  icon: string;
}

export const guestNavLinks: NavLink[] = [
  { to: "/intro", label: "Intro", icon: "mdi:book-open-variant" },
  { to: "/browse", label: "Browse", icon: "mdi:earth" },
];

export const authenticatedNavLinks: NavLink[] = [
  { to: "/", label: "Home", icon: "mdi:home" },
  { to: "/browse", label: "Browse", icon: "mdi:earth" },
  { to: "/statistics", label: "Stats", icon: "mdi:chart-line" },
];

export function navLinksFor(loggedIn: boolean): NavLink[] {
  return loggedIn ? authenticatedNavLinks : guestNavLinks;
}
