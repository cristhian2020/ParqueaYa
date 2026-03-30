import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In } from 'typeorm';
import { Reservation, ReservationStatus } from '../reservation.entity';
import { CreateReservationDto } from '../dto/create-reservation.dto';
import { UpdateReservationDto } from '../dto/update-reservation.dto';
import { UpdateReservationStatusDto } from '../dto/update-reservation-status.dto';
import { ParkingLot } from '../../parking-lots/parking-lot.entity';
import { User, UserRole } from '../../users/user.entity';

@Injectable()
export class ReservationsService {
  constructor(
    @InjectRepository(Reservation)
    private readonly reservationRepository: Repository<Reservation>,
    @InjectRepository(ParkingLot)
    private readonly parkingLotRepository: Repository<ParkingLot>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * Verifica si hay conflictos de reservas para un espacio específico en un rango de tiempo
   * Si no se especifica spot_number, verifica conflictos en todo el parqueo
   */
  private async hasTimeConflict(
    parkingLotId: string,
    startTime: Date,
    endTime: Date,
    excludeReservationId?: string,
    spotNumber?: number,
  ): Promise<boolean> {
    const query = this.reservationRepository
      .createQueryBuilder('reservation')
      .where('reservation.parking_lot_id = :parkingLotId', { parkingLotId })
      .andWhere('reservation.status NOT IN (:...cancelledStatuses)', {
        cancelledStatuses: [ReservationStatus.CANCELLED],
      })
      .andWhere(
        '(reservation.start_time < :endTime AND reservation.end_time > :startTime)',
        { startTime, endTime },
      );

    // Si se especifica un espacio, verificar solo ese espacio
    if (spotNumber !== undefined && spotNumber !== null) {
      query.andWhere('reservation.spot_number = :spotNumber', { spotNumber });
    }

    if (excludeReservationId) {
      query.andWhere('reservation.id != :excludeId', { excludeId: excludeReservationId });
    }

    const conflict = await query.getOne();
    return !!conflict;
  }

  /**
   * Calcula el precio total basado en las horas y el precio del parqueo
   */
  private calculateTotalPrice(
    startTime: Date,
    endTime: Date,
    pricePerHour: number,
  ): number {
    const hours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
    const roundedHours = Math.ceil(hours);
    return roundedHours * pricePerHour;
  }

  /**
   * Calcula recargo por tiempo excedido
   * 15 minutos de gracia, luego se cobra por hora adicional
   */
  calculateOvertimePrice(
    scheduledEndTime: Date,
    actualEndTime: Date,
    pricePerHour: number,
  ): { overtimeMinutes: number; overtimePrice: number; hasGracePeriod: boolean } {
    const gracePeriodMinutes = 15; // 15 minutos de gracia
    const diffMs = actualEndTime.getTime() - scheduledEndTime.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    // Si no hay excedente o está dentro de la gracia
    if (diffMinutes <= gracePeriodMinutes) {
      return {
        overtimeMinutes: Math.max(0, diffMinutes),
        overtimePrice: 0,
        hasGracePeriod: diffMinutes > 0,
      };
    }

    // Calcular minutos excedentes después de la gracia
    const chargeableMinutes = diffMinutes - gracePeriodMinutes;
    const chargeableHours = Math.ceil(chargeableMinutes / 60);
    const overtimePrice = chargeableHours * pricePerHour;

    return {
      overtimeMinutes: diffMinutes,
      overtimePrice,
      hasGracePeriod: true,
    };
  }

  /**
   * Registra el tiempo real de salida y calcula recargos
   * Automáticamente cambia el estado a 'completed'
   */
  async recordActualEndTime(
    reservationId: string,
    ownerId: string,
    actualEndTime?: Date,
  ): Promise<{ overtimePrice: number; overtimeMinutes: number }> {
    const reservation = await this.reservationRepository.findOne({
      where: { id: reservationId },
      relations: ['parking_lot'],
    });

    if (!reservation) {
      throw new NotFoundException('Reserva no encontrada');
    }

    // Verificar que el usuario es el dueño del parqueo
    if (reservation.parking_lot.owner_id !== ownerId) {
      throw new ForbiddenException('No tienes permiso para modificar esta reserva');
    }

    const endTime = actualEndTime || new Date();
    const overtime = this.calculateOvertimePrice(
      reservation.end_time,
      endTime,
      reservation.parking_lot.price_per_hour || 0,
    );

    // Actualizar reserva: registra salida, recargo y cambia estado a completed
    await this.reservationRepository.update(reservationId, {
      actual_end_time: endTime,
      overtime_price: overtime.overtimePrice,
      status: ReservationStatus.COMPLETED,
    });

    return {
      overtimePrice: overtime.overtimePrice,
      overtimeMinutes: overtime.overtimeMinutes,
    };
  }

  /**
   * Crea una nueva reserva
   */
  async create(userId: string, dto: CreateReservationDto): Promise<Reservation> {
    const { parking_lot_id, start_time, end_time, spot_number, vehicle_plate, notes } = dto;

    // Validar que el parqueo existe
    const parkingLot = await this.parkingLotRepository.findOne({
      where: { id: parking_lot_id },
    });

    if (!parkingLot) {
      throw new NotFoundException(`El parqueo con ID ${parking_lot_id} no existe`);
    }

    // Validar fechas
    const startTime = new Date(start_time);
    const endTime = new Date(end_time);

    if (startTime >= endTime) {
      throw new BadRequestException('La fecha de inicio debe ser anterior a la fecha de fin');
    }

    if (startTime < new Date()) {
      throw new BadRequestException('No se pueden crear reservas en el pasado');
    }

    // Verificar conflictos de tiempo en el espacio específico (si se especificó)
    // o en todo el parqueo si no se especificó espacio
    const hasConflict = await this.hasTimeConflict(
      parking_lot_id,
      startTime,
      endTime,
      undefined,
      spot_number,
    );
    if (hasConflict) {
      throw new ConflictException(
        spot_number
          ? `El espacio #${spot_number} ya está reservado en el rango de tiempo seleccionado`
          : 'Ya existe una reserva activa para este parqueo en el rango de tiempo seleccionado',
      );
    }

    // Calcular precio total
    const totalPrice = this.calculateTotalPrice(
      startTime,
      endTime,
      parkingLot.price_per_hour || 0,
    );

    // Determinar estado inicial basado en el dueño del parqueo
    // Si el usuario es el dueño, se confirma automáticamente
    const user = await this.userRepository.findOne({ where: { id: userId } });
    const initialStatus =
      parkingLot.owner_id === userId
        ? ReservationStatus.CONFIRMED
        : ReservationStatus.PENDING;

    // Crear reserva
    const reservation = this.reservationRepository.create({
      user_id: userId,
      parking_lot_id: parking_lot_id,
      start_time: startTime,
      end_time: endTime,
      spot_number,
      vehicle_plate,
      status: initialStatus,
      total_price: totalPrice,
      overtime_price: 0,
      notes,
    });

    return await this.reservationRepository.save(reservation);
  }

  /**
   * Obtiene todas las reservas del usuario autenticado
   */
  async findAllByUser(userId: string): Promise<Reservation[]> {
    return await this.reservationRepository.find({
      where: { user_id: userId },
      relations: ['parking_lot'],
      order: { start_time: 'DESC' },
    });
  }

  /**
   * Obtiene todas las reservas de un parqueo específico (para dueños)
   */
  async findAllByParkingLot(
    parkingLotId: string,
    ownerId: string,
  ): Promise<Reservation[]> {
    // Verificar que el usuario es el dueño del parqueo
    const parkingLot = await this.parkingLotRepository.findOne({
      where: { id: parkingLotId, owner_id: ownerId },
    });

    if (!parkingLot) {
      throw new ForbiddenException(
        'No tienes permiso para ver las reservas de este parqueo',
      );
    }

    return await this.reservationRepository.find({
      where: { parking_lot_id: parkingLotId },
      relations: ['user'],
      order: { start_time: 'DESC' },
    });
  }

  /**
   * Obtiene todas las reservas de todos los parqueos del dueño (para dueños)
   */
  async findAllByOwner(ownerId: string): Promise<Reservation[]> {
    // Obtener todos los parqueos del dueño
    const ownerParkingLots = await this.parkingLotRepository.find({
      where: { owner_id: ownerId },
    });

    if (ownerParkingLots.length === 0) {
      return [];
    }

    const parkingLotIds = ownerParkingLots.map((lot) => lot.id);

    // Obtener todas las reservas de esos parqueos
    return await this.reservationRepository.find({
      where: { parking_lot_id: In(parkingLotIds) },
      relations: ['user', 'parking_lot'],
      order: { start_time: 'DESC' },
    });
  }

  /**
   * Obtiene una reserva específica por ID
   */
  async findOne(id: string, userId: string, userRole: UserRole): Promise<Reservation> {
    const reservation = await this.reservationRepository.findOne({
      where: { id },
      relations: ['user', 'parking_lot'],
    });

    if (!reservation) {
      throw new NotFoundException(`La reserva con ID ${id} no existe`);
    }

    // Validar permisos
    const isOwner = userRole === UserRole.OWNER;
    const isResourceOwner = reservation.parking_lot.owner_id === userId;

    if (reservation.user_id !== userId && !(isOwner && isResourceOwner)) {
      throw new ForbiddenException('No tienes permiso para ver esta reserva');
    }

    return reservation;
  }

  /**
   * Actualiza una reserva (solo usuarios con permiso)
   */
  async update(
    id: string,
    userId: string,
    dto: UpdateReservationDto,
  ): Promise<Reservation> {
    const reservation = await this.findOne(id, userId, UserRole.USER);

    // Solo el usuario que creó la reserva puede modificarla (excepto estado)
    if (reservation.user_id !== userId) {
      throw new ForbiddenException('No tienes permiso para modificar esta reserva');
    }

    // No permitir modificar si ya está cancelada o completada
    if (
      reservation.status === ReservationStatus.CANCELLED ||
      reservation.status === ReservationStatus.COMPLETED
    ) {
      throw new BadRequestException(
        'No se puede modificar una reserva cancelada o completada',
      );
    }

    // Si se modifica el spot_number, verificar que no esté ocupado
    if (dto.spot_number && dto.spot_number !== reservation.spot_number) {
      const hasConflict = await this.hasTimeConflict(
        reservation.parking_lot_id,
        reservation.start_time,
        reservation.end_time,
        id,
        dto.spot_number,
      );
      if (hasConflict) {
        throw new ConflictException(
          `El espacio #${dto.spot_number} ya está ocupado en ese horario`,
        );
      }
    }

    await this.reservationRepository.update(id, dto);
    return this.findOne(id, userId, UserRole.USER);
  }

  /**
   * Actualiza el estado de una reserva
   */
  async updateStatus(
    id: string,
    userId: string,
    userRole: UserRole,
    dto: UpdateReservationStatusDto,
  ): Promise<Reservation | null> {
    const reservation = await this.reservationRepository.findOne({
      where: { id },
      relations: ['parking_lot'],
    });

    if (!reservation) {
      throw new NotFoundException(`La reserva con ID ${id} no existe`);
    }

    const isParkingLotOwner = reservation.parking_lot.owner_id === userId;
    const isReservationOwner = reservation.user_id === userId;

    // Validar permisos según el estado
    if (dto.status === ReservationStatus.CANCELLED) {
      // El usuario puede cancelar su propia reserva, o el dueño del parqueo
      if (!isReservationOwner && !isParkingLotOwner) {
        throw new ForbiddenException('No tienes permiso para cancelar esta reserva');
      }
    } else if (
      dto.status === ReservationStatus.CONFIRMED ||
      dto.status === ReservationStatus.COMPLETED
    ) {
      // Solo el dueño del parqueo puede confirmar o completar
      if (!isParkingLotOwner) {
        throw new ForbiddenException(
          'Solo el dueño del parqueo puede cambiar a este estado',
        );
      }
    } else {
      throw new BadRequestException('Estado no permitido para esta operación');
    }

    await this.reservationRepository.update(id, {
      status: dto.status,
      cancelled_by_owner: dto.status === ReservationStatus.CANCELLED && isParkingLotOwner,
    });

    return await this.reservationRepository.findOne({
      where: { id },
      relations: ['user', 'parking_lot'],
    });
  }

  /**
   * Cancela una reserva (método rápido para usuarios)
   */
  async cancel(id: string, userId: string): Promise<Reservation | null> {
    const reservation = await this.findOne(id, userId, UserRole.USER);

    if (reservation.user_id !== userId) {
      throw new ForbiddenException('Solo puedes cancelar tus propias reservas');
    }

    if (reservation.status === ReservationStatus.CANCELLED) {
      throw new BadRequestException('La reserva ya está cancelada');
    }

    if (reservation.status === ReservationStatus.COMPLETED) {
      throw new BadRequestException('No se puede cancelar una reserva completada');
    }

    await this.reservationRepository.update(id, {
      status: ReservationStatus.CANCELLED,
    });

    return await this.reservationRepository.findOne({
      where: { id },
      relations: ['parking_lot'],
    });
  }

  /**
   * Elimina una reserva permanentemente (solo dueños)
   */
  async delete(id: string, ownerId: string): Promise<void> {
    const reservation = await this.reservationRepository.findOne({
      where: { id },
      relations: ['parking_lot'],
    });

    if (!reservation) {
      throw new NotFoundException('Reserva no encontrada');
    }

    // Verificar que el usuario es el dueño del parqueo
    if (reservation.parking_lot.owner_id !== ownerId) {
      throw new ForbiddenException('No tienes permiso para eliminar esta reserva');
    }

    // Solo se pueden eliminar reservas canceladas o completadas
    if (
      reservation.status !== ReservationStatus.CANCELLED &&
      reservation.status !== ReservationStatus.COMPLETED
    ) {
      throw new BadRequestException(
        'Solo se pueden eliminar reservas canceladas o completadas. Primero cambia el estado de la reserva.',
      );
    }

    await this.reservationRepository.delete(id);
  }

  /**
   * Obtiene reservas activas para un parqueo en un rango de tiempo
   */
  async getActiveReservations(
    parkingLotId: string,
    startTime: Date,
    endTime: Date,
  ): Promise<Reservation[]> {
    return await this.reservationRepository.find({
      where: {
        parking_lot_id: parkingLotId,
        status: Between(ReservationStatus.PENDING, ReservationStatus.CONFIRMED),
      },
      relations: ['user'],
    });
  }

  /**
   * Verifica disponibilidad de un parqueo en un rango de tiempo
   */
  async checkAvailability(
    parkingLotId: string,
    startTime: Date,
    endTime: Date,
  ): Promise<{ available: boolean; conflict?: Reservation }> {
    const hasConflict = await this.hasTimeConflict(parkingLotId, startTime, endTime);

    if (hasConflict) {
      const conflict = await this.reservationRepository.findOne({
        where: {
          parking_lot_id: parkingLotId,
        },
        relations: ['user'],
      });
      return { available: false, conflict: conflict! };
    }

    return { available: true };
  }
}
