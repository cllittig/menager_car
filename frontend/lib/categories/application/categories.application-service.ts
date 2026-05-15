import { HttpCategoryRepository } from '../infrastructure/http-category.repository';
import { CategoryRepository } from '../domain/repositories/category.repository';

const defaultRepository = new HttpCategoryRepository();

export class CategoriesApplicationService {
  constructor(private readonly repository: CategoryRepository = defaultRepository) {}

  getAll() {
    return this.repository.getAll();
  }

  create(data: { name: string; description?: string }) {
    return this.repository.create(data);
  }

  update(id: string, data: Partial<{ name: string; description: string }>) {
    return this.repository.update(id, data);
  }

  delete(id: string) {
    return this.repository.delete(id);
  }
}
