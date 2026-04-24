import { ArgumentMetadata, BadRequestException, Injectable, PipeTransform, Type } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate, type ValidationError } from 'class-validator';

@Injectable()
export class ValidationPipe implements PipeTransform<unknown, unknown> {
  async transform(value: unknown, { metatype }: ArgumentMetadata): Promise<unknown> {
    if (!metatype || !this.toValidate(metatype)) {
      return value;
    }

    const plain: unknown = plainToInstance(metatype, value as Record<string, unknown>) as unknown;
    if (typeof plain !== 'object' || plain === null) {
      return plain;
    }
    const object: object = plain;
    const errors: ValidationError[] = await validate(object);

    if (errors.length > 0) {
      const formattedErrors = errors.map((error: ValidationError) => ({
        property: error.property,
        constraints: error.constraints,
        value: error.value as unknown,
      }));

      throw new BadRequestException({
        message: 'Erro de validação',
        errors: formattedErrors,
      });
    }

    return object;
  }

  private toValidate(metatype: Type<unknown>): boolean {
    const types: Array<Type<unknown>> = [String, Boolean, Number, Array, Object];
    return !types.includes(metatype);
  }
} 