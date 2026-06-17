import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  Matches,
  MinLength,
  ValidateIf,
} from "class-validator";
import {
  KycIdType,
  KycProviderType,
} from "./kyc.schema";

const YMD = /^\d{4}-\d{2}-\d{2}$/;

export class SubmitKycDto {
  @IsString()
  @MinLength(2)
  legalFullName!: string;

  @IsString()
  @Matches(YMD, { message: "dateOfBirthYmd must be YYYY-MM-DD" })
  dateOfBirthYmd!: string;

  @IsString()
  @MinLength(2)
  nationality!: string;

  @IsString()
  @MinLength(7)
  mobileNumber!: string;

  @IsString()
  @MinLength(2)
  serviceCity!: string;

  @IsString()
  @MinLength(2)
  serviceProvince!: string;

  @IsString()
  @MinLength(5)
  addressLine1!: string;

  @IsOptional()
  @IsString()
  barangay?: string;

  @IsString()
  @MinLength(2)
  city!: string;

  @IsString()
  @MinLength(2)
  province!: string;

  @IsOptional()
  @IsString()
  postalCode?: string;

  @IsEnum(KycIdType)
  idType!: KycIdType;

  @IsString()
  @MinLength(3)
  idNumber!: string;

  @IsOptional()
  @IsString()
  @Matches(YMD, { message: "idExpiryYmd must be YYYY-MM-DD" })
  idExpiryYmd?: string;

  @IsEnum(KycProviderType)
  providerType!: KycProviderType;

  @ValidateIf((o: SubmitKycDto) => o.providerType === KycProviderType.BUSINESS)
  @IsString()
  @MinLength(2)
  businessName?: string;

  @ValidateIf((o: SubmitKycDto) => o.providerType === KycProviderType.BUSINESS)
  @IsString()
  @MinLength(3)
  businessRegistrationNumber?: string;

  @IsBoolean()
  declarationsAccepted!: boolean;
}
