declare interface SystemOptions {
    logo?:"default"|string;
    backgroud?:string;
}
declare interface WinApp {
    name?:string;
    icon?:string;
    url?:string;
    window?: DefineComponent
}
declare interface RootState {
    system: {
        state:SystemStateEnum;
        apps:WinApp[];
        windowInfoMap:{
            [key:string]:BrowserWindow
        },
        zIndexIdArray:number[],
        winnum:number
    };
}
