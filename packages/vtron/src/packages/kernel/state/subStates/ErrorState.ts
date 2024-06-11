import { ref } from 'vue';

export class ErrorState {
  current = ref<string>('');
  constructor() {}
  setError(error: string) {
    this.current.value = error;
  }
  getError() {
    return this.current.value;
  }
}
