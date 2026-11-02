# 回收站视觉核对

final result: passed

范围：Windows 10 浅色回收站，管理功能区、空状态和文件列表。参考为 [Microsoft Q&A 中的原版截图](https://learn-attachment.microsoft.com/api/attachments/f02881e0-6dc8-4523-af3a-fc67dee978c6?platform=QnA)。参考使用英文和个人目录；实现使用中文和 Vtron 目录，因此文案与导航内容按实际环境核对。

在 1272×729 浏览器视口内最大化窗口，捕获的应用区域为 1272×689。已查看整窗与顶部 183px 的上下对照：`/private/tmp/vtron-recycle-review/comparison-final.png`、`/private/tmp/vtron-recycle-review/chrome-comparison.png`。

第一轮发现列宽、功能区图标和地址栏间距不符。已调整标题栏 30px、标签栏 25px、功能区 92px、地址栏 36px、导航宽 156px、表头 25px、状态栏 23px，并使用原生 16px/32px 图标帧。第二轮对照未发现需要阻止交付的布局、颜色、图像或文案问题。

已验证搜索、全选、筛选后的单项还原、全部还原、明细与图标切换、右键菜单及清空取消。验证文件已还原到独立预览的桌面；未执行永久删除。类型检查与 diff 空白检查通过。控制台中的历史终端输入错误未涉及此次回收站实现，最终流程未出现新的回收站错误。

保留差异：宿主系统字体抗锯齿与浏览器截图压缩会影响文字像素；个性化目录和无底层能力的功能按要求使用当前目录或禁用按钮。滚动条端点箭头尚未复刻。这些属于后续精细调整，不宣称跨系统截图逐像素一致。

# 此电脑视觉核对

final result: passed

参考：[Microsoft Q&A 的 Windows 10 此电脑截图](https://learn-attachment.microsoft.com/api/attachments/37eec559-84ba-4426-a07c-475fb5300145?platform=QnA)。在 1125×675 视口中最大化，应用区域为 1125×635。参考使用英文、个人云盘和三个设备；实现使用中文与 Vtron 的实际卷。参考中的 Alt 键提示不属于默认状态，未复制。

已打开并比较整窗与顶部 183px：`/private/tmp/vtron-computer-review/comparison-final.png`、`/private/tmp/vtron-computer-review/chrome-comparison.png`。标题栏 30px、标签栏 25px、功能区 92px、地址栏 36px、导航栏宽 156px、状态栏 23px。标准目录和驱动器使用原生 48px 图标，功能区使用原生 32px 图标。第一轮的功能区文案溢出、地址面包屑间距和最大化聚焦偏移已修复；复查未发现阻止交付的视觉问题。

已验证目录进入、后退清除旧筛选、小写 Windows 盘符输入、创建文件夹编辑与取消、视图切换、预览窗格、明细四列及最大化窗口边界。当前图标全部加载成功，类型检查与 diff 空白检查通过。未写新测试。冷加载后没有新的应用错误；工具注入的历史 MutationObserver 日志不属于组件代码。

没有卷容量 API，因此磁盘容量条与属性容量使用不可用占位，移除原有虚构比例。未实现的系统、网络和多项文件操作按钮置灰；仍可通过原有文件右键菜单操作。字体抗锯齿和截图压缩保留宿主差异，不宣称跨系统文字逐像素一致。

# 日常工具视觉与功能核对

final result: passed

范围：计算器、记事本、截图工具、便笺、录音机、闹钟和时钟。六项均注册到 Demo 桌面和开始菜单；已有文件系统只补缺少的入口，不覆盖用户文件。界面按 Windows 10 浅色版本的窗口分区、尺寸、颜色和控件位置核对。此结果表示当前实现范围的验收通过，不表示跨系统截图逐像素零差异。

| 应用 | 原版参考 | 最终对照 | 核对结果 |
| --- | --- | --- | --- |
| 计算器 | [Microsoft Q&A 截图](https://learn-attachment.microsoft.com/api/attachments/acddecb4-e9de-47a0-9a07-fe33d37a607e?platform=QnA) | `/private/tmp/vtron-daily-review/calculator-wide-comparison.png` | 默认 360×540，另在 610px 宽度核对历史栏。显示区、键盘顶边及运算符尺寸已修正。 |
| 记事本 | [Windows 10 22H2 截图](https://cdn-ak.f.st-hatena.com/images/fotolife/T/Twogie-M/20240122/20240122154218.jpg) | `/private/tmp/vtron-daily-review/notepad-comparison.png` | 760×520；32px 标题栏、20px 菜单、23px 状态栏，编辑区与信息列完整。参考红箭头为文章标注，未复制。 |
| 截图工具 | [经典截图工具](https://static.icecreamapps.com/storage/uploads/webp-png/snipping%20win%201.webp) | `/private/tmp/vtron-daily-review/snipping-comparison.png` | 450×130 紧凑默认窗口，五个工具按钮及提示完整，应用图标使用微软原始透明资源。 |
| 便笺 | [黄色便笺原版](https://medium.com/@two06/reading-windows-sticky-notes-5468985eff4d) | `/private/tmp/vtron-daily-review/sticky-comparison.png` | 360×380；32px 标题栏、40px 格式栏、14px 正文，格式字形无缺字。 |
| 录音机 | [Windows 10 空状态](https://www.partitionwizard.com/images/uploads/articles/2020/01/mic-test/mic-test-3.jpg) | `/private/tmp/vtron-daily-review/recorder-comparison.png` | 820×560；96px 麦克风圆钮居中，底部更多操作栏保留占位。 |
| 闹钟和时钟 | [经典浅色世界时钟](https://www.billionwallet.com/windows10/alarm-clock.html) | `/private/tmp/vtron-daily-review/clock-comparison.png` | 同为 816×572，32px 标题栏、68px 导航、50px 底栏，80px 城市卡片。 |

第一轮发现窗口聚焦导致宿主容器滚动 12px、计算器盒模型挤压键盘、部分字体图标缺字，以及截图和录音默认尺寸偏大。已修复并重新捕获真实界面。普通窗口的宿主 `scrollTop` 为 0，六个应用均无标题裁切、缺字或阻断操作的溢出。应用图标、地图及官方图标的来源记录在对应素材目录。

功能已通过浏览器验证：计算器 `2 + 3 = 5` 和宽窗历史栏；记事本保存到虚拟桌面、关闭后从 `.txt` 入口重开、未保存关闭取消，以及任务栏关闭保护；便笺关闭重开和冷加载后的内容恢复；秒表开始、分段、暂停；三秒计时器的真实结束提醒。计时器验收后恢复默认值。开始菜单与桌面均显示六个工具。

截图和录音仅在主动点击后调用屏幕或麦克风 API，本次未授予媒体权限，因此真实媒体采集未验收。计时和闹钟只在页面运行、设备唤醒时提醒。未实现的截图模式、画笔、云同步、插图、录音修剪、系统唤醒和系统设置等使用禁用占位。记事本使用可用的虚拟路径对话框；打印与页面设置占位。

`vtron-plus` 类型检查、Demo 生产构建及本次 diff 空白检查通过，未新增测试。Demo 全量类型检查仍受已有问题阻塞：已安装包声明缺少 `enableVirtualPreview`、分组应用的 `icon` 联合类型，以及 WebDAV 文件元数据类型不匹配。本次新增入口与应用未报类型错误。

保留差异：中文内容、用户目录和真实时间按当前环境显示；宿主字体与抗锯齿不同于 Windows。截图工具栏使用 Windows MDL2 字形，与旧版位图仍有细节差异。世界地图采用公开素材，海岸线细节与原生 Bing 地图不同，昼夜阴影未实现。这些差异已明确保留，不能据此宣称整图逐像素一致。未提交、发布或部署。

# Windows 附件与管理工具核对

final result: passed

新增十八个应用，按用户允许的范围实现浏览器可提供的常用操作，其余功能保留原版位置并禁用。原有画板、图库和 Terminal 仍保留。全部入口已通过浏览器确认，已有桌面与开始菜单只补缺少的快捷方式。新应用由 `windows` 功能项控制，默认启用。

| 应用 | 已实现 | 占位或未实现 |
| --- | --- | --- |
| 写字板 | 基本富文本、格式、查找、图片、HTML/TXT 虚拟文件存取、未保存保护 | RTF/DOCX、对象、打印、页面设置、替换等 |
| 照片 | 虚拟图片集合、搜索、打开、缩放、旋转查看、文件夹与本机选择 | 编辑创作、相册、人物、视频编辑、分享、删除等；旋转不改写原图 |
| Windows Media Player | 虚拟与本机媒体、播放暂停、进度、音量、重复及本次播放队列 | 刻录、同步、流媒体、媒体库管理和持久播放列表 |
| 画图 | 铅笔、刷子、橡皮、填色、取色、文字、直线/矩形/椭圆、撤销、PNG 存取 | 复杂选区、裁剪、完整图像变换及其他形状 |
| 放大镜 | 原版紧凑工具栏 | 缩放、视图、朗读、设置均禁用，不修改全局桌面或伪造比例 |
| 屏幕键盘 | 当前 System 的输入框及富文本输入、选区删除、Shift/Caps、基础光标、文本复制 | 系统按键、宿主输入、预测、扫描、声音等 |
| 字符映射表 | 字体选择、字符网格、选择、复制、分组、搜索、Unicode 定位 | 完整系统字体枚举和全部 Unicode 字库 |
| 控制面板 | 原版类别/图标视图、搜索、跳转已有 Vtron 应用 | Windows 账户、程序卸载、硬件、网络与系统设置 |
| 设备管理器 | 原版菜单、工具栏、只读设备树空状态 | 宿主设备枚举、驱动、启用/禁用设备 |
| 磁盘管理 | 原版卷表、分区区域与不可用状态 | 物理磁盘、分区、格式化、容量数据 |
| 磁盘清理 | 原版选项、说明和不可用容量 | 扫描、清理及所有删除操作 |
| 资源监视器 | Vtron 窗口、真实页面帧率及可用时的 JS 堆采样、图表与启停 | 宿主 CPU、物理内存、磁盘 I/O、网络吞吐量 |
| 事件查看器 | 原版树、明细表、操作窗格 | 读取或写入 Windows 事件日志 |
| 服务 | 原版列表、扩展/标准视图、只读空状态 | 枚举、启动、停止、修改 Windows 服务 |
| 系统信息 | 真实 Vtron 与浏览器摘要、分类、查找和文本导出 | 宿主硬件、驱动和 Windows 软件环境 |
| 注册表编辑器 | 原版只读树、明细表及根项选择 | 宿主注册表访问、编辑、导入导出，不建立伪注册表 |
| 命令提示符 | 虚拟文件系统的 DIR/CD/TYPE、ECHO/CLS/HELP 等、历史与 Windows 路径 | 原生 Windows 程序、批处理、管道、系统管理命令和写入命令 |
| 快速助手 | 原版获取/提供帮助界面 | Microsoft 登录、远程协助和屏幕控制 |

视觉来源已逐一打开，地址记录在 `win10/media/assets/SOURCES.md`、`win10/accessibility/REFERENCES.md`、`win10/management/SOURCES.md`；入口图标来源记录在 `assets/win10/SOURCES.md`。命令提示符另参考 `/private/tmp/vtron-suite-review/cmd-reference.jpg`，来源为 [Windows 10 命令提示符截图](https://www.bleepstatic.com/images/news/tutorials/windows/c/open-command-prompt/command-prompt.jpg)。实现保留 Vtron 环境名称，不伪造 Microsoft Windows 版本。

所有实现截图均由浏览器在 1280×720、1× 密度下捕获；每个窗口的实际 CSS 边界记录在 `/private/tmp/vtron-suite-review/qa-evidence.json`，同名 `*-window.png` 是按该边界裁切的真实界面。源图尺寸不一，按原始分辨率核对可读细节；键盘源图另等比缩至相同宽度，只用于结构比较，不用作逐像素证据。

完整与局部对照证据：`/private/tmp/vtron-win10-media-review/*-comparison.png`、`/private/tmp/vtron-accessibility-review/*-comparison.png`、`/private/tmp/vtron-management-review/*-comparison.png`。对照涵盖标题/功能区或菜单、字体与间距、颜色、图像、正文/表格、操作区及底栏。控制面板、MMC 和媒体界面的密集工具栏已单独检查；原版截图中的个人数据、红色文章标注和故障图片未当作应用内容复制。

首轮发现并修复：写字板/画图的自定义标题图标尺寸错误、画图功能区横向滚动、字符网格的横向滚动遮挡末行、照片集合导航高度，以及大窗口按完整视口居中导致底部被任务栏盖住 4px。注册层现在依据当前 System 的尺寸及实际任务栏高度定位。资源图表在尚无样本时显示“—”，有真实采样后才显示数值。第二轮最终截图中未发现阻碍当前实现范围的 P0/P1/P2。写字板保存证明图中的自动化滚动另经 DOM 与重开流程核实：新建/打开均为 `scrollTop=0` 且正文可见，没有为截图强制改动正常编辑滚动。

浏览器功能验证通过：写字板保存到 `Note/win10-tools-demo.html` 后重开；画图真实笔画保存到 `Photo/win10-paint-demo.png`，照片集合发现并打开 640×400 图片；生成的两秒 WAV 在播放器中解码成功，静音播放时 `paused=false`、进度推进、`readyState=4`、无媒体错误；屏幕键盘向记事本输入 `hello`；字符 A 选择与复制、Unicode `03A9` 定位；控制面板打开系统信息；资源监视器显示真实 rAF/JS 堆/窗口数据。命令提示符已验证目录列表、带尾分隔符的 Windows 路径及文本读取，修复初始目录尾斜杠不符合虚拟文件系统查询约定的问题。

`vtron-plus` 全量类型检查、Demo 生产构建及本次 diff 空白检查通过，未新增测试。Demo 全量类型检查的既有声明/WebDAV 问题见上节，本次未修改其所属代码。运行期间未发现新增应用自身的错误；工具注入的历史 MutationObserver 日志仍存在。没有触发屏幕、麦克风、远程控制或 Windows 权限请求，没有执行清理或删除操作。

P3 与范围差异：宿主缺少部分 Windows 字体，文字抗锯齿、滑块和滚动条存在平台差别；入口图标有语义相近的 Windows 原生资源替代；部分 MDL 图标、版本、主题和空状态细节未达到整图逐像素一致。管理工具中的真实数据与原版个人电脑截图不同，无系统能力的区域使用明确空状态而非演示数据。当前版本只在本地 Demo 生效，未提交、发布或部署。
