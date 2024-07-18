<template>
  <div class="container">
    <div class="nav">
      <ul>
        <li
          v-for="(item, index) in items"
          :key="index"
          @click="selectItem(index)"
          :class="{ active: index === activeIndex }"
        >
          {{ item }}
        </li>
      </ul>
    </div>
    <div class="setting">
      <div v-if="0 === activeIndex">
        <div class="setting-item">
          <h1 class="setting-title">{{ i18n('account.info') }}</h1>
        </div>
        <template v-if="haveAccount">
          <div class="setting-item">
            <label> {{ i18n('account') }} </label>
            <WinInput v-model="account" placeholder="" />
          </div>
          <div class="setting-item">
            <label> {{ i18n('password') }} </label>
            <WinInput v-model="password" placeholder="" type="password" />
          </div>
          <div class="setting-item">
            <label></label>
            <WinButton @click="submit">{{ i18n('confirm') }} </WinButton>
            <WinButton @click="deleteAccount">{{ i18n('delete') }} </WinButton>
          </div>
        </template>
        <template v-else>
          <div class="setting-item">
            <label>{{ i18n('no.account') }}</label>
            <WinButton @click="addAccount">{{ i18n('create.account') }} </WinButton>
          </div>
          <div class="setting-item">
            <label></label>
            {{ i18n('create.account.for.unlock') }}
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import WinButton from '@packages/components/WinButton.vue';
import WinInput from '@packages/components/WinInput.vue';
import { inject, ref } from 'vue';
import { System } from '@packages/kernel';
import { i18n } from '@/packages/computer/i18n';
import { Dialog } from '@/packages/services';

const system = inject<System>('system')!;

const items = [i18n('account.info')];

const activeIndex = ref(0);

// const modelvalue = ref(system.getConfig('lang'));
const password = ref('');
const account = ref(localStorage.getItem('vtron-username') || '');
const haveAccount = ref(!!localStorage.getItem('vtron-username')?.length);
const selectItem = (index: number) => {
  activeIndex.value = index;
};

async function submit() {
  //   await system.setConfig('lang', modelvalue.value);
  localStorage.setItem('vtron-username', account.value);
  localStorage.setItem('vtron-password', password.value);

  system
    .createDialog()
    .showMessageBox({
      message: i18n('save.success'),
      title: i18n('account'),
      type: 'info',
    })
    .then(() => {
      system?.restart();
    });
}
/** 添加账号 */
async function addAccount() {
  const res = await Dialog.showInput({
    title: i18n('account'),
    message: i18n('account'),
    placeholder: i18n('account'),
  });
  if (res?.response?.length) {
    account.value = res.response;
    haveAccount.value = true;
    localStorage.setItem('vtron-username', account.value);
  }
}
/** 删除账号 */
async function deleteAccount() {
  const res = await Dialog.showMessageBox({
    title: i18n('account'),
    message: i18n('delete.account.tip'),
    type: 'warning',
    buttons: [i18n('confirm'), i18n('cancel')],
  });
  if (res?.response === 0) {
    account.value = '';
    password.value = '';
    haveAccount.value = false;
    localStorage.removeItem('vtron-username');
    localStorage.removeItem('vtron-password');
  }
}
</script>
<style scoped>
@import './setStyle.css';
</style>
