import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
@Controller() export class HealthController { constructor(private readonly db: DatabaseService) {} @Get('health') health() { return { status:'ok' }; } @Get('ready') async ready() { try { await this.db.healthcheck(); return { status:'ready' }; } catch { throw new ServiceUnavailableException('Database unavailable'); } } }
