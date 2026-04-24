<!--
 * @author vtron-nas
 * Web 终端 -- xterm.js + WebSocket
-->
<template>
  <div class="terminal-app" ref="termRef"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { getToken } from '../api/client';
import 'xterm/css/xterm.css';

const termRef = ref<HTMLElement>();
let terminal: Terminal;
let fitAddon: FitAddon;
let ws: WebSocket;

onMounted(() => {
  terminal = new Terminal({
    cursorBlink: true,
    fontSize: 14,
    fontFamily: "'Consolas', 'Monaco', 'Courier New', monospace",
    theme: {
      background: '#1e1e1e',
      foreground: '#d4d4d4',
      cursor: '#d4d4d4',
    },
  });

  fitAddon = new FitAddon();
  terminal.loadAddon(fitAddon);
  terminal.open(termRef.value!);
  fitAddon.fit();

  const token = getToken();
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = `${protocol}//${window.location.host}/ws/terminal?token=${token}`;
  ws = new WebSocket(wsUrl);

  ws.onopen = () => {
    terminal.writeln('连接已建立...\r\n');
    ws.send(JSON.stringify({ type: 'resize', cols: terminal.cols, rows: terminal.rows }));
  };

  ws.onmessage = (event) => {
    try {
      const msg = JSON.parse(event.data);
      if (msg.type === 'output') {
        terminal.write(msg.data);
      }
    } catch {
      terminal.write(event.data);
    }
  };

  ws.onclose = () => {
    terminal.writeln('\r\n\x1b[31m连接已断开\x1b[0m');
  };

  ws.onerror = () => {
    terminal.writeln('\r\n\x1b[31m连接错误\x1b[0m');
  };

  terminal.onData((data) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'input', data }));
    }
  });

  terminal.onResize(({ cols, rows }) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'resize', cols, rows }));
    }
  });

  /* 监听容器大小变化 */
  const observer = new ResizeObserver(() => fitAddon.fit());
  observer.observe(termRef.value!);
});

onBeforeUnmount(() => {
  ws?.close();
  terminal?.dispose();
});
</script>

<style scoped>
.terminal-app {
  width: 100%;
  height: 100%;
  background: #1e1e1e;
}
</style>
