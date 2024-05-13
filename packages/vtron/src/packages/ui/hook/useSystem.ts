import { System } from '@/packages/kernel';
import { inject } from 'vue';

export function useUISystem() {
  return inject<System>('system')!;
}
