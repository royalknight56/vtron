<template>
    <div class="select">
        <select v-model="str">
            <template v-for="item in options">
                <option :value="item.value">
                    {{
                        item.label
                    }}
                </option>
            </template>
        </select>
    </div>
</template>
<script setup lang="ts">
import { ref, watch } from 'vue';

let props = defineProps(['options', 'modelValue'])
let emit = defineEmits(['update:modelValue'])
let str = ref(props.modelValue)
watch(() => str.value, (newv, old) => {
    console.log(newv, old)
    emit("update:modelValue", newv)
})


</script>

<style lang="scss" scoped>
:root {
    --background-gradient: linear-gradient(30deg, #f39c12 30%, #f1c40f);
    --gray: #34495e;
    --darkgray: #2c3e50;
}

select {
    /* Reset Select */
    appearance: none;
    outline: 0;
    //   border: 0;
    box-shadow: none;
    /* Personalize */
    flex: 1;
    padding: 2px 4px;
    color: rgb(73, 73, 73);
    background-color: #e1e1e1;
    border-radius: 0;
    font-size: small;
    cursor: pointer;
    option {
        color: inherit;
        background-color: #ffffff;
    }
}
/* Remove IE arrow */
select::-ms-expand {
    display: none;
}
/* Custom Select wrapper */
.select {
    position: relative;
    display: flex;
    width: 100%;
    height: 24px;
    //   border-radius: .25em;
    overflow: hidden;
}
/* Arrow */
.select::after {
    content: " ";
    background-image: url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMgAAADICAYAAACtWK6eAAAAAXNSR0IArs4c6QAADEhJREFUeF7tnWeoNVcVht+IimJDBQX9oaCggooaGxYUVFDQH9bYa+y9NyyxF6yxl9g1VuzYFaNGolFijRIhGomgRFQidpRX90c+b8797py1zzlrz6xn/bl/Zs3a+33nuTNn9p69jxKBAiiwrwJHoQ0KoMD+CgAIVwcKHEEBAOHyQAEA4RpAgZgC3EFiupFVRAEAKWI03YwpACAx3cgqogCAFDGabsYUAJCYbmQVUQBAihhNN2MKAEhMN7KKKAAgRYymmzEFACSmG1lFFACQIkbTzZgCABLTjawiCgBIEaPpZkwBAInpRlYRBQCkiNF0M6YAgMR0I6uIAgBSxGi6GVMAQGK6kVVEAQApYjTdjCkAIDHdyCqiAIAUMZpuxhQAkJhuZBVRAECKGE03YwoASEw3soooACBFjKabMQUAJKYbWUUUAJAiRtPNmAIAEtONrCIKAEgRo+lmTAEAielGVhEFAKSI0XQzpgCAxHQjq4gCAFLEaLoZUwBAYrqRVUQBACliNN2MKQAgMd3IKqIAgBQxmm7GFACQmG5kFVEAQIoYTTdjCgBITDeyiigAIEWMppsxBQAkphtZRRQAkCJG082YAgAS042sIgoASBGj6WZMAQCJ6UZWEQUApIjRdDOmAIDEdCOriAIAUsRouhlTAEBiupFVRAEAKWI03YwpACAx3cgqogCAFDGabsYUAJCYbmQVUQBAihhNN2MKAEhMN7KKKAAgRYymmzEFACSmG1lFFACQIkbTzZgCABLTjawiCgBIEaPpZkwBAInpRlYRBQCkiNF0M6YAgMR0I6uIAnMH5K6SbiTpaElfkHRq+1vEviG7eV1Jt5R0A0l/lvRNSZ+U9PshW3tAo+YKyOUlHS/JgOyNN0t6kaRfzdGQmbf56ZKeIenie/pxtqSnSHrf3Po3R0AuI+mcA4T+saS7SDp9bobMuL0nSjrmgPbfVNK35tTHOQLi2/UdJoh8WoPkjAnHckifAu+VdK8Jp/A/rhtLOnfCsUMcMjdAriJpnQv+e5LuLOnMIdReZiPeIen+a3TtWElvX+P41EPnBsgdJX1sTcVOaXeSs9bM4/CDFXirJF/w68RbJD10nYTMY+cGyKMlvTYg2MntTvKbQC4pqxV4g6SHB8T5vKTbBvJSUuYGiF/nfjeo1EkNkt8F80k7TwH/k/I/q0hwB4motkbO1yXdfI3jDz/0q+1xa5bv5IN93nTaKyQ9oeOkD5Tk3y2ziLndQSzq7SR9tkPdL7U7yZ86zlE19aVtPCPa/w9Luls0OSNvjoBYp+MkPbtDsM+1O4lHeolpCrxA0jOnHbryqJ+2gV2/6p1NzBUQC/zCNmobFfsz7U7yt+gJCuU9R9JzO/r78wbHDzrOkZI6Z0AsWO8t/xMNkn+lqD+Por5r+O4RjV80OL4fPUFm3twBsXa9Pxo/2h63Mn0YtbbnT/mfUDR+2eD4TvQE2XlLAMQavkbSYzrE/NCEeUQdp59lqt9U+Z9PNH7d4Ph29AQj5C0FEGv5ekmP6BD1/RPnE3WUmE1qdED2UAc9IOuZ1p7qPutYEiA2wlPdH9LhyHsk3bcjfwmpHh33KHk0PBDrmdQer5p9LA0QG3KCpAd0OONBLA9mVQzPq/L8qmh4ANZ3jq9ETzBa3hIBscbvlnSfDrF9kfTciTpKp6V6Rm7PCPcfGxxfTOvBFgovFRBL5d8U9+jQ7E3ByXgdJdNS/S2Hv+mIhgdc/VjlAdhFxZIBsVF+O7Xqs9ypJr6uY1Le1BrZx/krQH8NGI2/No0/HT3ByHlLB+QCkj4iyd+RRMOvkB8XTR48706SPA4UjX80ODzgushYOiA27cINkimf6e5nsscDnrSwK8B6+OOzCwb79e/2WLXuB2zBcjlpFQCxsheT5JmkngkcDY8oPy2aPFiedfCFfZGOdnlWrjVddFQBxCZeqhl6mw5HvZxQz4zWjtIbS711g+MSHWe8p6QPdOTPJrUSIDblsu1xywubReN5kjy7dY7hfvvOcemOxvv1ec8br47Su0+tBogV9qJz/uF+sw65DYhBmVN4TSrDcbmORnus5F0d+bNLrQiITbpig8RrNEXDj1p+5JpDeHlWw3GFjsY+qM1S6DjF/FKrAmKnrtQguX6HbU+V9LKO/F2kXq/B4f5Gw8v0eLGFclEZEJvthej8uHWdDuf9+rdnWnhH6QNTr93gcD+j4RnSb4wmzz2vOiD272oNkmt2mOmBRA8ojhTXaHBcvaNRnvbu2QRlA0D+Z73h8Dv9novpUe2blBEupqs2OK7V0ZjHS3p1R/4iUgHkPBv9mOXHrZ7HEX9L4UmOmXHlBof36YjGyI+N0T6F8gDk/2XzD3ZD0vOD9sGS3hZyoz/Jb+f8tuqGHaeaw4uHju6tlwog59fLr34NiS+2aPiDrXdGk4N5Ht8xHDcJ5jvNm9+8uCN/cakAstpSDyIaEl900fCnu/6EdxfhTYUMxy06inkhvud35C8yFUD2t9XTMgyJp6dEYxdzli7Z4LhVtJFtpcqeheE6So+dCiBH9scT+wyJJzpGY5uzXi/a4OjZTsCLwj0r2rml5wHIwQ57arhfAXvKfDS8y9Wmv5u4UDvn7aONkvQSSd54k9hHAQCZdmn44yLfSfzxVST+2ZY49f6KmwoD1/Ol5Ms7V2rfVD+GPg+ATLfHF6Mh8We8kfAi2f7EtWfrhkN1e7+1f6WkJ0Y6US0HQNZz3AtA+OKMhlf/8OOWtyGLhvca94//aHh3qMdGk6vlAcj6jnspIS8pFA1v3OM7yZcDJ/DYyv0CeYdSvDyrp8QQExUAkIlC7TnMX9V5cbpoeAVC30m+tsYJPDrvbzKiUWmdr6hG58sDkLiUHi33MqfR+G2D5BsTTuDp5g+bcNx+hxguT4Eh1lQAQNYUbM/hvuh6PiTyKuh+3DrSFgHHdz4WVV5ruM9dSQDSLeF/t1zws300zmp3klWbzPhtk6edR8OPgT2/WaJ1F5MHIJux0pv39HwwdWa7kxy+TZk/5X1yR/PY76RDvEOpALIBEdspendkOqNB8sMNbFD6QUl331zX6p4JQDbrfe+efqe3cZaeLa49mNmzYPdmFZn52QBk8wb6mwpvUZ0RH2/r5bJr74bUB5ANCbnnNL4DHLedU+971k81OP6+47qLLgcg27PXKy/uahq553d5A5u/bK87Nc8MINv13Z+vbntFeM/rMhznbrcrNc8OINv33dPKt7W3iOdzGY4/bL8bNSsAyG58f9UWdqnyPC7Dcc5uulCzCoDszvfeKSOHt/SkBofncxFbVABAtijuilP3Tjr0KU9ucJy926bXrAYgu/fde7AfGyx7SoPD87eIHSgAIDsQeUUJz7D1ZjTrxKkNDs/bInakAIDsSOgVZbyo3L0nlj+tweH5WsQOFQCQHYq9otSJko45oAk/anD8LLepNasDSL7v3n/jkfs0wyPknvL+k/xm1mwBgIzhu9fx9eqIR7dNNj3G4ccqlgNN9gdAkg2g/NgKAMjY/tC6ZAUAJNkAyo+tAICM7Q+tS1YAQJINoPzYCgDI2P7QumQFACTZAMqPrQCAjO0PrUtWAECSDaD82AoAyNj+0LpkBQAk2QDKj60AgIztD61LVgBAkg2g/NgKAMjY/tC6ZAUAJNkAyo+tAICM7Q+tS1YAQJINoPzYCgDI2P7QumQFACTZAMqPrQCAjO0PrUtWAECSDaD82AoAyNj+0LpkBQAk2QDKj60AgIztD61LVgBAkg2g/NgKAMjY/tC6ZAUAJNkAyo+tAICM7Q+tS1YAQJINoPzYCgDI2P7QumQFACTZAMqPrQCAjO0PrUtWAECSDaD82AoAyNj+0LpkBQAk2QDKj60AgIztD61LVgBAkg2g/NgKAMjY/tC6ZAUAJNkAyo+tAICM7Q+tS1YAQJINoPzYCgDI2P7QumQFACTZAMqPrQCAjO0PrUtWAECSDaD82AoAyNj+0LpkBQAk2QDKj60AgIztD61LVgBAkg2g/NgKAMjY/tC6ZAUAJNkAyo+tAICM7Q+tS1YAQJINoPzYCgDI2P7QumQFACTZAMqPrQCAjO0PrUtWAECSDaD82AoAyNj+0LpkBQAk2QDKj60AgIztD61LVgBAkg2g/NgKAMjY/tC6ZAUAJNkAyo+tAICM7Q+tS1YAQJINoPzYCgDI2P7QumQFACTZAMqPrQCAjO0PrUtW4D+frhrYJvQC9QAAAABJRU5ErkJggg==");
    background-size: 60% 60%;
    background-position: 0px 5px;
    background-repeat: no-repeat;
    position: absolute;
    top: 0;
    right: 0;
    padding: 10px;
    //   background-color: #34495e;
    //   transition: .25s all ease;
    pointer-events: none;
}
/* Transition */
.select:hover::after {
    color: #f39c12;
}
</style>