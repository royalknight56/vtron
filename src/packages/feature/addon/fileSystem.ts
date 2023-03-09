import { initAppList } from "@/packages/hook/useAppOpen";
class VtronFile {
    path: string;
    parentPath: string;
    content: string;
    name: string;
    icon: string;
    type: string;
    constructor(path: string, parentPath: string,
        content: string, name: string,
        icon: string, type: string) {
        this.path = path;
        this.parentPath = parentPath;
        this.content = content;
        this.name = name;
        this.icon = icon;
        this.type = type;
    }
}
class VtronFileSystem {
    private db!: IDBDatabase;
    private _ready: ((value: VtronFileSystem) => void) | null = null;
    constructor() {
        const request = window.indexedDB.open("FileSystemDB", 1);

        request.onerror = () => {
            console.error("Failed to open database");
        };

        request.onsuccess = () => {
            this.db = request.result;
            this._ready?.(this);
        };

        request.onupgradeneeded = () => {
            this.db = request.result;
            const objectStore = this.db.createObjectStore("files", {
                keyPath: "path",
            });
            objectStore.createIndex("parentPath", "parentPath");
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
                const file: VtronFile = request.result;
                resolve(file ? file.content : null);

            };
        });
    }
    whenReady(): Promise<VtronFileSystem> {
        if (this.db) {
            return Promise.resolve(this);
        }
        return new Promise<VtronFileSystem>((resolve, reject) => {
            this._ready = resolve;
        })
    }

    /**
     * 写入文件内容到指定路径
     * @param path 文件路径
     * @param content 文件内容
     */
    async writeFile(path: string, par: {
        content: string;
        name: string;
        icon: string;
        type: string;
    }): Promise<void> {
        const transaction = this.db.transaction("files", "readwrite");
        const objectStore = transaction.objectStore("files");
        let parentPath = path.split("/").slice(0, -1).join("/");
        if (parentPath === "") parentPath = "/";
        const request = objectStore.put(
            new VtronFile(path,
                parentPath,
                par.content,
                par.name || path.split("/").slice(-1)[0],
                par.icon,
                par.type)
        );
        if(/^\/C\/Users\//.test(path)){
            this.asyncSystemConfig();
        }
        return new Promise((resolve, reject) => {
            request.onerror = () => {
                console.error("Failed to write file");
                reject();
            };
            request.onsuccess = () => {
                resolve();
            };
        });
    }
    async getFileInfo(path: string): Promise<VtronFile | null> {
        const transaction = this.db.transaction("files", "readonly");
        const objectStore = transaction.objectStore("files");
        const request = objectStore.get(path);
        return new Promise((resolve, reject) => {
            request.onerror = () => {
                console.error("Failed to read file");
                reject();
            };
            request.onsuccess = () => {
                const file: VtronFile = request.result;
                resolve(file);
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
        if(/^\/C\/Users\//.test(path)){
            this.asyncSystemConfig();
        }
        return new Promise((resolve, reject) => {
            request.onerror = () => {
                console.error("Failed to delete file");
                reject();
            };
            request.onsuccess = () => {
                resolve();
            };
        });
    }
    /**
   * 读取指定路径下的所有文件和文件夹
   * @param path 目录路径
   * @returns 文件和文件夹列表
   */
    async readDirectory(path: string): Promise<VtronFile[]> {
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
                resolve(files);
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
        let res = objectStore.get(path);
        res.onsuccess = () => {
            if (res.result) {
                return Promise.resolve();
            }
        }

        const request = objectStore.put(
            new VtronFile(path, parentPath,
                "", path.split("/").slice(-1)[0],
                "folder",
                "folder")
        );

        return new Promise((resolve, reject) => {
            request.onerror = () => {
                console.error("Failed to create directory");
                reject();
            };
            request.onsuccess = () => {
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
                resolve();
            };
        });
    }

    async asyncSystemConfig(){
        initAppList();
    }
}
const fs = new VtronFileSystem();
async function initFileSystem() {
    let res =  await fs.whenReady()
    let isInit = await res.readDirectory('/C');
    if(isInit.length) return fs;
    res.createDirectory('/C');
    res.createDirectory('/C/Users');
    res.createDirectory('/C/Users/Desktop');
    return fs;
}
export {
    initFileSystem,
    VtronFileSystem,
    fs
}