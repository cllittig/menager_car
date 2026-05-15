import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export function setupSwagger(app: INestApplication) {
    const config = new DocumentBuilder()
        .setTitle('Controle de Estoque Veicular API')
        .setDescription('API para sistema de controle de estoque veicular')
        .setVersion('1.0')
        .addTag('auth', 'Endpoints de autenticação')
        .addTag('vehicles', 'Endpoints de veículos')
        .addTag('clients', 'Endpoints de clientes')
        .addTag('maintenance', 'Endpoints de manutenção')
        .addTag('transactions', 'Endpoints de transações')
        .addBearerAuth()
        .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document, {
        swaggerOptions: {
            persistAuthorization: true,
            tagsSorter: 'alpha',
            operationsSorter: 'alpha',
        },
        customSiteTitle: 'Control Car API Documentation',
    });
} 