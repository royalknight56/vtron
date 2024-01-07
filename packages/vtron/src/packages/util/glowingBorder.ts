import { Directive } from 'vue';

const vGlowing: Directive<HTMLElement> = {
  mounted(el, binding) {
    setTimeout(() => {
      const rect = el.getBoundingClientRect();
      const maxBorder = Math.max(rect.width, rect.height) * (binding.value?.scale || 1);
      el.classList.add('glowing-hover');
      const childE = document.createElement('div');
      childE.style.maskPosition = `calc(var(--mouseX) - ${(rect.x + maxBorder / 2).toFixed(
        0
      )}px) calc(var(--mouseY) - ${(rect.y + maxBorder / 2).toFixed(0)}px)`;
      childE.style.maskSize = `${maxBorder.toFixed(0)}px ${maxBorder.toFixed(0)}px`;
      childE.style.backgroundColor = binding.value?.color || 'white';
      childE.className = 'glowing-hover-child';
      el.appendChild(childE);

      const childMaskE = document.createElement('div');
      childMaskE.className = 'glowing-hover-mask';
      el.appendChild(childMaskE);
    }, 200);
  },
};

export { vGlowing };
