interface HandlerInfo {
    handler: Function;
    once?: boolean;
}
// https://cloud.tencent.com/developer/article/1700467
class Eventer {
    private events: Map<string, HandlerInfo[]> = new Map();
    on(type: string, handler: Function, once?: boolean) {
        if (!this.events.has(type)) {
            this.events.set(type, []);
        }
        (this.events.get(type) || []).push({
            handler,
            once,
        });
        return () => {
            this.off(type, handler);
        };
    }
    once(type: string, handler: Function) {
        return this.on(type, handler, true);
    }
    emit(type: string,source:string, ...args: any[]) {
        let i = 0;
        while (i < (this.events.get(type) || []).length) { // 这里每次都从 this.events 去动态读取，方中途被变更
            const handlers: HandlerInfo[] = this.events.get(type) || [];
            const { handler, once } = handlers[i];
            // 如果是一次性的，应该在调用前删除，防止这里会自己触发自己，导致无限循环或者次序错乱
            if (once) {
                handlers.splice(i--, 1);
            }
            i++;
            handler(source,...args); // 这里 this 就交给传入的 handler 来保证了
        }
    }
    off(type?: string, handler?: Function): void {
        if (!type) return; // 最好不要默认全部清除，不安全
        if (!handler) {
            this.events.set(type, []); // 因为这里是直接赋值清空，所以在 emit 的时候，记得每次都从 events 动态获取
            return;
        }
        this.events.set(type, (this.events.get(type) || []).filter(item => item.handler !== handler));
    }
}
export {
    Eventer
} ;