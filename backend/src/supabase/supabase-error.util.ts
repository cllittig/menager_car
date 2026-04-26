import {
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PostgrestError } from '@supabase/supabase-js';
import { friendlyPostgresUniqueMessage } from '../common/utils/postgres-unique-message';

export function ensureNoError<T>(
  error: PostgrestError | null,
  data: T,
  context: string,
): asserts error is null {
  if (error) {
    if (error.code === '23505') {
      throw new ConflictException(
        friendlyPostgresUniqueMessage(error.message ?? ''),
      );
    }
    if (error.code === 'PGRST116') {
      throw new NotFoundException('Registro não encontrado');
    }
    throw new InternalServerErrorException(`${context}: ${error.message}`);
  }
}

export function requireSingle<T>(
  result: { data: T | null; error: PostgrestError | null },
  context: string,
): T {
  if (result.error?.code === 'PGRST116' || result.data === null) {
    throw new NotFoundException('Registro não encontrado');
  }
  ensureNoError(result.error, result.data, context);
  return result.data as T;
}
