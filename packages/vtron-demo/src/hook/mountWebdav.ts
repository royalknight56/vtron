import {
  System,
  BrowserWindow,
  Notify,
  VtronFile,
  dirname,
  VtronFileWithoutContent,
  extname,
} from "vtron";
import { AuthType, FileStat, createClient } from "webdav";
import WebdavSetVue from "../components/apps/WebdavSet.vue";
export function mountWebdav(system: System) {
  if (localStorage.getItem("webdav_url")) {
    const client = createClient(localStorage.getItem("webdav_url") || "", {
      // authType: AuthType.Digest,
      username: localStorage.getItem("webdav_username") || "",
      password: localStorage.getItem("webdav_password") || "",
    });

    system.mountVolume(localStorage.getItem("webdav_path") || "/D", {
      async readdir(path) {
        return client.getDirectoryContents(path).then((res) => {
          return (res as FileStat[]).map((item) => {
            return {
              isSymlink: false,
              size: item.size,
              mtime: item.lastmod,
              atime: item.lastmod,
              birthtime: item.lastmod,
              path: item.filename,
              parentPath: dirname(item.filename),
              content: item.type === "directory" ? null : item.size,
              isDirectory: item.type === "directory",
              isFile: item.type === "file",
            };
          });
        });
      },
      async stat(path) {
        return client.stat(path).then((res) => {
          let temp = res as FileStat;
          return {
            path: temp.filename,
            parentPath: dirname(temp.filename),
            content: temp.type === "directory" ? null : temp.size,
            isDirectory: temp.type === "directory",
            isFile: temp.type === "file",
            isSymlink: false,
            size: temp.size,
            mtime: temp.lastmod,
            atime: temp.lastmod,
            birthtime: temp.lastmod,
          };
        });
      },
      async exists(path) {
        return client.exists(path);
      },
      async readFile(path) {
        let ext = extname(path);
        if (
          [
            ".mp4",
            ".mkv",
            ".mp3",
            ".png",
            ".jpg",
            ".jpeg",
            ".gif",
            ".bmp",
            ".webp",
            ".svg",
          ].includes(ext)
        ) {
          return (await client.getFileDownloadLink(path)) || "";
        }
        if ([".txt"].includes(ext)) {
          let res = await client.getFileContents(path);
          if (typeof res === "string") {
            return res;
          }
          const arrayBuffer = new Uint8Array(res as ArrayBufferLike).buffer;
          const decoder = new TextDecoder();
          const text = decoder.decode(arrayBuffer);
          return text;
        }
        return "";
      },
      async unlink(path) {
        system.emitError("webdav 不支持删除");
        return Promise.reject("webdav 不支持删除");
      },
      async rename(oldPath, newPath) {
        system.emitError("webdav 不支持重命名");
        return Promise.reject("webdav 不支持重命名");
      },
      async rmdir(path) {
        system.emitError("webdav 不支持删除");
        return Promise.reject("webdav 不支持删除");
      },
      async mkdir(path) {
        system.emitError("webdav 不支持创建文件夹");
        return Promise.reject("webdav 不支持创建文件夹");
      },
      async copyFile(src, dest) {
        system.emitError("webdav 不支持复制");
        return Promise.reject("webdav 不支持复制");
      },
      async writeFile(path, content) {
        system.emitError("webdav 不支持写入");
        return Promise.reject("webdav 不支持写入");
      },
      async appendFile(path, content) {
        system.emitError("webdav 不支持写入");
        return Promise.reject("webdav 不支持写入");
      },
      serializeFileSystem() {
        system.emitError("webdav 不支持序列化");
        return Promise.reject("webdav 不支持序列化");
      },
      deserializeFileSystem(files) {
        system.emitError("webdav 不支持序列化");
        return Promise.reject("webdav 不支持序列化");
      },
      removeFileSystem() {
        system.emitError("webdav 不支持清空");
        return Promise.reject("webdav 不支持清空");
      },
      registerWatcher(path, callback) {},
    });
  }
  system.registerSetting({
    key: "webdav",
    title: "webdav 设置",
    desc: "设置文件系统webdav",
    icon: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAAAAACPAi4CAAAAk0lEQVRYw2P8z0AZYBw1YHgYcLF9JVk6wyv1wQZccHxPpt2C+0EmMIavJNv14StABlDi//8wA8gJSMYRbMCKLIZpEZQYIPSeQfDdgBpAsRdG08HwNYDiAmWIG/CfiIAiu2Ya4gYwogXWSDXgPxEBORwNYMST2/4PUwNwFRTEKPw/TAz4T0ygkBsLQ9SA0U7XiDQAAHeffgFWSH/RAAAAAElFTkSuQmCC",
    content: WebdavSetVue,
  });
}
