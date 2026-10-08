export type AssignedByAccount = {
  name: string | null;
  username: string | null;
  email: string;
};

export function parseAssignedByUserId(value: string | null) {
  if (!value || !/^\d+$/.test(value)) return null;
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

export function getAssignedByLabel(
  value: string | null,
  usersById: ReadonlyMap<number, AssignedByAccount>,
) {
  if (!value) return null;
  const userId = parseAssignedByUserId(value);
  if (userId === null) return value === "ADMIN" ? "Admin" : value;

  const user = usersById.get(userId);
  if (!user) return `Unknown account (ID: ${userId})`;
  return user.name?.trim() || user.username?.trim() || user.email;
}
