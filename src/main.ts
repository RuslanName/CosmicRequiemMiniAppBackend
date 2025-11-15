import { NestFactory } from '@nestjs/core';
import { AppModule } from './modules/app.module';
import { setupCors } from './config/origin.config';
import { setupSwagger } from './config/swagger.config';
import { ENV } from "./config/constants";
import { initSettings } from './config/setting.config';
import { SettingService } from './modules/setting/services/setting.service';
import { setupCluster } from './config/cluster.config';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const settingService = app.get(SettingService);

  app.useStaticAssets(join(process.cwd(), 'data'), {
    prefix: '/data/',
  });

  setupCors(app);
  setupSwagger(app);

  await initSettings(settingService);
  
  const port = ENV.PORT ?? 5000;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port} (PID: ${process.pid})`);
}

setupCluster(bootstrap);