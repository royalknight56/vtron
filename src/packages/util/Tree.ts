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
    // findIndex(value: T,filter:(value:T)=>boolean): number {
    //     if(filter&&filter(value)===false) return -1;
    //     if (this.value === value) return 0;
    //     let index = 0;
    //     for (let child of this.children) {
    //         index++;
    //         const node = child.findIndex(value,filter);
    //         if (node !== -1) return index + node;
    //     }
    //     return -1;
    // }
    findIndex(value: T): number {
        // nth children index
        let index = 0;
        for (let child of this.children) {
            if (child.value === value) return index;
            index++;
        }
        return -1;
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