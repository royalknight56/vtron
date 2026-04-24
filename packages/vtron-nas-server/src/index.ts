/**
 * @author vtron-nas
 * 服务启动入口
 */
import http from 'http';
import fs from 'fs';
import app from './app';
import { config } from './config';
import { getDb } from './db/database';
import { initAdminUser } from './services/authService';
import { attachTerminalWs } from './services/terminalService';

/* 确保存储目录存在 */
if (!fs.existsSync(config.storagePath)) {
  fs.mkdirSync(config.storagePath, { recursive: true });
  console.log(`[INIT] 已创建存储目录: ${config.storagePath}`);
}

/* 初始化数据库与默认管理员 */
getDb();
initAdminUser();

/* 创建 HTTP 服务器 */
const server = http.createServer(app.callback());

/* 附加 WebSocket 终端服务 */
attachTerminalWs(server);

server.listen(config.port, () => {
  console.log(`[NAS] Vtron NAS Server 已启动`);
  console.log(`[NAS] 地址: http://localhost:${config.port}`);
  console.log(`[NAS] 存储路径: ${config.storagePath}`);
});
