import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { UsersService } from "../users/users.service";
import type { JwtUser } from "./jwt.types";
import type { UserDocument } from "../users/user.schema";
import { UserRole } from "../users/user.schema";

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    private readonly jwt: JwtService,
  ) {}

  async register(input: {
    email: string;
    password: string;
    fullName?: string;
    role: UserRole.CUSTOMER | UserRole.PROVIDER;
  }) {
    const user = await this.users.createUser(input);
    return this.issueTokens(user);
  }

  async login(email: string, password: string) {
    const user = await this.users.validateCredentials(email, password);
    return this.issueTokens(user);
  }

  async me(userId: string) {
    const user = await this.users.findById(userId);
    if (!user) return null;
    return this.sanitize(user);
  }

  private issueTokens(user: UserDocument) {
    const payload: JwtUser = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };
    const accessToken = this.jwt.sign(payload);
    return { accessToken, user: this.sanitize(user) };
  }

  private sanitize(user: UserDocument) {
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      fullName: user.fullName,
      kycStatus: user.kycStatus,
      walletAvailableCents: user.walletAvailableCents,
      walletEscrowCents: user.walletEscrowCents,
      providerFeePercent: user.providerFeePercent,
      providerFeeFixedCents: user.providerFeeFixedCents,
    };
  }
}
