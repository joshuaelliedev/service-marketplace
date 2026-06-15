import { Module } from "@nestjs/common";
import { UsersModule } from "../users/users.module";
import { ProviderController } from "./provider.controller";

@Module({
  imports: [UsersModule],
  controllers: [ProviderController],
})
export class ProviderModule {}
