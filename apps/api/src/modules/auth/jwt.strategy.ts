import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import type { JwtUser } from "./jwt.types";
import { UserRole } from "../users/user.schema";

type JwtPayload = { sub: string; email: string; role: UserRole };

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, "jwt") {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET ?? "dev-secret-change-me",
    });
  }

  validate(payload: JwtPayload): JwtUser {
    return {
      sub: payload.sub,
      email: payload.email,
      role: payload.role,
    };
  }
}
