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
    removeChild(child: T) {
        this.children = this.children.filter(node => node.value !== child);
    }
    findNode(value: T,callBack?:(val:Tree<T>)=>void): Tree<T> | undefined {
        // find node by dfs in children
        for (let child of this.children) {
            if (child.value === value){
                if(callBack){
                    callBack(child);
                }
                return child;
            }else{
                let node = child.findNode(value,callBack);
                if (node) return node;
            };
        }
        return undefined;
    }
    removeNode(value: T) {
        // find node by dfs in children and remove it
        this.children = this.children.filter(child => {
            if (child.value === value) return false;
            child.removeNode(value);
            return true;
        });
    }
    findIndex(value: T,filter:(value: Tree<T>, index: number, array: Tree<T>[]) => boolean): number {
        // nth children index
        let index = 0;
        for (let child of this.children.filter(filter)) {
            if (child.value === value){
                return index;
            }else{
                index++;
            };
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