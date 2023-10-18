import { defineComponent, h, ref } from 'vue';
import RectChosenVue from '../components/RectChosen.vue';
export interface Rect {
  left: number;
  top: number;
  width: number;
  height: number;
}
export function useRectChosen() {
  const rect = ref<Rect>({
    left: 0,
    top: 0,
    width: 0,
    height: 0,
  });
  const isDown = ref(false);
  const startPoint = {
    x: 0,
    y: 0,
  };
  function choseStart(e: MouseEvent) {
    isDown.value = true;
    startPoint.x = e.clientX;
    startPoint.y = e.clientY;
    rect.value.width = 0;
    rect.value.height = 0;
  }
  function chosing(e: MouseEvent) {
    if (isDown.value) {
      rect.value.left = Math.min(startPoint.x, e.clientX);
      rect.value.top = Math.min(startPoint.y, e.clientY);
      rect.value.width = Math.abs(startPoint.x - e.clientX);
      rect.value.height = Math.abs(startPoint.y - e.clientY);
    }
  }
  function choseEnd() {
    isDown.value = false;
  }
  function getRect() {
    return rect.value;
  }
  const Chosen = defineComponent(() => {
    return () => {
      if (isDown.value) {
        return h(RectChosenVue, {
          rect: rect.value,
          isDown: isDown.value,
        });
      }
    };
  });

  return {
    choseStart,
    chosing,
    choseEnd,
    getRect,
    Chosen,
  };
}
