# 更新日志

## 0.8.0

+ 新增 `VtronMemoryFileSystem`，基于内存的文件系统实现，适用于无需持久化的场景
+ 文件系统接口 `VtronFileInterface` 新增 `isFirstRun` 属性
+ `isFirstRun` 判断逻辑从 System（localStorage）移至文件系统内部：
  - `VtronFileSystem`（IndexedDB）：数据库首次创建时为 `true`
  - `VtronMemoryFileSystem`（内存）：始终为 `true`
+ 移除 System 中 `vtronFirstRun` 相关的 localStorage 依赖

## 0.7.7

+ 可以隐藏内置的设置页面
+ 可以添加桌面分组
o 修复move事件


## 0.7.0

Break Change

具体更改查看文档

## 0.6.1

Tray 系统托盘图标

Menu 右键菜单

## 0.4.5

本体不带终端，终端在 plus 中提供

## 0.4.4

更新 system 可以选择其他的 shell 实现

窗口事件系统完善

## 0.4.1

更新 system 可以选择其他的 fs 实现

## vue3-win10 已全面更新为 Vtron!
