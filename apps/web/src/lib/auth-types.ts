export type UserRole = "customer" | "provider" | "admin";

export type Me = {
  id: string;
  email: string;
  role: UserRole;
  fullName?: string;
  kycStatus?: string;
  walletAvailableCents?: number;
  walletEscrowCents?: number;
};
