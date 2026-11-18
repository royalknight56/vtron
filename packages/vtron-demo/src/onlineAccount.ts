import { ref } from 'vue';

type Account = { username: string };
type Credentials = { username: string; password: string };
type Action = 'register' | 'login' | 'logout' | 'delete';
type Result = { account: Account | null } | { error: string };

const endpoint = '/api/account';
const messages: Record<string, string> = {
  invalid_credentials_format: '请检查用户名和密码格式。',
  username_taken: '此用户名已被使用。',
  invalid_credentials: '用户名或密码不正确。',
  not_signed_in: '登录已失效，请重新登录。',
  rate_limited: '操作过于频繁，请一分钟后再试。',
};

export const account = ref<Account | null>(null);
export const accountBusy = ref(false);
export const accountError = ref('');
export const accountLoaded = ref(false);

async function request(action?: Action, credentials?: Credentials): Promise<Result> {
  const response = await fetch(action ? `${endpoint}/${action}` : endpoint, {
    method: action ? 'POST' : 'GET',
    credentials: 'same-origin',
    redirect: 'error',
    signal: AbortSignal.timeout(10_000),
    ...(credentials ? { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(credentials) } : {}),
  });
  return response.json();
}

export async function updateAccount(action?: Action, credentials?: Credentials): Promise<boolean> {
  if (accountBusy.value) return false;
  accountBusy.value = true;
  accountError.value = '';
  try {
    const result = await request(action, credentials);
    if ('account' in result) {
      account.value = result.account;
      accountLoaded.value = true;
      return true;
    }
    if (result.error === 'not_signed_in') account.value = null;
    accountError.value = messages[result.error] ?? '暂时无法连接在线账户服务，请稍后重试。';
  } catch {
    accountError.value = '暂时无法连接在线账户服务，请稍后重试。';
  } finally {
    accountBusy.value = false;
  }
  return false;
}
