import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SequelizeModule } from '@nestjs/sequelize';
import { AppController } from './app.controller';
import { Web3ManagerModule } from './web3-manager/web3-manager.module';
import { DbManagerModule } from './db-manager/db-manager.module';
import { IpfsManagerModule } from './ipfs-manager/ipfs-manager.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: `.${process.env.NODE_ENV}.env`,
    }),
    SequelizeModule.forRoot({
      dialect: 'postgres',
      host: process.env.POSTGRES_HOST,
      port: +process.env.POSTGRES_PORT,
      username: process.env.POSTGRES_USER,
      password: process.env.POSTGRES_PASSWORD,
      database: process.env.POSTGRES_DB,
      models: [],
      autoLoadModels: true,
      synchronize: true,
      logging: false,
    }),
    Web3ManagerModule,
    DbManagerModule,
    IpfsManagerModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
