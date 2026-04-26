import { Body, Controller, Delete, Get, Param, Patch, Post, ValidationPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUserId } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { OPERATIONAL_ROLES } from '../auth/roles.constants';
import { CreateReportScheduleDto } from './dto/create-report-schedule.dto';
import { GenerateReportDto } from './dto/generate-report.dto';
import { UpdateReportScheduleDto } from './dto/update-report-schedule.dto';
import { ReportsService } from './reports.service';

@ApiTags('Relatórios')
@ApiBearerAuth()
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post('generate')
  @Roles(...OPERATIONAL_ROLES)
  @ApiOperation({ summary: 'Gerar relatório (persiste snapshot)' })
  generate(
    @Body(new ValidationPipe({ whitelist: true })) dto: GenerateReportDto,
    @CurrentUserId() userId: string,
  ) {
    return this.reportsService.generate(dto, userId);
  }

  @Get('history')
  @Roles(...OPERATIONAL_ROLES)
  @ApiOperation({ summary: 'Histórico de relatórios gerados' })
  history(@CurrentUserId() userId: string) {
    return this.reportsService.history(userId);
  }

  @Get('history/:id')
  @Roles(...OPERATIONAL_ROLES)
  @ApiOperation({ summary: 'Obter snapshot completo' })
  getSnapshot(@Param('id') id: string, @CurrentUserId() userId: string) {
    return this.reportsService.getSnapshot(id, userId);
  }

  @Get('schedules')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Listar agendamentos de relatórios' })
  listSchedules(@CurrentUserId() userId: string) {
    return this.reportsService.listSchedules(userId);
  }

  @Post('schedules')
  @Roles('ADMIN')
  @ApiOperation({
    summary: 'Configurar envio automático de relatórios',
    description: 'Persiste a configuração; o envio efetivo em produção pode exigir worker.',
  })
  createSchedule(
    @Body(new ValidationPipe({ whitelist: true })) dto: CreateReportScheduleDto,
    @CurrentUserId() userId: string,
  ) {
    return this.reportsService.createSchedule(dto, userId);
  }

  @Patch('schedules/:id')
  @Roles('ADMIN')
  updateSchedule(
    @Param('id') id: string,
    @Body(new ValidationPipe({ whitelist: true })) dto: UpdateReportScheduleDto,
    @CurrentUserId() userId: string,
  ) {
    return this.reportsService.updateSchedule(id, dto, userId);
  }

  @Delete('schedules/:id')
  @Roles('ADMIN')
  removeSchedule(@Param('id') id: string, @CurrentUserId() userId: string) {
    return this.reportsService.removeSchedule(id, userId);
  }
}
