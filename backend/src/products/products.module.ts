import { Module } from '@nestjs/common';
import { ProductsApplicationService } from './application/products.application-service';
import { ProductRepository } from './domain/repositories/product.repository';
import { SupabaseProductRepository } from './infrastructure/persistence/supabase-product.repository';
import { ProductsController } from './products.controller';

@Module({
  controllers: [ProductsController],
  providers: [
    { provide: ProductRepository, useClass: SupabaseProductRepository },
    ProductsApplicationService,
  ],
  exports: [ProductsApplicationService],
})
export class ProductsModule {}
