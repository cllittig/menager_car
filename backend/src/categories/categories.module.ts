import { Module } from '@nestjs/common';
import { CategoriesApplicationService } from './application/categories.application-service';
import { CategoriesController } from './categories.controller';
import { CategoryRepository } from './domain/repositories/category.repository';
import { SupabaseCategoryRepository } from './infrastructure/persistence/supabase-category.repository';

@Module({
  controllers: [CategoriesController],
  providers: [
    { provide: CategoryRepository, useClass: SupabaseCategoryRepository },
    CategoriesApplicationService,
  ],
  exports: [CategoriesApplicationService],
})
export class CategoriesModule {}
