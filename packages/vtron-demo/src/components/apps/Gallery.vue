<!-- <script setup lang="ts">
import Galleria from 'primevue/galleria';
import FileUpload from 'primevue/fileupload';
import { onMounted, ref } from 'vue';
import { join, useSystem } from 'vtron';
import ImgView from './comp/ImgView.vue';
const sys = useSystem();
const state = ref('noFile');
const imgsArr = ref<any[]>([]);
onMounted(async () => {
  const imgs = await sys.fs.readdir(join(sys._options.userLocation || '', 'pictures'));
  console.log(imgs);
  if (imgs?.length) {s
    state.value = 'ready';
    imgsArr.value = imgs.map((item) => {
      return {
        src: item.content,
        alt: item.name,
      };
    });
  }
  const stat = await sys.fs.stat(join(sys._options.userLocation || '', 'pictures'));
  if (!stat) {
    await sys.fs.mkdir(join(sys._options.userLocation || '', 'pictures'));
  }
});

const customBase64Uploader = async (event) => {
  const file = event.files[0];
  const reader = new FileReader();
  let blob = await fetch(file.objectURL).then((r) => r.blob()); //blob:url

  reader.readAsDataURL(blob);

  reader.onloadend = function () {
    const base64data = reader.result;
    // console.log(base64data);
    if (base64data) {
      sys.fs.writeFile(join(sys._options.userLocation || '', 'pictures', file.name), base64data?.toString());
    }
  };
};
async function getImg(path: string) {
  return await sys.fs.readFile(path);
}
</script>
<template>
  <div class="outer">
    <div v-if="state === 'noFile'">
      没有图片
      <FileUpload
        mode="basic"
        name="demo[]"
        url="/api/upload"
        accept="image/*"
        :auto="true"
        customUpload
        @uploader="customBase64Uploader"
      />
    </div>
    <div v-else-if="state === 'ready'">
      <Galleria
        :value="imgsArr"
        :numVisible="5"
        containerStyle="max-width: 640px;width:100%"
        :circular="true"
        :autoPlay="true"
        :transitionInterval="2000"
        style="width: 100%"
      >
        <template #item="slotProps">
          <Suspense>
            <ImgView :src="slotProps.item.src" :alt="slotProps.item.alt" />
          </Suspense>
        </template>
        <template #thumbnail="slotProps">
          <Suspense>
            <ImgView :src="slotProps.item.src" :alt="slotProps.item.alt" small />
          </Suspense>

        </template>
      </Galleria>
    </div>
  </div>
</template> -->
<template>comming soon</template>
