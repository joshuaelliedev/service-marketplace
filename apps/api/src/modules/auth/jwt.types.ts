import type { UserRole } from "../users/user.schema";

export type JwtUser = {
  sub: string;
  email: string;
  role: UserRole;
};
