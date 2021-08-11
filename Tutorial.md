<!--
 * @Author: zhangweiyuan-Royal
 * @LastEditTime: 2021-08-11 09:53:09
 * @Description: 
 * @FilePath: /myindex/Tutorial.md
-->
# 教程

本框架通过在apps目录下创建新的VUE文件，制作窗口。

## IPC控制

IPC是在每个窗口间进行通信的，也是在不同的vue实例之间进行通信。

通过引入WindowIPC，可以调用其中的窗口控制和通信能力。

可以通过WindowIPC的on成员函数来监听一个信号，在需要的地方调用emit来触发这个事件。

还可以通过WindowIPC控制窗口的状态。