import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ReservationsService } from '../service/reservations.service';
import { CreateReservationDto } from '../dto/create-reservation.dto';
import { UpdateReservationDto } from '../dto/update-reservation.dto';
import { UpdateReservationStatusDto } from '../dto/update-reservation-status.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../../auth/guards/roles.guard';
import { UserRole } from '../../users/user.entity';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';

@ApiTags('reservations')
@Controller('reservations')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  /**
   * Crea una nueva reserva
   */
  @Post()
  @ApiOperation({ summary: 'Crear una nueva reserva de parqueo' })
  @ApiResponse({ status: 201, description: 'Reserva creada exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos inválidos o conflicto de horario' })
  @ApiResponse({ status: 404, description: 'Parqueo no encontrado' })
  create(@Request() req, @Body() createReservationDto: CreateReservationDto) {
    return this.reservationsService.create(req.user.userId, createReservationDto);
  }

  /**
   * Obtiene todas las reservas del usuario autenticado
   */
  @Get('my-reservations')
  @ApiOperation({ summary: 'Obtener todas mis reservas' })
  @ApiResponse({ status: 200, description: 'Lista de reservas del usuario' })
  findAllMyReservations(@Request() req) {
    return this.reservationsService.findAllByUser(req.user.userId);
  }

  /**
   * Obtiene todas las reservas de un parqueo (solo dueños)
   */
  @Get('parking-lot/:parkingLotId')
  @Roles(UserRole.OWNER)
  @ApiOperation({ summary: 'Obtener reservas de un parqueo (solo dueños)' })
  @ApiResponse({ status: 200, description: 'Lista de reservas del parqueo' })
  @ApiResponse({ status: 403, description: 'No tienes permiso para ver este parqueo' })
  findAllByParkingLot(@Request() req, @Param('parkingLotId') parkingLotId: string) {
    return this.reservationsService.findAllByParkingLot(parkingLotId, req.user.userId);
  }

  /**
   * Obtiene todas las reservas de todos los parqueos del dueño (solo dueños)
   */
  @Get('owner/all')
  @Roles(UserRole.OWNER)
  @ApiOperation({ summary: 'Obtener todas las reservas de mis parqueos (solo dueños)' })
  @ApiResponse({ status: 200, description: 'Lista de reservas de todos los parqueos' })
  findAllByOwner(@Request() req) {
    return this.reservationsService.findAllByOwner(req.user.userId);
  }

  /**
   * Obtiene una reserva específica por ID
   */
  @Get(':id')
  @ApiOperation({ summary: 'Obtener detalle de una reserva' })
  @ApiResponse({ status: 200, description: 'Detalle de la reserva' })
  @ApiResponse({ status: 403, description: 'No tienes permiso para ver esta reserva' })
  @ApiResponse({ status: 404, description: 'Reserva no encontrada' })
  findOne(@Request() req, @Param('id') id: string) {
    return this.reservationsService.findOne(id, req.user.userId, req.user.role);
  }

  /**
   * Actualiza una reserva
   */
  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar una reserva' })
  @ApiResponse({ status: 200, description: 'Reserva actualizada' })
  @ApiResponse({ status: 400, description: 'No se puede modificar esta reserva' })
  @ApiResponse({ status: 403, description: 'No tienes permiso para modificar' })
  update(
    @Request() req,
    @Param('id') id: string,
    @Body() updateReservationDto: UpdateReservationDto,
  ) {
    return this.reservationsService.update(id, req.user.userId, updateReservationDto);
  }

  /**
   * Actualiza el estado de una reserva
   */
  @Patch(':id/status')
  @ApiOperation({ summary: 'Actualizar estado de una reserva' })
  @ApiResponse({ status: 200, description: 'Estado actualizado' })
  @ApiResponse({ status: 400, description: 'Estado no permitido' })
  @ApiResponse({ status: 403, description: 'No tienes permiso para cambiar el estado' })
  updateStatus(
    @Request() req,
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateReservationStatusDto,
  ) {
    return this.reservationsService.updateStatus(
      id,
      req.user.userId,
      req.user.role,
      updateStatusDto,
    );
  }

  /**
   * Cancela una reserva (acción rápida para usuarios)
   */
  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancelar una reserva' })
  @ApiResponse({ status: 200, description: 'Reserva cancelada' })
  @ApiResponse({ status: 400, description: 'La reserva ya está cancelada o completada' })
  @ApiResponse({ status: 403, description: 'No puedes cancelar esta reserva' })
  cancel(@Request() req, @Param('id') id: string) {
    return this.reservationsService.cancel(id, req.user.userId);
  }

  /**
   * Elimina una reserva (solo dueños)
   */
  @Delete(':id')
  @Roles(UserRole.OWNER)
  @ApiOperation({ summary: 'Eliminar una reserva (solo dueños)' })
  @ApiResponse({ status: 200, description: 'Reserva eliminada' })
  @ApiResponse({ status: 403, description: 'No tienes permiso para eliminar esta reserva' })
  async delete(@Request() req, @Param('id') id: string) {
    await this.reservationsService.delete(id, req.user.userId);
    return { message: 'Reserva eliminada correctamente' };
  }

  /**
   * Registra tiempo real de salida y calcula recargos (solo dueños)
   */
  @Post(':id/record-exit')
  @Roles(UserRole.OWNER)
  @ApiOperation({ summary: 'Registrar salida y calcular recargos (solo dueños)' })
  @ApiResponse({ status: 200, description: 'Salida registrada con recargo calculado' })
  @ApiResponse({ status: 403, description: 'No tienes permiso para esta acción' })
  recordExit(
    @Request() req,
    @Param('id') id: string,
    @Body('actual_end_time') actualEndTime?: string,
  ) {
    return this.reservationsService.recordActualEndTime(
      id,
      req.user.userId,
      actualEndTime ? new Date(actualEndTime) : undefined,
    );
  }

  /**
   * Verifica disponibilidad de un parqueo
   */
  @Get('parking-lot/:parkingLotId/availability')
  @ApiOperation({ summary: 'Verificar disponibilidad de un parqueo' })
  @ApiResponse({ status: 200, description: 'Disponibilidad verificada' })
  checkAvailability(
    @Request() req,
    @Param('parkingLotId') parkingLotId: string,
    @Query('start_time') startTime: string,
    @Query('end_time') endTime: string,
  ) {
    return this.reservationsService.checkAvailability(
      parkingLotId,
      new Date(startTime),
      new Date(endTime),
    );
  }
}
