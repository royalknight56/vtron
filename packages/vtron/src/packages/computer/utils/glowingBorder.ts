import { throttle } from '@/packages/util/debounce';
import { Directive } from 'vue';

const vGlowing: Directive<HTMLElement> = {
  mounted(el, binding) {
    setTimeout(() => {
      const updatePosition = (e: MouseEvent) => {
        // 获取元素当前位置
        const rect = el.getBoundingClientRect();
        const maxBorder = Math.max(rect.width, rect.height) * (binding.value?.scale || 2);

        // 计算鼠标相对于元素的位置
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // 更新遮罩位置
        const childE = el.querySelector('.glowing-hover-child') as HTMLElement;
        if (childE) {
          childE.style.maskPosition = `${x - maxBorder / 2}px ${y - maxBorder / 2}px`;
        }
      };

      // 使用节流包装 updatePosition 函数，16ms 大约是 60fps
      const throttledUpdatePosition = throttle(updatePosition, 16);

      // 初始化元素
      const rect = el.getBoundingClientRect();
      const maxBorder = Math.max(rect.width, rect.height) * (binding.value?.scale || 2);
      el.classList.add('glowing-hover');

      const childE = document.createElement('div');
      childE.style.maskSize = `${maxBorder.toFixed(0)}px ${maxBorder.toFixed(0)}px`;
      childE.style.backgroundColor = binding.value?.color || 'white';
      childE.className = 'glowing-hover-child';
      el.appendChild(childE);

      const childMaskE = document.createElement('div');
      childMaskE.className = 'glowing-hover-mask';
      el.appendChild(childMaskE);

      // 添加节流后的鼠标移动监听
      el.addEventListener('mousemove', throttledUpdatePosition);

      // 保存清理函数
      (el as any)._glowingCleanup = () => {
        el.removeEventListener('mousemove', throttledUpdatePosition);
      };
    }, 200);
  },

  unmounted(el) {
    // 清理事件监听
    if ((el as any)._glowingCleanup) {
      (el as any)._glowingCleanup();
    }
  },
};

export { vGlowing };
