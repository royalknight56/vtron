<template>
  <div class="ai-chat">
    <div class="ai-chat-toolbar">
      <button class="ai-chat-toolbar__btn" @click="showSettings = !showSettings" title="设置">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"
          stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path
            d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
        </svg>
      </button>
      <span class="ai-chat-toolbar__title">AI Assistant</span>
      <button class="ai-chat-toolbar__btn" @click="clearChat" title="清空对话">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"
          stroke-linecap="round" stroke-linejoin="round">
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
        </svg>
      </button>
    </div>

    <div v-if="showSettings" class="ai-chat-settings">
      <div class="ai-chat-settings__field">
        <label>API Key</label>
        <div class="ai-chat-settings__row">
          <input :type="showApiKey ? 'text' : 'password'" v-model="apiKey" placeholder="sk-ant-api03-..."
            @change="saveSettings" />
          <button class="ai-chat-settings__eye" @click="showApiKey = !showApiKey">
            {{ showApiKey ? 'Hide' : 'Show' }}
          </button>
        </div>
      </div>
      <div class="ai-chat-settings__field">
        <label>Base URL</label>
        <input type="text" v-model="baseUrl" placeholder="https://api.anthropic.com" @change="saveSettings" />
      </div>
      <div class="ai-chat-settings__field">
        <label>Model</label>
        <input type="text" v-model="model" placeholder="claude-sonnet-4-20250514" @change="saveSettings" />
      </div>
      <div class="ai-chat-settings__field">
        <label>Max Tokens</label>
        <input type="number" v-model.number="maxTokens" placeholder="4096" @change="saveSettings" />
      </div>
    </div>

    <div class="ai-chat-messages" ref="messagesContainer">
      <div v-if="messages.length === 0" class="ai-chat-welcome">
        <div class="ai-chat-welcome__icon">
          <svg width="48" height="48" viewBox="0 0 64 64" fill="none">
            <rect width="64" height="64" rx="14" fill="#7c3aed" opacity="0.1" />
            <path d="M18 20h28a3 3 0 013 3v16a3 3 0 01-3 3H32l-7 6v-6h-7a3 3 0 01-3-3V23a3 3 0 013-3z"
              fill="#7c3aed" opacity=".6" />
            <circle cx="26" cy="31" r="2" fill="#fff" />
            <circle cx="32" cy="31" r="2" fill="#fff" />
            <circle cx="38" cy="31" r="2" fill="#fff" />
          </svg>
        </div>
        <p class="ai-chat-welcome__text">有什么可以帮助你的吗？</p>
        <p class="ai-chat-welcome__hint" v-if="!apiKey" @click="showSettings = true">
          请先点击此处配置 API Key
        </p>
      </div>

      <div v-for="msg in messages" :key="msg.id"
        :class="msg.isTool ? 'ai-chat-tool' : ['ai-chat-msg', 'ai-chat-msg--' + msg.role]">
        <template v-if="msg.isTool">
          <div class="ai-chat-tool__badge">
            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2">
              <path
                d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" />
            </svg>
            {{ msg.content }}
          </div>
        </template>
        <template v-else>
          <div class="ai-chat-msg__avatar" :class="'ai-chat-msg__avatar--' + msg.role">
            {{ msg.role === 'user' ? 'U' : 'AI' }}
          </div>
          <div class="ai-chat-msg__bubble" :class="'ai-chat-msg__bubble--' + msg.role">
            <div class="ai-chat-msg__content" v-html="renderContent(msg.content)"></div>
          </div>
        </template>
      </div>

      <div v-if="errorMsg" class="ai-chat-error">
        {{ errorMsg }}
      </div>
    </div>

    <div class="ai-chat-input">
      <textarea ref="inputRef" v-model="inputText" @keydown="handleKeydown" @input="autoResize"
        placeholder="输入消息... (Enter 发送, Shift+Enter 换行)" rows="1"></textarea>
      <button v-if="isLoading" class="ai-chat-input__btn ai-chat-input__btn--stop" @click="stopGeneration"
        title="停止生成">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <rect x="4" y="4" width="16" height="16" rx="2" />
        </svg>
      </button>
      <button v-else class="ai-chat-input__btn ai-chat-input__btn--send" @click="sendMessage"
        :disabled="!inputText.trim()" title="发送">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
        </svg>
      </button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, nextTick, onMounted, inject } from 'vue';
import { System } from 'vtron';

interface ChatMessage {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  isTool?: boolean;
  toolName?: string;
}

interface ContentBlock {
  type: 'text' | 'tool_use';
  text?: string;
  id?: string;
  name?: string;
  inputJson?: string;
}

const STORAGE_KEY = 'vtron-ai-chat-settings';

const sys = inject<System>('system');

const messages = ref<ChatMessage[]>([]);
const inputText = ref('');
const isLoading = ref(false);
const errorMsg = ref('');
const showSettings = ref(false);
const showApiKey = ref(false);

const apiKey = ref('');
const baseUrl = ref('https://api.anthropic.com');
const model = ref('claude-sonnet-4-20250514');
const maxTokens = ref(4096);

const messagesContainer = ref<HTMLDivElement>();
const inputRef = ref<HTMLTextAreaElement>();

let abortController: AbortController | null = null;
let apiHistory: any[] = [];

function loadSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const s = JSON.parse(raw);
      if (s.apiKey) apiKey.value = s.apiKey;
      if (s.baseUrl) baseUrl.value = s.baseUrl;
      if (s.model) model.value = s.model;
      if (s.maxTokens) maxTokens.value = s.maxTokens;
    }
  } catch {
    /* ignore */
  }
}

function saveSettings() {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      apiKey: apiKey.value,
      baseUrl: baseUrl.value,
      model: model.value,
      maxTokens: maxTokens.value,
    }),
  );
}

function renderContent(text: string): string {
  if (!text) return '';

  let html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

  const codeBlocks: string[] = [];
  html = html.replace(/```(\w*)\n?([\s\S]*?)```/g, (_, _lang, code) => {
    const idx = codeBlocks.length;
    codeBlocks.push(`<pre class="ai-chat-code"><code>${code.trimEnd()}</code></pre>`);
    return `\n__CB${idx}__\n`;
  });

  html = html.replace(/`([^`\n]+)`/g, '<code class="ai-chat-icode">$1</code>');
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\n/g, '<br>');

  codeBlocks.forEach((block, idx) => {
    html = html.replace(`<br>__CB${idx}__<br>`, block);
    html = html.replace(`__CB${idx}__`, block);
  });

  return html;
}

function scrollToBottom() {
  nextTick(() => {
    const el = messagesContainer.value;
    if (el) el.scrollTop = el.scrollHeight;
  });
}

function autoResize() {
  nextTick(() => {
    const el = inputRef.value;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
  });
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
}

function clearChat() {
  messages.value = [];
  apiHistory = [];
  errorMsg.value = '';
}

function stopGeneration() {
  abortController?.abort();
  abortController = null;
  isLoading.value = false;
}

function getAvailableApps(): { name: string; loc: string }[] {
  if (!sys) return [];
  const apps: { name: string; loc: string }[] = [];
  const map = sys.stateManager.windowMap;
  for (const loc of ['Desktop', 'Magnet', 'Menulist', 'Builtin'] as const) {
    map[loc].forEach((_opt, name) => {
      apps.push({ name, loc });
    });
  }
  return apps;
}

function getTools() {
  const apps = getAvailableApps();
  const appNames = apps.map((a) => a.name);
  if (appNames.length === 0) return [];
  return [
    {
      name: 'open_app',
      description: `Open an application window in the desktop. Available: ${appNames.join(', ')}`,
      input_schema: {
        type: 'object' as const,
        properties: {
          app_name: {
            type: 'string',
            description: 'The exact name of the application to open',
            enum: appNames,
          },
        },
        required: ['app_name'],
      },
    },
  ];
}

function executeTool(name: string, input: any): string {
  if (name === 'open_app') {
    const appName = input.app_name;
    const apps = getAvailableApps();
    const found = apps.find((a) => a.name === appName);
    if (!found || !sys) {
      return `Application "${appName}" not found. Available: ${apps.map((a) => a.name).join(', ')}`;
    }
    const winopt = sys.stateManager.windowMap.get(found.loc as any, found.name);
    if (winopt && winopt.type !== 'group') {
      const win = sys.createWindow(winopt.window);
      win.show();
      return `Successfully opened "${appName}"`;
    }
    return `Could not open "${appName}"`;
  }
  return `Unknown tool "${name}"`;
}

function buildHeaders(): Record<string, string> {
  const isOfficialApi = baseUrl.value.includes('anthropic.com');
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (isOfficialApi) {
    headers['x-api-key'] = apiKey.value;
    headers['anthropic-version'] = '2023-06-01';
    headers['anthropic-dangerous-direct-browser-access'] = 'true';
  } else {
    headers['Authorization'] = `Bearer ${apiKey.value}`;
  }
  return headers;
}

async function sendMessage() {
  const text = inputText.value.trim();
  if (!text || isLoading.value) return;

  if (!apiKey.value) {
    showSettings.value = true;
    errorMsg.value = '请先配置 API Key';
    return;
  }

  errorMsg.value = '';
  messages.value.push({ id: Date.now(), role: 'user', content: text });
  apiHistory.push({ role: 'user', content: text });
  inputText.value = '';
  autoResize();
  scrollToBottom();

  isLoading.value = true;
  abortController = new AbortController();

  try {
    await callApi();
  } catch (err: any) {
    if (err.name !== 'AbortError') {
      errorMsg.value = err.message || '请求失败';
    }
    const last = messages.value[messages.value.length - 1];
    if (last?.role === 'assistant' && !last.content && !last.isTool) {
      messages.value.pop();
    }
  } finally {
    isLoading.value = false;
    abortController = null;
    scrollToBottom();
  }
}

async function callApi(maxDepth = 5) {
  for (let i = 0; i < maxDepth; i++) {
    const url = baseUrl.value.replace(/\/+$/, '') + '/v1/messages';
    const tools = getTools();

    const body: any = {
      model: model.value,
      max_tokens: maxTokens.value,
      messages: apiHistory,
      stream: true,
    };
    if (tools.length > 0) {
      body.tools = tools;
      body.tool_choice = { type: 'auto' };
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: buildHeaders(),
      body: JSON.stringify(body),
      signal: abortController!.signal,
    });

    if (!response.ok) {
      let errText = `HTTP ${response.status}`;
      try {
        const respBody = await response.text();
        const parsed = JSON.parse(respBody);
        errText = parsed.error?.message || respBody;
      } catch {
        /* use status */
      }
      throw new Error(errText);
    }

    messages.value.push({ id: Date.now() + i, role: 'assistant', content: '' });
    const displayMsg = messages.value[messages.value.length - 1];

    const contentBlocks: ContentBlock[] = [];
    let stopReason = '';

    const ct = response.headers.get('content-type') || '';

    if (ct.includes('text/event-stream')) {
      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith('event:')) continue;
          if (!trimmed.startsWith('data:')) continue;

          const jsonStr = trimmed.slice(5).trim();
          if (jsonStr === '[DONE]') continue;

          try {
            const ev = JSON.parse(jsonStr);

            if (ev.type === 'content_block_start') {
              const b = ev.content_block;
              if (b.type === 'text') {
                contentBlocks[ev.index] = { type: 'text', text: '' };
              } else if (b.type === 'tool_use') {
                contentBlocks[ev.index] = {
                  type: 'tool_use',
                  id: b.id,
                  name: b.name,
                  inputJson: '',
                };
              }
            }

            if (ev.type === 'content_block_delta') {
              const block = contentBlocks[ev.index];
              if (block && ev.delta) {
                if (ev.delta.type === 'text_delta') {
                  block.text = (block.text || '') + ev.delta.text;
                  displayMsg.content += ev.delta.text;
                  scrollToBottom();
                } else if (ev.delta.type === 'input_json_delta') {
                  block.inputJson = (block.inputJson || '') + ev.delta.partial_json;
                }
              }
            }

            if (ev.type === 'message_delta') {
              stopReason = ev.delta?.stop_reason || '';
            }

            if (ev.type === 'error') {
              throw new Error(ev.error?.message || 'API stream error');
            }
          } catch (e) {
            if (e instanceof SyntaxError) continue;
            throw e;
          }
        }
      }
    } else {
      const data = await response.json();
      stopReason = data.stop_reason || '';
      if (data.content) {
        for (const block of data.content) {
          if (block.type === 'text') {
            contentBlocks.push({ type: 'text', text: block.text });
            displayMsg.content += block.text;
          } else if (block.type === 'tool_use') {
            contentBlocks.push({
              type: 'tool_use',
              id: block.id,
              name: block.name,
              inputJson: JSON.stringify(block.input),
            });
          }
        }
      }
      scrollToBottom();
    }

    if (!displayMsg.content) {
      const idx = messages.value.indexOf(displayMsg);
      if (idx >= 0) messages.value.splice(idx, 1);
    }

    const apiContent: any[] = [];
    for (const block of contentBlocks) {
      if (!block) continue;
      if (block.type === 'text' && block.text) {
        apiContent.push({ type: 'text', text: block.text });
      } else if (block.type === 'tool_use') {
        let input = {};
        try {
          input = JSON.parse(block.inputJson || '{}');
        } catch {
          /* ignore */
        }
        apiContent.push({ type: 'tool_use', id: block.id, name: block.name, input });
      }
    }
    apiHistory.push({ role: 'assistant', content: apiContent });

    if (stopReason === 'tool_use') {
      const toolResults: any[] = [];
      for (const block of apiContent) {
        if (block.type !== 'tool_use') continue;

        messages.value.push({
          id: Date.now(),
          role: 'assistant',
          content: `${block.name}(${JSON.stringify(block.input)})`,
          isTool: true,
          toolName: block.name,
        });
        scrollToBottom();

        const result = executeTool(block.name, block.input);

        messages.value.push({
          id: Date.now() + 1,
          role: 'assistant',
          content: result,
          isTool: true,
          toolName: block.name,
        });
        scrollToBottom();

        toolResults.push({ type: 'tool_result', tool_use_id: block.id, content: result });
      }

      apiHistory.push({ role: 'user', content: toolResults });
      continue;
    }

    break;
  }
}

onMounted(() => {
  loadSettings();
  if (!apiKey.value) {
    showSettings.value = true;
  }
});
</script>

<style scoped>
.ai-chat {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #fafafa;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 13px;
  color: #1a1a2e;
  overflow: hidden;
}

.ai-chat-toolbar {
  display: flex;
  align-items: center;
  height: 40px;
  padding: 0 8px;
  background: #fff;
  border-bottom: 1px solid #e8e8ec;
  flex-shrink: 0;
}

.ai-chat-toolbar__title {
  flex: 1;
  text-align: center;
  font-weight: 600;
  font-size: 13px;
  color: #1a1a2e;
}

.ai-chat-toolbar__btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  border-radius: 6px;
  cursor: pointer;
  color: #6b7280;
  transition: all 0.15s;
}

.ai-chat-toolbar__btn:hover {
  background: #f3f4f6;
  color: #7c3aed;
}

.ai-chat-settings {
  padding: 12px 14px;
  background: #fff;
  border-bottom: 1px solid #e8e8ec;
  flex-shrink: 0;
}

.ai-chat-settings__field {
  margin-bottom: 10px;
}

.ai-chat-settings__field:last-child {
  margin-bottom: 0;
}

.ai-chat-settings__field label {
  display: block;
  font-size: 11px;
  font-weight: 600;
  color: #6b7280;
  margin-bottom: 4px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.ai-chat-settings__field input,
.ai-chat-settings__field select {
  width: 100%;
  height: 30px;
  padding: 0 8px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 12px;
  background: #fafafa;
  color: #1a1a2e;
  outline: none;
  transition: border-color 0.15s;
}

.ai-chat-settings__field input:focus {
  border-color: #7c3aed;
  box-shadow: 0 0 0 2px rgba(124, 58, 237, 0.1);
}

.ai-chat-settings__row {
  display: flex;
  gap: 6px;
}

.ai-chat-settings__row input {
  flex: 1;
}

.ai-chat-settings__eye {
  height: 30px;
  padding: 0 10px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: #fff;
  font-size: 11px;
  color: #6b7280;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.15s;
}

.ai-chat-settings__eye:hover {
  border-color: #7c3aed;
  color: #7c3aed;
}

.ai-chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px 14px;
  scroll-behavior: smooth;
}

.ai-chat-welcome {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 12px;
  opacity: 0.7;
}

.ai-chat-welcome__text {
  font-size: 15px;
  font-weight: 500;
  color: #4b5563;
}

.ai-chat-welcome__hint {
  font-size: 12px;
  color: #7c3aed;
  cursor: pointer;
  padding: 4px 12px;
  border-radius: 12px;
  background: rgba(124, 58, 237, 0.08);
  transition: background 0.15s;
}

.ai-chat-welcome__hint:hover {
  background: rgba(124, 58, 237, 0.15);
}

.ai-chat-msg {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  animation: msgIn 0.2s ease-out;
}

@keyframes msgIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.ai-chat-msg--user {
  flex-direction: row-reverse;
}

.ai-chat-msg__avatar {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 700;
  flex-shrink: 0;
  margin-top: 2px;
}

.ai-chat-msg__avatar--user {
  background: #7c3aed;
  color: #fff;
}

.ai-chat-msg__avatar--assistant {
  background: #e5e7eb;
  color: #4b5563;
}

.ai-chat-msg__bubble {
  max-width: 82%;
  padding: 8px 12px;
  border-radius: 12px;
  line-height: 1.55;
  word-break: break-word;
}

.ai-chat-msg__bubble--user {
  background: #7c3aed;
  color: #fff;
  border-bottom-right-radius: 4px;
}

.ai-chat-msg__bubble--assistant {
  background: #fff;
  color: #1a1a2e;
  border: 1px solid #e8e8ec;
  border-bottom-left-radius: 4px;
}

.ai-chat-msg__content {
  font-size: 13px;
}

.ai-chat-tool {
  display: flex;
  justify-content: center;
  margin-bottom: 10px;
  animation: msgIn 0.2s ease-out;
}

.ai-chat-tool__badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 12px;
  font-size: 11px;
  color: #15803d;
  max-width: 90%;
  word-break: break-all;
}

.ai-chat-tool__badge svg {
  flex-shrink: 0;
}

.ai-chat-error {
  margin: 8px 0;
  padding: 8px 12px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  color: #dc2626;
  font-size: 12px;
}

.ai-chat-input {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  padding: 10px 14px;
  background: #fff;
  border-top: 1px solid #e8e8ec;
  flex-shrink: 0;
}

.ai-chat-input textarea {
  flex: 1;
  min-height: 32px;
  max-height: 120px;
  padding: 6px 10px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 13px;
  font-family: inherit;
  color: #1a1a2e;
  background: #fafafa;
  resize: none;
  outline: none;
  line-height: 1.5;
  transition: border-color 0.15s;
}

.ai-chat-input textarea:focus {
  border-color: #7c3aed;
  box-shadow: 0 0 0 2px rgba(124, 58, 237, 0.1);
}

.ai-chat-input textarea::placeholder {
  color: #9ca3af;
}

.ai-chat-input__btn {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
  transition: all 0.15s;
}

.ai-chat-input__btn--send {
  background: #7c3aed;
  color: #fff;
}

.ai-chat-input__btn--send:hover:not(:disabled) {
  background: #6d28d9;
}

.ai-chat-input__btn--send:disabled {
  background: #d1d5db;
  cursor: not-allowed;
}

.ai-chat-input__btn--stop {
  background: #ef4444;
  color: #fff;
}

.ai-chat-input__btn--stop:hover {
  background: #dc2626;
}

:deep(.ai-chat-code) {
  margin: 8px 0 4px;
  padding: 10px 12px;
  background: #1e1e2e;
  border-radius: 8px;
  overflow-x: auto;
  font-size: 12px;
  line-height: 1.5;
}

:deep(.ai-chat-code code) {
  color: #cdd6f4;
  font-family: 'SF Mono', Monaco, 'Cascadia Code', Consolas, monospace;
  white-space: pre;
}

:deep(.ai-chat-icode) {
  padding: 1px 5px;
  background: rgba(124, 58, 237, 0.08);
  border-radius: 4px;
  font-size: 12px;
  font-family: 'SF Mono', Monaco, 'Cascadia Code', Consolas, monospace;
  color: #7c3aed;
}

.ai-chat-msg__bubble--user :deep(.ai-chat-icode) {
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
}

.ai-chat-msg__bubble--user :deep(.ai-chat-code) {
  background: rgba(0, 0, 0, 0.2);
}

.ai-chat-msg__bubble--user :deep(.ai-chat-code code) {
  color: #f0f0f0;
}
</style>
