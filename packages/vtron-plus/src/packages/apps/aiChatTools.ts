import type { System } from 'vtron';

export interface AiToolDefinition {
  name: string;
  description: string;
  input_schema: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
}

export interface AiTool {
  getDefinition(): AiToolDefinition | null;
  execute(input: any): Promise<string>;
}

export class AiToolRegistry {
  private tools: AiTool[] = [];

  register(tool: AiTool) {
    this.tools.push(tool);
  }

  getToolDefinitions(): AiToolDefinition[] {
    return this.tools.map((t) => t.getDefinition()).filter((d): d is AiToolDefinition => d !== null);
  }

  async executeTool(name: string, input: any): Promise<string> {
    for (const tool of this.tools) {
      const def = tool.getDefinition();
      if (def && def.name === name) {
        try {
          return await tool.execute(input);
        } catch (err: any) {
          return `Error: ${err.message || err}`;
        }
      }
    }
    return `Unknown tool "${name}"`;
  }
}

// ─── App Tool ───

export class OpenAppTool implements AiTool {
  constructor(private sys: System | undefined) {}

  private getAvailableApps(): { name: string; loc: string }[] {
    if (!this.sys) return [];
    const apps: { name: string; loc: string }[] = [];
    const map = this.sys.stateManager.windowMap;
    for (const loc of ['Desktop', 'Magnet', 'Menulist', 'Builtin'] as const) {
      map[loc].forEach((_opt: any, name: string) => {
        apps.push({ name, loc });
      });
    }
    return apps;
  }

  getDefinition(): AiToolDefinition | null {
    const apps = this.getAvailableApps();
    const appNames = apps.map((a) => a.name);
    if (appNames.length === 0) return null;

    return {
      name: 'open_app',
      description: `Open an application window on the desktop. Available apps: ${appNames.join(', ')}`,
      input_schema: {
        type: 'object',
        properties: {
          app_name: {
            type: 'string',
            description: 'The exact name of the application to open',
            enum: appNames,
          },
        },
        required: ['app_name'],
      },
    };
  }

  async execute(input: any): Promise<string> {
    const appName = input.app_name;
    const apps = this.getAvailableApps();
    const found = apps.find((a) => a.name === appName);
    if (!found || !this.sys) {
      return `Application "${appName}" not found. Available: ${apps.map((a) => a.name).join(', ')}`;
    }
    const winopt = this.sys.stateManager.windowMap.get(found.loc as any, found.name);
    if (winopt && winopt.type !== 'group') {
      const win = this.sys.createWindow(winopt.window);
      win.show();
      return `Successfully opened "${appName}"`;
    }
    return `Could not open "${appName}"`;
  }
}

// ─── File System Tools ───

export class ReadFileTool implements AiTool {
  constructor(private sys: System | undefined) {}

  getDefinition(): AiToolDefinition {
    return {
      name: 'read_file',
      description: 'Read the text content of a file at the given path',
      input_schema: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'Absolute file path, e.g. /C/Users/Desktop/note.txt' },
        },
        required: ['path'],
      },
    };
  }

  async execute(input: any): Promise<string> {
    if (!this.sys) return 'System not available';
    const content = await this.sys.fs.readFile(input.path);
    if (content === null) return `File not found: ${input.path}`;
    return content;
  }
}

export class WriteFileTool implements AiTool {
  constructor(private sys: System | undefined) {}

  getDefinition(): AiToolDefinition {
    return {
      name: 'write_file',
      description: 'Write text content to a file. Creates the file if it does not exist, overwrites if it does. Use flag "a" to append instead.',
      input_schema: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'Absolute file path' },
          content: { type: 'string', description: 'Text content to write' },
          flag: { type: 'string', enum: ['w', 'a'], description: 'Write mode: "w" to overwrite (default), "a" to append' },
        },
        required: ['path', 'content'],
      },
    };
  }

  async execute(input: any): Promise<string> {
    if (!this.sys) return 'System not available';
    const flag = input.flag || 'w';
    await this.sys.fs.writeFile(input.path, input.content, { flag });
    return `File written successfully: ${input.path}`;
  }
}

export class ListDirectoryTool implements AiTool {
  constructor(private sys: System | undefined) {}

  getDefinition(): AiToolDefinition {
    return {
      name: 'list_directory',
      description: 'List files and subdirectories in a directory. Returns name, type (file/directory), and size for each entry.',
      input_schema: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'Absolute directory path, e.g. /C/Users/Desktop' },
        },
        required: ['path'],
      },
    };
  }

  async execute(input: any): Promise<string> {
    if (!this.sys) return 'System not available';
    const entries = await this.sys.fs.readdir(input.path);
    if (!entries || entries.length === 0) return `Directory is empty or not found: ${input.path}`;
    const lines = entries.map((e: any) => {
      const type = e.isDirectory ? 'DIR' : 'FILE';
      return `[${type}] ${e.name}`;
    });
    return lines.join('\n');
  }
}

export class CreateDirectoryTool implements AiTool {
  constructor(private sys: System | undefined) {}

  getDefinition(): AiToolDefinition {
    return {
      name: 'create_directory',
      description: 'Create a new directory at the given path',
      input_schema: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'Absolute path for the new directory' },
        },
        required: ['path'],
      },
    };
  }

  async execute(input: any): Promise<string> {
    if (!this.sys) return 'System not available';
    await this.sys.fs.mkdir(input.path);
    return `Directory created: ${input.path}`;
  }
}

export class DeletePathTool implements AiTool {
  constructor(private sys: System | undefined) {}

  getDefinition(): AiToolDefinition {
    return {
      name: 'delete_path',
      description: 'Delete a file or directory (recursively). Use with caution.',
      input_schema: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'Absolute path to delete' },
        },
        required: ['path'],
      },
    };
  }

  async execute(input: any): Promise<string> {
    if (!this.sys) return 'System not available';
    const exists = await this.sys.fs.exists(input.path);
    if (!exists) return `Path does not exist: ${input.path}`;
    await this.sys.fs.rm(input.path);
    return `Deleted: ${input.path}`;
  }
}

export class RenamePathTool implements AiTool {
  constructor(private sys: System | undefined) {}

  getDefinition(): AiToolDefinition {
    return {
      name: 'rename_path',
      description: 'Rename or move a file/directory from old_path to new_path',
      input_schema: {
        type: 'object',
        properties: {
          old_path: { type: 'string', description: 'Current absolute path' },
          new_path: { type: 'string', description: 'New absolute path' },
        },
        required: ['old_path', 'new_path'],
      },
    };
  }

  async execute(input: any): Promise<string> {
    if (!this.sys) return 'System not available';
    await this.sys.fs.rename(input.old_path, input.new_path);
    return `Renamed: ${input.old_path} -> ${input.new_path}`;
  }
}

export class CopyFileTool implements AiTool {
  constructor(private sys: System | undefined) {}

  getDefinition(): AiToolDefinition {
    return {
      name: 'copy_file',
      description: 'Copy a file from source path to destination path',
      input_schema: {
        type: 'object',
        properties: {
          src: { type: 'string', description: 'Source file path' },
          dest: { type: 'string', description: 'Destination file path' },
        },
        required: ['src', 'dest'],
      },
    };
  }

  async execute(input: any): Promise<string> {
    if (!this.sys) return 'System not available';
    await this.sys.fs.copyFile(input.src, input.dest);
    return `Copied: ${input.src} -> ${input.dest}`;
  }
}

export class FileExistsTool implements AiTool {
  constructor(private sys: System | undefined) {}

  getDefinition(): AiToolDefinition {
    return {
      name: 'file_exists',
      description: 'Check whether a file or directory exists at the given path',
      input_schema: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'Absolute path to check' },
        },
        required: ['path'],
      },
    };
  }

  async execute(input: any): Promise<string> {
    if (!this.sys) return 'System not available';
    const exists = await this.sys.fs.exists(input.path);
    return exists ? `Exists: ${input.path}` : `Does not exist: ${input.path}`;
  }
}

export class FileInfoTool implements AiTool {
  constructor(private sys: System | undefined) {}

  getDefinition(): AiToolDefinition {
    return {
      name: 'file_info',
      description: 'Get metadata (name, size, type, timestamps) of a file or directory',
      input_schema: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'Absolute path' },
        },
        required: ['path'],
      },
    };
  }

  async execute(input: any): Promise<string> {
    if (!this.sys) return 'System not available';
    const stat = await this.sys.fs.stat(input.path);
    if (!stat) return `Not found: ${input.path}`;
    return JSON.stringify(stat, null, 2);
  }
}

export class SearchFilesTool implements AiTool {
  constructor(private sys: System | undefined) {}

  getDefinition(): AiToolDefinition {
    return {
      name: 'search_files',
      description: 'Search for files by keyword in their name across the entire file system',
      input_schema: {
        type: 'object',
        properties: {
          keyword: { type: 'string', description: 'Search keyword to match against file names' },
        },
        required: ['keyword'],
      },
    };
  }

  async execute(input: any): Promise<string> {
    if (!this.sys) return 'System not available';
    const results = await this.sys.fs.search(input.keyword);
    if (!results || results.length === 0) return `No files found matching "${input.keyword}"`;
    const lines = results.map((f: any) => {
      const type = f.isDirectory ? 'DIR' : 'FILE';
      return `[${type}] ${f.path}`;
    });
    return lines.join('\n');
  }
}

// ─── System Tools ───

export class CreateNotificationTool implements AiTool {
  constructor(private sys: System | undefined) {}

  getDefinition(): AiToolDefinition {
    return {
      name: 'create_notification',
      description: 'Show a desktop notification to the user',
      input_schema: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Notification title' },
          content: { type: 'string', description: 'Notification body text' },
        },
        required: ['title', 'content'],
      },
    };
  }

  async execute(input: any): Promise<string> {
    if (!this.sys) return 'System not available';
    this.sys.createNotify({ title: input.title, content: input.content });
    return `Notification shown: "${input.title}"`;
  }
}

export class ShowDialogTool implements AiTool {
  constructor(private sys: System | undefined) {}

  getDefinition(): AiToolDefinition {
    return {
      name: 'show_dialog',
      description: 'Show a message dialog box with optional buttons. Returns the index of the button clicked by the user.',
      input_schema: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Dialog title' },
          message: { type: 'string', description: 'Dialog message content' },
          type: { type: 'string', enum: ['info', 'error', 'question', 'warning'], description: 'Dialog type/icon' },
          buttons: {
            type: 'array',
            items: { type: 'string' },
            description: 'Button labels, e.g. ["OK","Cancel"]. Defaults to ["OK"].',
          },
        },
        required: ['title', 'message'],
      },
    };
  }

  async execute(input: any): Promise<string> {
    if (!this.sys) return 'System not available';
    const Dialog = this.sys.createDialog();
    const result = await Dialog.showMessageBox({
      title: input.title,
      message: input.message,
      type: input.type || 'info',
      buttons: input.buttons || ['OK'],
    });
    return `User clicked button index ${result.response}` + (input.buttons ? ` ("${input.buttons[result.response]}")` : '');
  }
}

export class SystemControlTool implements AiTool {
  constructor(private sys: System | undefined) {}

  getDefinition(): AiToolDefinition {
    return {
      name: 'system_control',
      description: 'Control the system: shutdown or restart the desktop environment',
      input_schema: {
        type: 'object',
        properties: {
          action: { type: 'string', enum: ['shutdown', 'restart'], description: 'The action to perform' },
        },
        required: ['action'],
      },
    };
  }

  async execute(input: any): Promise<string> {
    if (!this.sys) return 'System not available';
    if (input.action === 'shutdown') {
      this.sys.shutdown();
      return 'System is shutting down';
    }
    if (input.action === 'restart') {
      this.sys.restart();
      return 'System is restarting';
    }
    return `Unknown action: ${input.action}`;
  }
}

export class OpenFileTool implements AiTool {
  constructor(private sys: System | undefined) {}

  getDefinition(): AiToolDefinition {
    return {
      name: 'open_file',
      description: 'Open a file with its registered application (e.g. open an image with the image viewer, open a .md file with the markdown editor)',
      input_schema: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'Absolute file path to open' },
        },
        required: ['path'],
      },
    };
  }

  async execute(input: any): Promise<string> {
    if (!this.sys) return 'System not available';
    const exists = await this.sys.fs.exists(input.path);
    if (!exists) return `File not found: ${input.path}`;
    await this.sys.openFile(input.path);
    return `Opened file: ${input.path}`;
  }
}

// ─── Registry Factory ───

export function createDefaultToolRegistry(sys: System | undefined): AiToolRegistry {
  const registry = new AiToolRegistry();

  registry.register(new OpenAppTool(sys));
  registry.register(new OpenFileTool(sys));

  registry.register(new ReadFileTool(sys));
  registry.register(new WriteFileTool(sys));
  registry.register(new ListDirectoryTool(sys));
  registry.register(new CreateDirectoryTool(sys));
  registry.register(new DeletePathTool(sys));
  registry.register(new RenamePathTool(sys));
  registry.register(new CopyFileTool(sys));
  registry.register(new FileExistsTool(sys));
  registry.register(new FileInfoTool(sys));
  registry.register(new SearchFilesTool(sys));

  registry.register(new CreateNotificationTool(sys));
  registry.register(new ShowDialogTool(sys));
  registry.register(new SystemControlTool(sys));

  return registry;
}
