import type { Category } from '../category.types';

export abstract class CategoryRepository {
  abstract getAll(): Promise<Category[]>;

  abstract create(data: { name: string; description?: string }): Promise<unknown>;

  abstract update(
    id: string,
    data: Partial<{ name: string; description: string }>,
  ): Promise<unknown>;

  abstract delete(id: string): Promise<unknown>;
}
