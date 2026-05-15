import { API_ROUTES } from '@/lib/api';
import api from '@/lib/axios';
import type { Category } from '../domain/category.types';
import { CategoryRepository } from '../domain/repositories/category.repository';

export class HttpCategoryRepository extends CategoryRepository {
  getAll(): Promise<Category[]> {
    return api.get<Category[]>(API_ROUTES.categories.getAll).then((r) => r.data);
  }

  create(data: { name: string; description?: string }) {
    return api.post(API_ROUTES.categories.create, data).then((r) => r.data);
  }

  update(id: string, data: Partial<{ name: string; description: string }>) {
    return api.patch(API_ROUTES.categories.update(id), data).then((r) => r.data);
  }

  delete(id: string) {
    return api.delete(API_ROUTES.categories.delete(id)).then((r) => r.data);
  }
}
