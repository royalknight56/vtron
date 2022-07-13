/*
 * @Author: zhangweiyuan-Royal
 * @LastEditTime: 2022-07-13 09:58:55
 * @Description: 
 */
import {DefineComponent} from 'vue'
type WindowButton = 'flush'|'close'|'min'|'max'
interface baseOption {
    props?: any,
    x?: number,
    y?: number,
    width?: number,
    height?: number,
    title?: string,
    icon?: string,
    isScalable?: boolean,
    buttons?: WindowButton[],    // 右上角按钮
}
interface OptionSFC extends baseOption {
    content: string,
    isSFC?: true,//是否为vue SFC 链接
}
interface OptionNoSFC extends baseOption {
    content: DefineComponent<{}, {}, any>,
    isSFC?: false,//是否为vue SFC 链接
}
type option = OptionNoSFC|OptionSFC;

type OptionAll = OptionNoSFC;

interface EvMap {
    onDraging: { x: number, y: number, ifdrag: boolean }
    onResizing: { x: number, y: number }
}
type EvMapFunction = {
    [K in keyof EvMap]?: (ev: EvMap[K]) => void
};
export {
  option,
  OptionAll,
  OptionSFC,
  OptionNoSFC,
  EvMap,
  EvMapFunction
}