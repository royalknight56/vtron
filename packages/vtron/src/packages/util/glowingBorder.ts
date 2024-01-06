import { Directive } from 'vue';

const vGlowing: Directive<HTMLElement> = {
  mounted(el) {
    setTimeout(() => {
      const rect = el.getBoundingClientRect();
      const maxBorder = Math.max(rect.width, rect.height) * 2;
      el.classList.add('glowing-hover');
      const childE = document.createElement('div');
      childE.style.maskPosition = `calc(var(--mouseX) - ${(rect.x + maxBorder / 2).toFixed(
        0
      )}px) calc(var(--mouseY) - ${(rect.y + maxBorder / 2).toFixed(0)}px)`;
      childE.style.maskSize = `${maxBorder.toFixed(0)}px ${maxBorder.toFixed(0)}px`;

      childE.className = 'glowing-hover-child';
      el.appendChild(childE);
    }, 200);
  },
};

export { vGlowing };
