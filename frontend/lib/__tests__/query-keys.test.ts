import { describe, expect, it } from 'vitest';
import { clientKeys } from '@/lib/clients/application/use-clients';
import { vehicleKeys } from '@/lib/vehicles/application/use-vehicles';

describe('Query keys (React Query)', () => {
  it('vehicleKeys.lists e detail são estáveis e prefixadas por domínio', () => {
    expect(vehicleKeys.lists()).toEqual(['vehicles', 'list']);
    expect(vehicleKeys.detail('abc')).toEqual(['vehicles', 'detail', 'abc']);
    expect(vehicleKeys.stats()).toEqual(['vehicles', 'stats']);
  });

  it('clientKeys segue o mesmo padrão que vehicleKeys', () => {
    expect(clientKeys.lists()).toEqual(['clients', 'list']);
    expect(clientKeys.detail('x')).toEqual(['clients', 'detail', 'x']);
    expect(clientKeys.stats()).toEqual(['clients', 'stats']);
  });
});
