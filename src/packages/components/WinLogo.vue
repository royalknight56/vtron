<template>
    <div id="logoW">
        <div id="logo">
            <div id="win1" class="win"></div>
            <div id="win2" class="win"></div>
            <div id="win3" class="win"></div>
            <div id="win4" class="win"></div>
        </div>
    </div>
</template>
<script lang="ts" setup>
</script>
<style scoped>
#logoW {
    perspective: 150px;
    position: absolute;
    left: 50%;
    top: 50%;
    margin-left: -55px;
    margin-top: -55px;
}

#logo {
    width: 125px;
    height: 105px;
    transform: rotateY(-20deg);
}

.win {
    width: 60px;
    height: 50px;
    background-color: azure;
    position: absolute;
}

#win1 {
    left: 0;
    top: 0;
}

#win2 {
    left: 0;
    bottom: 0;
}

#win3 {
    right: 0;
    top: 0;
}

#win4 {
    right: 0;
    bottom: 0;
}


</style>