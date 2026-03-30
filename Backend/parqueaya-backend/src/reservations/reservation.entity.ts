// src/reservations/reservation.entity.ts
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../users/user.entity';
import { ParkingLot } from '../parking-lots/parking-lot.entity';

export enum ReservationStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
  NO_SHOW = 'no_show',
}

@Entity('reservations')
export class Reservation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column()
  user_id: string;

  @ManyToOne(() => User, (user) => user.reservations)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Index()
  @Column()
  parking_lot_id: string;

  @ManyToOne(() => ParkingLot, (parkingLot) => parkingLot.reservations)
  @JoinColumn({ name: 'parking_lot_id' })
  parking_lot: ParkingLot;

  @Column({ nullable: true })
  spot_number: number;

  @Column({ type: 'timestamp with time zone' })
  start_time: Date;

  @Column({ type: 'timestamp with time zone' })
  end_time: Date;

  @Column({
    type: 'enum',
    enum: ReservationStatus,
    default: ReservationStatus.PENDING,
  })
  status: ReservationStatus;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    transformer: {
      from: (value: string | number) => typeof value === 'string' ? parseFloat(value) : value,
      to: (value: number) => value,
    },
  })
  total_price: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
    transformer: {
      from: (value: string | number) => typeof value === 'string' ? parseFloat(value) : value,
      to: (value: number) => value,
    },
  })
  overtime_price: number;

  @Column({ type: 'timestamp with time zone', nullable: true })
  actual_end_time: Date;

  @Column({ nullable: true })
  notes: string;

  @Column({ nullable: true })
  vehicle_plate: string;

  @Column({ default: false })
  cancelled_by_owner: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
