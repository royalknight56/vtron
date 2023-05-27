import {describe,beforeEach,it,expect} from "vitest";
import {FileSystem} from "../src/FileSystem";
describe("FileSystem", () => {
    let fileSystem: FileSystem;
  
    beforeEach(() => {
      fileSystem = new FileSystem();
    });
  
    describe("writeFile", () => {
      it("should write file content to specified path", async () => {
        const path = "/test/file.txt";
        const content = "Hello, world!";
        await fileSystem.writeFile(path, { content });
  
        const fileContent = await fileSystem.readFile(path);
        expect(fileContent).toEqual(content);
      });
  
      it("should create file if it does not exist", async () => {
        const path = "/test/new-file.txt";
        const content = "Hello, world!";
        await fileSystem.writeFile(path, { content });
  
        const fileContent = await fileSystem.readFile(path);
        expect(fileContent).toEqual(content);
      });
  
      it("should overwrite file if it already exists", async () => {
        const path = "/test/overwrite-file.txt";
        const initialContent = "Initial content";
        const newContent = "New content";
        await fileSystem.writeFile(path, { content: initialContent });
        await fileSystem.writeFile(path, { content: newContent });
  
        const fileContent = await fileSystem.readFile(path);
        expect(fileContent).toEqual(newContent);
      });
  
      it("should reject if parent path does not exist", async () => {
        const path = "/non-existent-dir/file.txt";
        const content = "Hello, world!";
        await expect(fileSystem.writeFile(path, { content })).rejects.toEqual(
          "Cannot write file to a non-exist path:" + path
        );
      });
    });
  });