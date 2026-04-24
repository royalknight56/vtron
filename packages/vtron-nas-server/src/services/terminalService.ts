/**
 * @author vtron-nas
 * WebSocket 终端服务（node-pty）
 */
import { Server as HttpServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import type { JwtPayload } from '../middleware/auth';

let ptyModule: any;
try {
  ptyModule = require('node-pty');
} catch {
  console.warn('[TERMINAL] node-pty 未安装，Web 终端功能不可用');
}

/**
 * 将 WebSocket 终端服务附加到 HTTP 服务器上
 */
export function attachTerminalWs(server: HttpServer): void {
  if (!ptyModule) return;

  const wss = new WebSocketServer({ server, path: '/ws/terminal' });

  wss.on('connection', (ws: WebSocket, req) => {
    const url = new URL(req.url || '', `http://${req.headers.host}`);
    const token = url.searchParams.get('token');
    if (!token) {
      ws.close(4001, '未提供认证令牌');
      return;
    }

    let user: JwtPayload;
    try {
      user = jwt.verify(token, config.jwtSecret) as JwtPayload;
    } catch {
      ws.close(4001, '认证令牌无效');
      return;
    }

    const shell = process.platform === 'win32' ? 'powershell.exe' : 'bash';
    const ptyProcess = ptyModule.spawn(shell, [], {
      name: 'xterm-256color',
      cols: 120,
      rows: 30,
      cwd: config.storagePath,
      env: process.env,
    });

    ptyProcess.onData((data: string) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'output', data }));
      }
    });

    ptyProcess.onExit(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    });

    ws.on('message', (msg: Buffer) => {
      try {
        const parsed = JSON.parse(msg.toString());
        if (parsed.type === 'input') {
          ptyProcess.write(parsed.data);
        } else if (parsed.type === 'resize') {
          ptyProcess.resize(parsed.cols || 120, parsed.rows || 30);
        }
      } catch {
        // 非 JSON 直接当输入处理
        ptyProcess.write(msg.toString());
      }
    });

    ws.on('close', () => {
      ptyProcess.kill();
    });
  });

  console.log('[TERMINAL] WebSocket 终端服务已启动');
}
