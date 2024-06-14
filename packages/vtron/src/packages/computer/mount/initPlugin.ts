import { Shell, System } from '@/packages/kernel';

export async function initPlugin(system: System) {
  const pluginsFile = await system.fs.readdir(`${system._options.systemLocation}plugs`);
  if (pluginsFile) {
    await Promise.all(
      pluginsFile.map(async (file) => {
        const fileContent = await system.fs.readFile(file.path);
        if (file.isFile) {
          const content = fileContent;
          if (content) {
            new Shell(system, '/', 'root').exec('node ' + file.path);
          }
        }
      })
    );
  }
}
