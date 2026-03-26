// src/parking-lots/parking-lot.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../users/user.entity';

@Entity('parking_lots')
export class ParkingLot {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  owner_id: string;

  @ManyToOne(() => User, (user) => user.parking_lots)
  @JoinColumn({ name: 'owner_id' })
  owner: User;

  @Column()
  name: string;

  @Column({ nullable: true })
  address: string;

  @Column({ nullable: true })
  description: string;

  @Column('geometry', {
    spatialFeatureType: 'Point',
    srid: 4326,
    nullable: true,
  })
  @Index({ spatial: true })
  location: any; // TypeORM maneja esto como objeto GeoJSON

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  price_per_hour: number;

  @Column({ nullable: true })
  total_spots: number;

  @Column({ nullable: true })
  available_spots: number;

  @Column({ default: false })
  has_security: boolean;

  @Column({ default: false })
  has_cctv: boolean;

  @Column({ default: false })
  is_24h: boolean;

  @Column({ type: 'time', nullable: true })
  opening_time: string;

  @Column({ type: 'time', nullable: true })
  closing_time: string;

  @Column('simple-array', { nullable: true })
  photos: string[];

  @Column({ default: false })
  verified: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}