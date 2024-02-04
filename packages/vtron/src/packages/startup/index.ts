import { System } from '../kernel';
import { initBackground, initBuiltinApp, initBuiltinFileOpener, initCheckVersion } from './initBuiltin';

export function systemStartup(system: System) {
  initBuiltinFileOpener(system); // 注册内建文件打开器
  initBuiltinApp(system); // 初始化内建应用
  initBackground(system); // 初始化背景
  initCheckVersion(system); // 检查版本
}
