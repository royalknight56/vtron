<!--
 * @Author: zhangweiyuan-Royal
 * @LastEditTime: 2022-01-26 15:58:01
 * @Description: 
-->
<template>
    <div class="alert">
        
    </div>
</template>
<script setup lang="ts">
// function notifyMe() {
//     // 先检查浏览器是否支持
//     if (!("Notification" in window)) {
//         alert("This browser does not support desktop notification");
//     }

//     // 检查用户是否同意接受通知
//     else if (Notification.permission === "granted") {
//         // If it's okay let's create a notification
//         var notification = new Notification("Hi there!");
//         console.log(notification)
//     }

//     // 否则我们需要向用户获取权限
//     else if (Notification.permission !== "denied") {

//         Notification.requestPermission().then(function (permission) {
//             // 如果用户接受权限，我们就可以发起一条消息
//             console.log(permission)
//             if (permission === "granted") {

//                 const title = "巨蟹座-00年";
//                 const options = {
//                     body: "这是我的好姐妹，可以介绍给你", // 通知主体
//                     requireInteraction: true, // 不自动关闭通知
//                     image: "https://gitee.com/Wzhichao/img/raw/master/uPic/IMG_xxxxx327356%20.png",
//                     icon: "https://gitee.com/Wzhichao/img/raw/master/uPic/QlkqKm47%20.jpg",  // 通知图标
//                 };
//                 var notification = new Notification("Hi there!", options);
//             }
//         }).catch((res) => {
//             console.log(res)
//         }).finally(() => {
//             console.log('finally')
//         });
//     }
//     // 最后，如果执行到这里，说明用户已经拒绝对相关通知进行授权
//     // 出于尊重，我们不应该再打扰他们了
// }
</script>
<style scoped>
.alert {
    position: absolute;
    right: 0;
    bottom: 0;
    width: 200px;
    height: 100px;
    background: rgba(0, 0, 0, 0.418);
    
}
</style>