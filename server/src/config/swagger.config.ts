import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export const setupSwagger = (app: INestApplication): void => {
  const config = new DocumentBuilder()
    .setTitle('Cosmic Requiem Mini App API')
    .setDescription('Документация API для Cosmic Requiem Mini App Backend')
    .setVersion('1.0')
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document, {
    customSiteTitle: 'Cosmic Requiem API',
    customCss: '.swagger-ui .topbar { display: none }',
  });
};

