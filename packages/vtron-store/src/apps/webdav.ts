import Test from "./test.vue";
import * as Vue from "vue";
import { AuthType, createClient } from "webdav";
declare type DateLike = Date | string | number;
declare class VtronFileInfo {
  isFile: boolean;
  isDirectory: boolean;
  isSymlink: boolean;
  size: number;
  mtime: DateLike;
  atime: DateLike;
  birthtime: DateLike;
  constructor(
    isFile?: boolean,
    isDirectory?: boolean,
    isSymlink?: boolean,
    size?: number,
    mtime?: DateLike,
    atime?: DateLike,
    birthtime?: DateLike
  );
}
declare class VtronFile extends VtronFileInfo {
  path: string;
  parentPath: string;
  content: string;
  id?: number;
  constructor(
    path: string,
    content: string,
    info: Partial<VtronFileInfo>,
    id?: number
  );
}
function main(system: any, _: typeof Vue) {
  if (localStorage.getItem("webdav_path")) {
    const client = createClient(localStorage.getItem("webdav_path") || "", {
      authType: AuthType.Digest,
      username: localStorage.getItem("webdav_username") || "",
      password: localStorage.getItem("webdav_password") || "",
    });

    system.replaceFileSystem({
      async readdir(path) {
        return client.getDirectoryContents(path).then((res) => {
          console.log(res);
        });
      },
    } as {
      readFile: (path: string) => Promise<string | null>;
      writeFile: (path: string, content: string) => Promise<void>;
      appendFile: (path: string, content: string) => Promise<void>;
      readdir: (path: string) => Promise<VtronFile[]>;
      exists: (path: string) => Promise<boolean>;
      stat: (path: string) => Promise<VtronFile | null>;
      unlink: (path: string) => Promise<void>;
      rename: (oldPath: string, newPath: string) => Promise<void>;
      rmdir: (path: string) => Promise<void>;
      mkdir: (path: string) => Promise<void>;
      copyFile: (src: string, dest: string) => Promise<void>;
      serializeFileSystem: () => Promise<unknown>;
      deserializeFileSystem: (files: VtronFile[]) => Promise<unknown>;
      removeFileSystem: () => Promise<void>;
      registerWatcher: (
        path: RegExp,
        callback: (path: string, content: string) => void
      ) => void;
    });
  }
  system.registerSetting({
    title: "webdav 设置",
    desc: "设置文件系统webdav",
    icon: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAAAAACPAi4CAAAAk0lEQVRYw2P8z0AZYBw1YHgYcLF9JVk6wyv1wQZccHxPpt2C+0EmMIavJNv14StABlDi//8wA8gJSMYRbMCKLIZpEZQYIPSeQfDdgBpAsRdG08HwNYDiAmWIG/CfiIAiu2Ya4gYwogXWSDXgPxEBORwNYMST2/4PUwNwFRTEKPw/TAz4T0ygkBsLQ9SA0U7XiDQAAHeffgFWSH/RAAAAAElFTkSuQmCC",
    content: Test,
  });
}

console.log(main.name);
