<template>
    <div class="s-option">
        <div class="s-option-inner">
            <div class="s-option-button">
                <div class="s-option-button_img">
                </div>
                <div class="s-option-button_title">
                </div>
            </div>
            <div class="s-option-button">
                <div class="s-option-button_img">
                </div>
                <div class="s-option-button_title">
                </div>
            </div>
            <div class="s-option-button">
                <div class="s-option-button_img">
                </div>
                <div class="s-option-button_title">
                </div>
            </div>
        </div>
    </div>
</template>
<style lang="scss" scoped>

.s-option {
    position: relative;
    width: var(--startmenu-icon-width);
    height: 100%;
    z-index: 40;

    .s-option-inner {
        position: absolute;
        height: 100%;
        width: var(--startmenu-icon-width);
        background-color: var(--color-startmenu);
        transition: all 0.1s ease-in-out;
        transition-delay: 0s;
        display: flex;
        flex-direction: column-reverse;
        overflow: hidden;
        .s-option-button{
            height: var(--start-option-size);
            width: var(--startmenu-icon-width-hover);
            display: flex;
            .s-option-button_img{
                height: var(--start-option-size);
                width: var(--start-option-size);
            }
            .s-option-button_title{
                width:100%;
                height: var(--start-option-size);
            }
        }
    }

}

.s-option:hover {
    .s-option-inner {
        transition-delay: 0.5s;
        width: var(--startmenu-icon-width-hover);
        box-shadow: 10px 0px 20px 0px rgba(0, 0, 0, 0.216);
    }
}
</style>