<!--
 * @Author: zhangweiyuan-Royal
 * @LastEditTime: 2021-08-18 16:54:21
 * @Description: 
 * @FilePath: /myindex/src/apps/app_vscode.vue
--><template>
    <div class="outer">

        <iframe class="broifame" src="https://github1s.com/"></iframe>
    </div>
</template>
<script lang="ts" setup>
import { ref } from "vue";
let urlinput = ref('')
let urlsrc = ref('')
function urlkey(e:KeyboardEvent) {
    if (e.code == 'Enter') {
        changeUrl()
    }
}
function changeUrl() {
    urlsrc.value=urlinput.value
}
</script>
<style>
iframe {
    overflow: auto;
    width: 100%;
    height: 100%;
}
</style>
<style scoped>
.outer {
    display: flex;
    flex-direction: column;
    height: 100%;
    width: 100%;
}
.urlinput {
    width: 100%;
}
.uper{
    display: flex;
}
.broifame{
    /* height: 100%; */
    width: 100%;
}
</style>