import { IsEmail, IsIn, IsOptional, IsString, MinLength } from "class-validator";
import { UserRole } from "../../users/user.schema";

export class RegisterDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsOptional()
  @IsString()
  fullName?: string;

  @IsIn([UserRole.CUSTOMER, UserRole.PROVIDER])
  role!: UserRole.CUSTOMER | UserRole.PROVIDER;
}
