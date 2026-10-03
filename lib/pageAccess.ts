export const PAGE_ACCESS_OPTIONS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/tasks", label: "Tasks" },
  { href: "/employees", label: "Employees" },
  { href: "/attendance", label: "Attendance" },
  { href: "/contacts", label: "Contacts" },
  { href: "/employers", label: "Employers" },
  { href: "/settings", label: "Account Settings" },
] as const;

export type PageAccessHref = (typeof PAGE_ACCESS_OPTIONS)[number]["href"];

export const DEFAULT_PAGE_ACCESS: PageAccessHref[] = ["/dashboard", "/tasks", "/settings"];

export function isPageAccessHref(value: unknown): value is PageAccessHref {
  return PAGE_ACCESS_OPTIONS.some((option) => option.href === value);
}

export function hasPageAccess(pathname: string, accessiblePages: readonly string[]) {
  return accessiblePages.some((page) => pathname === page || pathname.startsWith(`${page}/`));
}