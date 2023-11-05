<template>
  <div class="links">
    <!-- <div class="link" v-for="link in FriendLinks" :key="link.name"> -->
    <!-- <span class="link-title"></span> -->
    <a
      class="link"
      v-for="link in FriendLinks"
      :key="link.name"
      :href="link.url"
      target="_blank"
      >{{ link.name }}</a
    >
  </div>
  <!-- </div> -->
</template>
<script setup lang="ts">
import { onMounted, reactive } from "vue";

const FriendLinks = reactive<any[]>([]);
onMounted(() => {
  fetch("https://myim.online:3100/api/friend", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      id: 1,
    }),
  })
    .then((res) => res.json())
    .then((res) => {
      if (res.code === 200) {
        let tempArray: any[] = [];
        res.data.forEach((item: any) => {
          tempArray.push({
            name: item.title,
            url: item.content,
          });
        });
        FriendLinks.splice(0, FriendLinks.length, ...tempArray);
      }
    });
});
</script>
<style scoped>
.links {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-around;
  align-items: flex-start;
  justify-items: flex-start;
  align-content: center;
  overflow: auto;
  height: 100%;
}
.link {
  /* width: 300px; */
  /* height: 60px; */
  font-weight: 600;
  text-decoration: none;
  color: #3e18b9;
  margin: 10px;
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 5px;
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  overflow: hidden;
}
.link:hover {
  border: 1px solid #000;
}
/* .link-title {
  font-size: 20px;
  font-weight: bold;
  text-align: center;
  flex-shrink: 0;
}
.link-a {
  font-size: 12px;
  text-align: center;
  word-break: break-all;
  flex-shrink: 0;
} */
</style>
