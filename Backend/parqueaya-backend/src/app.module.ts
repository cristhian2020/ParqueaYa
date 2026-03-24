import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ParkingLotsModule } from './parking-lots/module/parking-lots.module';

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
        synchronize: false, // ¡Importante! En producción no usar true
        logging: true, // Para ver las consultas SQL en consola
      }),
    }),
    ParkingLotsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
