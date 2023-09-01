<!--
 * @Author: Royal
 * @LastEditTime: 2022-07-15 11:09:16
 * @Description: Need CodeReview
-->
<script lang="ts" setup>
import { ref } from 'vue';
import { useSystem } from '../../system';

const sys = useSystem();
const loginCallback = sys._options.loginCallback;

const lockClassName = ref('screen-show');
const alertMsg = ref('');

function loginSuccess() {
  //   lockClassName.value = 'screen-hidean';
  //   setTimeout(() => {
  //     lockClassName.value = 'screen-hide';
  //   }, 500);
}
const userName = ref('admin');
const userPassword = ref('');
async function onLogin() {
  if (loginCallback) {
    alertMsg.value = '等待确认';
    const res = await loginCallback(userName.value, userPassword.value);
    if (res) {
      loginSuccess();
    } else {
      alertMsg.value = '密码错误';
    }
  }
}
</script>

<template>
  <div class="lockscreen" :class="lockClassName">
    <!---->
    <div class="login-box">
      <span
        class="ant-avatar ant-avatar-icon"
        style="width: 128px; height: 128px; line-height: 128px; font-size: 64px"
      >
        <span role="img" aria-label="user" class="anticon">
          <svg focusable="false" width="1em" fill="currentColor" aria-hidden="true" viewBox="64 64 896 896">
            <path
              d="M858.5 763.6a374 374 0 00-80.6-119.5 375.63 375.63 0 00-119.5-80.6c-.4-.2-.8-.3-1.2-.5C719.5 518 760 444.7 760 362c0-137-111-248-248-248S264 225 264 362c0 82.7 40.5 156 102.8 201.1-.4.2-.8.3-1.2.5-44.8 18.9-85 46-119.5 80.6a375.63 375.63 0 00-80.6 119.5A371.7 371.7 0 00136 901.8a8 8 0 008 8.2h60c4.4 0 7.9-3.5 8-7.8 2-77.2 33-149.5 87.8-204.3 56.7-56.7 132-87.9 212.2-87.9s155.5 31.2 212.2 87.9C779 752.7 810 825 812 902.2c.1 4.4 3.6 7.8 8 7.8h60a8 8 0 008-8.2c-1-47.8-10.9-94.3-29.5-138.2zM512 534c-45.9 0-89.1-17.9-121.6-50.4S340 407.9 340 362c0-45.9 17.9-89.1 50.4-121.6S466.1 190 512 190s89.1 17.9 121.6 50.4S684 316.1 684 362c0 45.9-17.9 89.1-50.4 121.6S557.9 534 512 534z"
            />
          </svg>
        </span>
      </span>
      <div class="username">
        <span class="ant-input-group">
          <input placeholder="请输入用户名" autofocus class="ant-input" v-model="userName" />
        </span>
      </div>
      <span>
        <span class="ant-input-group">
          <!---->
          <input
            v-if="sys._options.noPassword !== true"
            placeholder="请输入登录密码"
            type="password"
            autofocus
            class="ant-input"
            v-model="userPassword"
          />
          <span class="ant-input-group-addon">
            <button class="ant-btn-primary" type="button" @click="onLogin">
              <!---->
              <span class="anticon">
                <svg
                  focusable="false"
                  width="1em"
                  height="1em"
                  fill="currentColor"
                  aria-hidden="true"
                  viewBox="64 64 896 896"
                >
                  <path
                    d="M869 487.8L491.2 159.9c-2.9-2.5-6.6-3.9-10.5-3.9h-88.5c-7.4 0-10.8 9.2-5.2 14l350.2 304H152c-4.4 0-8 3.6-8 8v60c0 4.4 3.6 8 8 8h585.1L386.9 854c-5.6 4.9-2.2 14 5.2 14h91.5c1.9 0 3.8-.7 5.2-2L869 536.2a32.07 32.07 0 000-48.4z"
                  />
                </svg>
              </span>
            </button>
          </span>
        </span>
        <div class="tip">{{ alertMsg }}</div>
      </span>
    </div>
  </div>
</template>
<style scoped lang="scss">
// @import '../../main.css';
.lockscreen {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 201;
  display: flex;
  overflow: hidden;
  color: #fff;
  // background: #000;
  background-color: rgba(25, 28, 34, 0.78);
  -webkit-backdrop-filter: blur(7px);
  backdrop-filter: blur(7px);
  .login-box {
    position: absolute;
    top: 45%;
    left: 50%;
    display: flex;
    transform: translate(-50%, -50%);
    flex-direction: column;
    justify-content: center;
    align-items: center;
    .ant-avatar {
      text-align: center;
      vertical-align: middle;
      background: #ccc;
      border-radius: 50%;
      margin-bottom: 14px;
      .anticon {
        display: inline-block;
        color: inherit;
        font-style: normal;
        line-height: 0;
        text-align: center;
        text-transform: none;
        vertical-align: -0.125em;
        text-rendering: optimizeLegibility;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
      }
    }
    .ant-input-group {
      display: flex;
      .ant-input {
        padding: 6px 11px;
        font-size: 16px;
        outline: none;
        border: none;
      }
      .ant-btn-primary {
        color: #fff;
        background: #1890ff;
        border-color: #1890ff;
        border: none;
        text-shadow: 0 -1px 0 rgb(0 0 0 / 12%);
        box-shadow: 0 2px 0 rgb(0 0 0 / 5%);
        height: 30px;
        padding: 6.4px 15px;
        font-size: 16px;
        border-radius: 2px;
        transition: all 0.3s;
        cursor: pointer;
      }
      .ant-btn-primary:hover {
        color: #fff;
        background: #40a9ff;
        border-color: #40a9ff;
      }
      .ant-btn-primary:active {
        color: #fff;
        background: #096dd9;
        border-color: #096dd9;
      }
    }

    .username {
      font-size: 30px;
      margin-bottom: 14px;
    }
  }
  .tip {
    padding: 4px 0px;
    font-size: 12px;
    height: 30px;
  }
}

.screen-hidean {
  animation: outan 0.5s forwards;
}
.screen-hide {
  display: none;
}
@keyframes outan {
  0% {
    opacity: 1;
  }
  30% {
    opacity: 0;
  }
  100% {
    transform: translateY(-100%);
    opacity: 0;
  }
}
</style>
