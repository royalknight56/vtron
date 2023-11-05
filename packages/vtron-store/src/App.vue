<script setup lang="ts">
import { onMounted, ref } from "vue";
import AppItem from "./components/AppItem.vue";
// import defaulticon from "./assets/default.png";
import moon from "./assets/moon.base?raw";
// import webdav from "./appout/webdav.es.js?raw";
// import demoApp from "./appout/demoApp.es.js?raw";
import jiepaiqi from "./assets/jiepaiqi.base?raw";
import shimo from "./assets/shimo.base?raw";
import zhengqiji from "./assets/zhengqiji.base?raw";
import vtbshuju from "./assets/vtbshuju.base?raw";
import xixuegui from "./assets/吸血鬼.base?raw";
import defaulticon from "./assets/default.base?raw";
const isready = ref(false);
const isNoSystem = ref(false);
const installedList = ref([]);
onMounted(() => {
  window.parent.postMessage({ type: "ready", data: "ready" }, "*");
  window.addEventListener("message", function (event) {
    if (event.source === window.parent) {
      let rec: any = event.data;
      if (rec.type === "init") {
        installedList.value = rec.data;
        isready.value = true;
      }
    }
  });
  setTimeout(() => {
    if (!isready.value) {
      isready.value = true;
      isNoSystem.value = true;
    }
  }, 5000);
});
function install(item: any) {
  window.parent.postMessage(
    {
      type: "install",
      data: {
        name: `${item.name}.js`,
        content: item.content?.replaceAll("\n", " "),
        uninstallContent: item.uninstallContent?.replaceAll("\n", " "),
        type: item.type,
      },
    },
    "*"
  );
}

function uninstall(item: any) {
  window.parent.postMessage(
    {
      type: "uninstall",
      data: {
        name: `${item.name}.js`,

        content: item.content?.replaceAll("\n", " "),
        uninstallContent: item.uninstallContent?.replaceAll("\n", " "),

        type: item.type,
      },
    },
    "*"
  );
}
function transSimpleUrlApp(title: string, url: string, icon: string) {
  return {
    name: title,
    desc: `添加${title} app`,
    icon: icon,
    type: "once",
    content: `function main(system){
      system.fs.writeFile(system._options.userLocation+'Desktop/${title}.url', "link::url::${url}::${icon}")
    }`,
    uninstallContent: `function main(system){
      system.fs.unlink(system._options.userLocation+'Desktop/${title}.url')
    }`,
  };
}
const temp = [
  {
    name: "systemTest",
    desc: "可以在启动的时候输出一些信息",
    icon: defaulticon,
    type: "all",
    content: `function main(system){
        console.log(system);
      }`,
  },
  {
    name: "consoleShell",
    desc: '可以在控制台输入shell命令,如shell("ls")',
    icon: defaulticon,
    type: "all",
    content: `function main(system){
        window.shell = (cmd)=>{
          system.shell(cmd)
        }
      }`,
  },

  // {
  //   name: "引导安装",
  //   desc: "引导安装的例子",
  //   icon: defaulticon,
  //   type: "once",
  //   content: demoApp,
  //   uninstallContent: `function main(system){
  //     }`,
  // },

  {
    name: "webdav",
    desc: "支持连接webdav，敬请期待",
    // type: "all",
    icon: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAAAAACPAi4CAAAAk0lEQVRYw2P8z0AZYBw1YHgYcLF9JVk6wyv1wQZccHxPpt2C+0EmMIavJNv14StABlDi//8wA8gJSMYRbMCKLIZpEZQYIPSeQfDdgBpAsRdG08HwNYDiAmWIG/CfiIAiu2Ya4gYwogXWSDXgPxEBORwNYMST2/4PUwNwFRTEKPw/TAz4T0ygkBsLQ9SA0U7XiDQAAHeffgFWSH/RAAAAAElFTkSuQmCC",
    // content: webdav,
  },
  transSimpleUrlApp("看月亮", "https://static.myim.online/moon/", moon),
  transSimpleUrlApp(
    "在线工具",
    "https://tool.lu/",
    "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPHN2ZyB3aWR0aD0iNTEycHgiIGhlaWdodD0iNTEycHgiIHZpZXdCb3g9IjAgMCA1MTIgNTEyIiB2ZXJzaW9uPSIxLjEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiPgogICAgPHRpdGxlPuW3peWFtzwvdGl0bGU+CiAgICA8ZyBpZD0i5bel5YW3IiBzdHJva2U9Im5vbmUiIHN0cm9rZS13aWR0aD0iMSIgZmlsbD0ibm9uZSIgZmlsbC1ydWxlPSJldmVub2RkIj4KICAgICAgICA8ZyBpZD0i5bel5YW3566xIiB0cmFuc2Zvcm09InRyYW5zbGF0ZSgxOS4wMDAwMDAsIDE5LjAwMDAwMCkiIGZpbGwtcnVsZT0ibm9uemVybyI+CiAgICAgICAgICAgIDxwb2x5Z29uIGlkPSJQYXRoIiBmaWxsPSIjMjAyNDI1IiBvcGFjaXR5PSIwLjAxIiBwb2ludHM9IjAgMCA0NzMgMCA0NzMgNDczIDAgNDczIj48L3BvbHlnb24+CiAgICAgICAgICAgIDxwYXRoIGQ9Ik0xNTcuNjY2NjY3LDMxLjUzMzMzMzUgQzE0MC4yNTEyODgsMzEuNTMzMzMzNSAxMjYuMTMzMzMzLDQ1LjY1MTI4NzcgMTI2LjEzMzMzMyw2My4wNjY2NjY1IEwxMjYuMTMzMzMzLDE1Ny42NjY2NjcgQzEyNi4xMzMzMzMsMTc1LjA4MjA0NiAxNDAuMjUxMjg3LDE4OS4yIDE1Ny42NjY2NjcsMTg5LjIgTDMxNS4zMzMzMzMsMTg5LjIgQzMzMi43NDg3MTMsMTg5LjIgMzQ2Ljg2NjY2NywxNzUuMDgyMDQ2IDM0Ni44NjY2NjcsMTU3LjY2NjY2NyBMMzQ2Ljg2NjY2Nyw2My4wNjY2NjY1IEMzNDYuODY2NjY3LDQ1LjY1MTI4NzcgMzMyLjc0ODcxMiwzMS41MzMzMzM1IDMxNS4zMzMzMzMsMzEuNTMzMzMzNSBMMTU3LjY2NjY2NywzMS41MzMzMzM1IFogTTE1Ny42NjY2NjcsNjMuMDY2NjY2NSBMMzE1LjMzMzMzMyw2My4wNjY2NjY1IEwzMTUuMzMzMzMzLDE1Ny42NjY2NjcgTDE1Ny42NjY2NjcsMTU3LjY2NjY2NyBMMTU3LjY2NjY2Nyw2My4wNjY2NjY1IFogTTMxLjUzMzMzMzUsMjgzLjggTDMxLjUzMzMzMzUsNDI1LjcgQzMxLjUzMzMzMzUsNDM0LjQwNzY4OSAzOC41OTIzMTA1LDQ0MS40NjY2NjcgNDcuMyw0NDEuNDY2NjY3IEw0MjUuNyw0NDEuNDY2NjY3IEM0MzQuNDA3Njg5LDQ0MS40NjY2NjcgNDQxLjQ2NjY2Nyw0MzQuNDA3Njg5IDQ0MS40NjY2NjcsNDI1LjcgTDQ0MS40NjY2NjcsMjgzLjggQzQ0MS40NjY2NjcsMjc1LjA5MjMxMSA0MzQuNDA3Njg5LDI2OC4wMzMzMzMgNDI1LjcsMjY4LjAzMzMzMyBMNDcuMywyNjguMDMzMzMzIEMzOC41OTIzMTA1LDI2OC4wMzMzMzMgMzEuNTMzMzMzNSwyNzUuMDkyMzExIDMxLjUzMzMzMzUsMjgzLjggWiIgaWQ9IlNoYXBlIiBmaWxsPSIjMDA5QTYxIj48L3BhdGg+CiAgICAgICAgICAgIDxwYXRoIGQ9Ik0zMS41MzMzMzM1LDEyNi4xMzMzMzMgQzMxLjUzMzMzMzUsMTIxLjk1MTc1MyAzMy4xOTQ0NTk1LDExNy45NDE0NCAzNi4xNTEyODMsMTE0Ljk4NDYxNiBDMzkuMTA4MTA2NiwxMTIuMDI3NzkzIDQzLjExODQyLDExMC4zNjY2NjcgNDcuMywxMTAuMzY2NjY3IEw0MjUuNywxMTAuMzY2NjY3IEM0MjkuODgxNTgsMTEwLjM2NjY2NyA0MzMuODkxODkzLDExMi4wMjc3OTMgNDM2Ljg0ODcxNywxMTQuOTg0NjE2IEM0MzkuODA1NTQxLDExNy45NDE0NCA0NDEuNDY2NjY3LDEyMS45NTE3NTMgNDQxLjQ2NjY2NywxMjYuMTMzMzMzIEw0NDEuNDY2NjY3LDIzNi41IEM0NDEuNDY2NjY3LDI0NS4yMDc2ODkgNDM0LjQwNzY4OSwyNTIuMjY2NjY3IDQyNS43LDI1Mi4yNjY2NjcgTDQ3LjMsMjUyLjI2NjY2NyBDMzguNTkyMzEwNSwyNTIuMjY2NjY3IDMxLjUzMzMzMzUsMjQ1LjIwNzY4OSAzMS41MzMzMzM1LDIzNi41IEwzMS41MzMzMzM1LDEyNi4xMzMzMzMgWiIgaWQ9IlBhdGgiIGZpbGw9IiNGRkFBNDQiPjwvcGF0aD4KICAgICAgICAgICAgPHBhdGggZD0iTTE3My40MzMzMzMsMjM2LjUgQzE3My40MzMzMzMsMjI3Ljc5MjMxMSAxODAuNDkyMzExLDIyMC43MzMzMzMgMTg5LjIsMjIwLjczMzMzMyBMMjgzLjgsMjIwLjczMzMzMyBDMjkyLjUwNzY4OSwyMjAuNzMzMzMzIDI5OS41NjY2NjcsMjI3Ljc5MjMxMSAyOTkuNTY2NjY3LDIzNi41IEwyOTkuNTY2NjY3LDI4My44IEMyOTkuNTY2NjY3LDI5Mi41MDc2ODkgMjkyLjUwNzY4OSwyOTkuNTY2NjY3IDI4My44LDI5OS41NjY2NjcgTDE4OS4yLDI5OS41NjY2NjcgQzE4MC40OTIzMTEsMjk5LjU2NjY2NyAxNzMuNDMzMzMzLDI5Mi41MDc2ODkgMTczLjQzMzMzMywyODMuOCBMMTczLjQzMzMzMywyMzYuNSBMMTczLjQzMzMzMywyMzYuNSBaIiBpZD0iUGF0aCIgZmlsbD0iI0ZGRkZGRiI+PC9wYXRoPgogICAgICAgIDwvZz4KICAgIDwvZz4KPC9zdmc+"
  ),
  transSimpleUrlApp("石墨文档", "https://shimo.im/desktop", shimo),
  transSimpleUrlApp(
    "在线节拍器",
    "https://metronome.tooltool.net/?utm_source=xinquji",
    jiepaiqi
  ),
  transSimpleUrlApp("查看月食", "https://nadc.china-vo.org/eclipse/", moon),
  transSimpleUrlApp(
    "蒸 気 機",
    "https://magiconch.com/vaporwave/?from=home",
    zhengqiji
  ),
  transSimpleUrlApp("vtb 大数据", "https://vtbs.moe/", vtbshuju),
  transSimpleUrlApp(
    "吸血鬼幸存者",
    "https://v6p9d9t4.ssl.hwcdn.net/html/5185382/index.html",
    xixuegui
  ),
  transSimpleUrlApp(
    "Six Cats under",
    "https://v6p9d9t4.ssl.hwcdn.net/html/2267583/index.html?v=1591301667",
    defaulticon
  ),
  transSimpleUrlApp("biborg", "https://pos.biborg.com/fr/", defaulticon),

  {
    name: "更多应用",
    desc: "更多应用敬请期待，如果您有合适的应用，可以点击开始菜单，意见反馈取得联系",
  },
];
</script>

<template>
  <div class="outer">
    <div class="uper">
      <div class="up-text">VTRON Store</div>
    </div>
    <div class="main">
      <div class="left">
        <div class="left-icon">
          <div class="icon-derc"></div>
          <svg
            t="1694613650127"
            class="icon"
            viewBox="0 0 1024 1024"
            version="1.1"
            xmlns="http://www.w3.org/2000/svg"
            p-id="10617"
            width="200"
            height="200"
          >
            <path
              d="M511.813 92.188L92.188 428.844v502.5h295.406V647.469h248.344v283.875h295.406v-502.5z"
              p-id="10618"
            ></path>
          </svg>
        </div>
      </div>
      <div class="store">
        <div v-if="isready" class="store-top">
          <!-- <div class="left-bar"></div> -->
          <div class="right-main">
            <div class="main-title">
              <!-- VTRON商店 -->
              <!-- <span class="sub-title">热门应用 </span> -->
            </div>
            <div class="swiper">
              <div class="swiper-txt">
                主页
                <span class="sub-tip" v-if="isNoSystem">
                  当前不在vtron环境下，无法安装
                </span>
              </div>
              <div class="swiper-inner">
                <div class="swiper-tab">
                  <img src="./assets/banner1.jpg" />
                </div>
                <div class="swiper-tab">
                  <img src="./assets/banner2.jpg" />
                </div>
                <div class="swiper-tab">
                  <img src="./assets/banner3.jpg" />
                </div>
                <div class="swiper-tab">
                  <img src="./assets/banner2.jpg" />
                </div>
              </div>
            </div>
            <div class="main-app">
              <div v-for="item in temp" class="store-item">
                <AppItem
                  :item="item"
                  :installedList="installedList"
                  :install="install"
                  :uninstall="uninstall"
                ></AppItem>
              </div>
            </div>
          </div>
        </div>
        <div v-else class="store-noready">
          <div id="wait">
            <div class="waitd" id="wait1"></div>
            <div class="waitd" id="wait2"></div>
            <div class="waitd" id="wait3"></div>
            <div class="waitd" id="wait4"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<style>
/*定义滚动条高宽及背景
 高宽分别对应横竖滚动条的尺寸*/
::-webkit-scrollbar {
  width: 5px;
  height: 16px;
  background-color: #ffffff;
}
/*定义滚动条轨道
  内阴影+圆角*/
::-webkit-scrollbar-track {
  -webkit-box-shadow: inset 0 0 6px rgba(0, 0, 0, 0.3);
  border-radius: 10px;
  background-color: #ffffff;
}
/*定义滑块
  内阴影+圆角*/
::-webkit-scrollbar-thumb {
  border-radius: 10px;
  -webkit-box-shadow: inset 0 0 6px rgba(0, 0, 0, 0.3);
  background-color: rgba(132, 132, 132, 0.537);
}
</style>
<style scoped>
.outer {
  display: flex;
  flex-direction: column;
  height: 100%;
}
.uper {
  padding: 0px 20px;
  font-size: 12px;
  height: 40px;
  line-height: 40px;
  flex-shrink: 0;
  color: rgb(134, 134, 134);
  background-color: rgb(243, 243, 243);
}

.main {
  width: 100%;
  display: flex;
  flex: 1;
  overflow: hidden;
  background-color: rgb(243, 243, 243);
}
.left {
  width: 60px;
  height: 60px;
  flex-shrink: 0;
  background-color: rgb(243, 243, 243);
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
}
.left-icon {
  width: 56px;
  height: 50px;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: white;
  border-radius: 6px;
  position: relative;
}
.icon-derc {
  height: 20px;
  width: 4px;
  border-radius: 4px;
  background-color: #363533;
  position: absolute;
  left: 2px;
}
.left-icon svg {
  width: 20px;
  height: 20px;
  color: #363533;
  stroke: #363533;
}
.store {
  /* width: 100%; */
  flex: 1;
  background-color: rgb(255, 255, 255);
  border-top-left-radius: 10px;
  overflow: hidden;
}

.store-top {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: flex-start;
  align-items: flex-start;
  overflow: hidden;
}
.left-bar {
  width: 60px;
  flex-shrink: 0;
}
.right-main {
  width: 100%;
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
}

.main-title {
  font-size: 26px;
  font-weight: bold;
  font-variant: small-caps;
  font-variant-ligatures: discretionary-ligatures;
  margin: 8px;
  margin-top: 8px;
  user-select: none;
  overflow: hidden;
  white-space: nowrap;
}
.sub-title {
  padding-top: 30px;
  font-size: 20px;
  font-weight: bold;
  margin: 10px;
  user-select: none;
  overflow: hidden;
  white-space: nowrap;
}
.sub-tip {
  font-size: 12px;
  color: rgb(11, 31, 111);
  margin-left: 10px;
  user-select: none;
}
.swiper {
  width: max-content;
  height: 300px;
  /* overflow: hidden; */
  margin: 10px;
  margin-top: 0px;
  position: relative;
}
@keyframes swiperAni {
  0%,
  33% {
    transform: translateX(0px);
  }

  36%,
  66% {
    transform: translateX(-600px);
  }

  69%,
  96% {
    transform: translateX(-1200px);
  }
  100% {
    transform: translateX(0px);
  }
}
.swiper-inner {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  gap: 10px;
  animation: swiperAni 20s ease-in-out infinite;
}
.swiper-tab {
  width: 600px;
  height: 300px;
  background-color: rgb(243, 243, 243);
  border-radius: 20px;
  box-shadow: 0px 10px 20px 1px #2524241f;
}
.swiper-tab img {
  width: 100%;
  height: 100%;
  border-radius: 20px;
  object-fit: cover;
}
.swiper-txt {
  position: absolute;
  top: 20px;
  left: 30px;
  font-weight: 600;
  color: white;
  z-index: 10;
  text-shadow: 0px 0px 5px #00000058;
}
.main-app {
  width: 100%;
  /* height: 100%; */
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: flex-start;
  align-items: flex-start;
  padding: 10px;
  overflow: auto;
  align-content: flex-start;
}
.store-noready {
  width: 100%;
  height: 100%;
  background-color: #cdcdcd69;
}

#wait {
  position: absolute;
  left: 50%;
  top: calc(50% + 150px);
}

.waitd {
  position: absolute;
  width: 10px;
  height: 10px;
  left: 30px;
  background-color: azure;
  border-radius: 50%;
  transform-origin: -15px 0;
}

#wait1 {
  animation: dotAni1 2s linear infinite;
}

#wait2 {
  animation: dotAni2 2s linear infinite;
}

#wait3 {
  animation: dotAni3 2s linear infinite;
}

#wait4 {
  animation: dotAni4 2s linear infinite;
}

@keyframes dotAni1 {
  0% {
    transform: rotateZ(0deg);
  }

  20% {
    transform: rotateZ(240deg);
  }

  85% {
    transform: rotateZ(290deg);
  }

  100% {
    transform: rotateZ(360deg);
  }
}

@keyframes dotAni2 {
  0% {
    transform: rotateZ(0deg);
  }

  35% {
    transform: rotateZ(240deg);
  }

  85% {
    transform: rotateZ(290deg);
  }

  100% {
    transform: rotateZ(360deg);
  }
}

@keyframes dotAni3 {
  0% {
    transform: rotateZ(0deg);
  }

  50% {
    transform: rotateZ(240deg);
  }

  85% {
    transform: rotateZ(290deg);
  }

  100% {
    transform: rotateZ(360deg);
  }
}

@keyframes dotAni4 {
  0% {
    transform: rotateZ(0deg);
  }

  65% {
    transform: rotateZ(240deg);
  }

  85% {
    transform: rotateZ(290deg);
  }

  100% {
    transform: rotateZ(360deg);
  }
}
</style>
