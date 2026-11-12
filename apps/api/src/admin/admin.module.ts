import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { RolesGuard } from '../common/roles.guard';

@Module({ imports: [DatabaseModule], controllers: [AdminController], providers: [AdminService, RolesGuard] })
export class AdminModule {}
