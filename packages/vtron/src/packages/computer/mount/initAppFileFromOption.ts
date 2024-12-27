import vtronStoreLogoIcon from '@/assets/vtron-stroe-icon-nobg.png?url';
import MyComputerVue from '@/packages/computer/application/MyComputer/MyComputer.vue';
import SettingVue from '@/packages/computer/application/Setting.vue';
import { System } from '@/packages/kernel';
import myComputerLogoIcon from '@packages/assets/computer.png?url';
import settingicon from '@packages/assets/setting.png';
import { i18n } from '../i18n';

export function initBuiltinApp(system: System) {
  const setting = {
    name: '设置',
    icon: settingicon,
    multiple: false,
    window: {
      content: SettingVue,
      icon: settingicon,
      width: 800,
      height: 600,
      title: i18n('setting'),
      frame: false,
      // resizable: false,
      center: true,
      backgroundColor: '#00000000',
    },
  };
  system.addMagnet(setting, true);
  system.addMenuList(setting, true);
  system.addBuiltInApp(setting);

  if (system._options.builtinFeature?.length === 0) return;
  if (system._options.builtinFeature?.includes('MyComputer')) {
    const myComputer = {
      name: '此电脑',
      icon: myComputerLogoIcon,
      window: {
        width: 800,
        height: 600,
        center: true,
        title: i18n('computer'),
        icon: myComputerLogoIcon,
        content: MyComputerVue,
        config: {
          path: '/',
        },
      },
    };
    system.addApp(myComputer);
    system.addMagnet(myComputer);
    system.addMenuList(myComputer);
  }
}

export function initAppFileFromOption(system: System) {
  initBuiltinApp(system); // 初始化内建应用
  system.fs.writeFile(
    `${system._options.userLocation}${'Desktop'}/` + '.DS_Store',
    JSON.stringify({
      sortMap: system.stateManager.options.getOptions('desktop')?.reduce(
        (pre, cur) => {
          if (cur.order === undefined) return pre;
          pre[cur.name + '.exe'] = cur.order;
          return pre;
        },
        {} as Record<string, number>
      ),
    })
  );
  system.stateManager.options.getOptions('desktop')?.forEach((item) => {
    system.addApp(item);
  });
  system.stateManager.options.getOptions('magnet')?.forEach((item) => {
    system.addMagnet(item);
  });
  system.stateManager.options.getOptions('menulist')?.forEach((item) => {
    system.addMenuList(item);
  });
  system.refershApp();
}
