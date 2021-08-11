/*
 * @Author: zhangweiyuan-Royal
 * @LastEditTime: 2021-08-10 19:46:32
 * @Description: 
 * @FilePath: /myindex/template/src/components/window/appconfig.ts
 */
interface appInfo{
    name: string,
    apptemp: string,
    icon:string,
    width:number,
    height:number
}
let appList:Array<appInfo> = [
    {
        name: '版本信息',
        apptemp: 'Test2',
        icon:'/beat.ico',
        width:100,
        height:100
    }
]

export {appList,appInfo}