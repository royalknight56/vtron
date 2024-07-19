import { ref } from 'vue';

export class RectState {
  
  screenWidth = ref(window.innerWidth);
  screenHeight = ref(window.innerHeight);
  mouseX = ref(0);
  mouseY = ref(0);
  constructor() {}
  getMousePosition() {
    return {
      x: this.mouseX.value,
      y: this.mouseY.value,
    };
  }
  setMousePosition(x: number, y: number) {
    this.mouseX.value = x;
    this.mouseY.value = y;
  }
  getScreenSize() {
    return {
      width: this.screenWidth.value,
      height: this.screenHeight.value,
    };
  }
  setScreenSize(width: number, height: number) {
    this.screenWidth.value = width;
    this.screenHeight.value = height;
  }
}
