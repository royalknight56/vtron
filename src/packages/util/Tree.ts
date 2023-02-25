class Tree<T>{
    value: T;
    children: Tree<T>[] = []
    constructor(
        value?: T,
        children?: Tree<T>[]
    ) {
        this.value = value || ({} as T);
        this.children = children||[];
    }
    addChild(child: T) {
        this.children.push(new Tree(child));
    }
    removeChild(child: Tree<T>) {
        this.children = this.children.filter(c => c !== child);
    }
    findNode(value: T): Tree<T> | undefined {
        if (this.value === value) return this;
        for (let child of this.children) {
            const node = child.findNode(value);
            if (node) return node;
        }
        return undefined;
    }
    traverseBFS(fn: (node: Tree<T>) => void) {
        const arr: Tree<T>[] = [this];
        while (arr.length) {
            const node = arr.shift();
            if (!node) continue;
            arr.push(...node.children);
            fn(node);
        }
    }
    traverseDFS(fn: (node: Tree<T>) => void) {
        const arr: Tree<T>[] = [this];
        while (arr.length) {
            const node = arr.shift();
            if (!node) continue;
            arr.unshift(...node.children);
            fn(node);
        }
    }
}
export {
    Tree
}