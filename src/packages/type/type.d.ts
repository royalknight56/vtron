declare interface SystemOptions {
    logo?:"default"|string;
    backgroud?:string;
}
declare interface RootState {
    system: {
        state:SystemStateEnum;
    };
}
