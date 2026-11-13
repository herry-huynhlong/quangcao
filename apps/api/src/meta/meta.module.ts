import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { RolesGuard } from '../common/roles.guard';
import { MetaController } from './meta.controller';
import { MetaService } from './meta.service';

@Module({ imports:[DatabaseModule], controllers:[MetaController], providers:[MetaService,RolesGuard] })
export class MetaModule {}
