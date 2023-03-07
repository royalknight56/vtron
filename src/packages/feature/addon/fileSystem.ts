class VtronFileSystem {
    private db!: IDBDatabase;

    constructor() {
        const request = window.indexedDB.open("FileSystemDB", 1);

        request.onerror = () => {
            console.error("Failed to open database");
        };

        request.onsuccess = () => {
            this.db = request.result;
            console.log("Connected to database");
        };

        request.onupgradeneeded = () => {
            this.db = request.result;
            const objectStore = this.db.createObjectStore("files", {
                keyPath: "path",
            });
            objectStore.createIndex("parentPath", "parentPath", { unique: true });
        };
    }


    /**
     * 读取指定路径的文件内容
     * @param path 文件路径
     * @returns 文件内容
     */
    async readFile(path: string): Promise<string | null> {
        const transaction = this.db.transaction("files", "readonly");
        const objectStore = transaction.objectStore("files");
        const request = objectStore.get(path);

        return new Promise((resolve, reject) => {
            request.onerror = () => {
                console.error("Failed to read file");
                reject();
            };
            request.onsuccess = () => {
                const file = request.result;
                resolve(file ? file.content : null);
            };
        });
    }

    /**
     * 写入文件内容到指定路径
     * @param path 文件路径
     * @param content 文件内容
     */
    async writeFile(path: string, content: string): Promise<void> {
        const transaction = this.db.transaction("files", "readwrite");
        const objectStore = transaction.objectStore("files");
        let parentPath = path.split("/").slice(0, -1).join("/");
        if (parentPath === "") parentPath = "/";
        const request = objectStore.put({ path, content, parentPath: parentPath });

        return new Promise((resolve, reject) => {
            request.onerror = () => {
                console.error("Failed to write file");
                reject();
            };
            request.onsuccess = () => {
                console.log("File written");
                resolve();
            };
        });
    }

    /**
     * 删除指定路径的文件
     * @param path 文件路径
     */
    async deleteFile(path: string): Promise<void> {
        const transaction = this.db.transaction("files", "readwrite");
        const objectStore = transaction.objectStore("files");
        const request = objectStore.delete(path);

        return new Promise((resolve, reject) => {
            request.onerror = () => {
                console.error("Failed to delete file");
                reject();
            };
            request.onsuccess = () => {
                console.log("File deleted");
                resolve();
            };
        });
    }
    /**
   * 读取指定路径下的所有文件和文件夹
   * @param path 目录路径
   * @returns 文件和文件夹列表
   */
    async readDirectory(path: string): Promise<string[]> {
        const transaction = this.db.transaction("files", "readonly");
        const objectStore = transaction.objectStore("files");
        // get 'parentPath' === path
        const index = objectStore.index("parentPath");
        const range = IDBKeyRange.only(path);
        const request = index.getAll(range);

        return new Promise((resolve, reject) => {
            request.onerror = () => {
                console.error("Failed to read directory");
                reject();
            };
            request.onsuccess = () => {
                const files = request.result;
                resolve(files.map((file) => file.path));
            };
        });
    }

    /**
     * 创建新的文件夹
     * @param path 文件夹路径
     */
    async createDirectory(path: string): Promise<void> {
        const transaction = this.db.transaction("files", "readwrite");
        const objectStore = transaction.objectStore("files");

        let parentPath = path.split("/").slice(0, -1).join("/");
        if (parentPath === "") parentPath = "/";

        const request = objectStore.put({ path, content: "", parentPath: parentPath });

        return new Promise((resolve, reject) => {
            request.onerror = () => {
                console.error("Failed to create directory");
                reject();
            };
            request.onsuccess = () => {
                console.log("Directory created");
                resolve();
            };
        });
    }

    /**
     * 删除指定路径的文件夹及其内容
     * @param path 文件夹路径
     */
    async deleteDirectory(path: string): Promise<void> {
        const transaction = this.db.transaction("files", "readwrite");
        const objectStore = transaction.objectStore("files");
        const range = IDBKeyRange.bound(path, path + "\uffff");
        const request = objectStore.delete(range);
        return new Promise((resolve, reject) => {
            request.onerror = () => {
                console.error("Failed to delete directory");
                reject();
            };
            request.onsuccess = () => {
                console.log("Directory deleted");
                resolve();
            };
        });
    }
}
export {
    VtronFileSystem
}