import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { ParkingLotsModule } from './parking-lots/module/parking-lots.module';
import { ReservationsModule } from './reservations/module/reservations.module';
import { ReviewsModule } from './reviews/module/reviews.module';

@Module({
  imports: [
    //cargar variables de entorno
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    //configurar TypeORM
     TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        url: configService.get('DATABASE_URL'),
        ssl: {
          rejectUnauthorized: false,
        },
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: true, // Cambiado a true para desarrollo - crea las tablas automáticamente
        logging: true, // Para ver las consultas SQL en consola
      }),
    }),
    UsersModule,
    AuthModule,
    ParkingLotsModule,
    ReservationsModule,
    ReviewsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
