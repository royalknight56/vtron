<template>
  <div class="outer">
    <div class="uper">
      <div class="title">创建网络链接</div>
    </div>
    <div class="content" v-if="step === 0">
      <div class="txt">
        本程序将引导您在桌面创建其他网站的快捷链接，点击下一步继续
      </div>
    </div>
    <div class="content" v-if="step === 1">
      <div class="txt">
        <label for="linki">请输入网站链接</label>
        <input id="linki" v-model="link" />
      </div>
      <div class="txt">
        <label for="namei">请输入网站名称</label>
        <input id="namei" v-model="name" />
      </div>
    </div>
    <div class="footer">
      <WinButtonVue @click="next"> 下一步 </WinButtonVue>
    </div>
  </div>
</template>
<script setup lang="ts">
import { BrowserWindow, Dialog, System, WinButtonVue, join } from "vtron";
import { inject, ref } from "vue";
const step = ref(0);
const link = ref("");
const name = ref("");
const sys = inject<System>("system");
const win = inject<BrowserWindow>("browserWindow");

function next() {
  if (step.value === 1 && link.value && name.value) {
    sys?.fs
      .writeFile(
        join(sys._options.userLocation || "", "Desktop", name.value + ".url"),
        `link::url::${link.value}::${link.value + "/favicon.ico"}`
      )
      .then(async () => {
        await Dialog.showMessageBox({
          message: "创建成功",
          type: "info",
          title: "提示",
        });
        win?.close();
      });
    // sys?.addApp({
    //   name: link.value,
    //   icon: link.value + "/favicon.ico",
    //   window: {
    //     title: link.value,
    //     width: 800,
    //     height: 600,
    //     center: true,
    //     content: link.value,
    //   },
    // });
  }
  step.value = 1;
}
</script>
<style scoped>
.outer {
  padding: 20px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
}
.uper {
  width: 100%;
  height: 50px;

  display: flex;
  justify-content: center;
  align-items: center;
}
.title {
  font-size: 20px;
  font-weight: bold;
}
.content {
  width: 60%;
  height: 150px;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 30px;
  flex-direction: column;
}
.txt {
  margin-bottom: 10px;
}
.txt label {
  font-size: 14px;
}
.txt input {
  width: 100%;
  height: 30px;
  border-radius: 5px;
  border: 1px solid #ccc;
  padding: 0 10px;
}
</style>
