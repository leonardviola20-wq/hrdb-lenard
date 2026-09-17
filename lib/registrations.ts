export type Registration = {
  email: string;
  password: string;
  role: "PENDING" | "USER" | "ADMIN";
};

export const registrations: Registration[] = [
  // Example:
  { email: "test@hrdb.com", password: "1234", role: "PENDING" }
];
