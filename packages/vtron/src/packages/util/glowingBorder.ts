import { Directive } from 'vue';

const vGlowing: Directive<HTMLElement> = {
  mounted(el) {
    const rect = el.getBoundingClientRect();
    el.classList.add('glowing-hover');

    const childE = document.createElement('div');
    childE.style.maskPosition = `calc(var(--mouseX) - ${(rect.x + 80).toFixed(0)}px) calc(var(--mouseY) - ${(
      rect.y - 80
    ).toFixed(0)}px)`;

    childE.className = 'glowing-hover-child';
    el.appendChild(childE);
  },
};

export { vGlowing };
