import {System} from '@libs/System'
function initIframeListener(system:System){
    if(!window){
        return
    }
    window.addEventListener("message",(res)=>{
      let win = system.getWindow(res.data.id)
      if(win){
        if(win[res.data.action]){
          if(res.data.args){
            win[res.data.action](...res.data.args)
          }else{
            win[res.data.action]()
          }
        }
      }
    })
}
export {
  initIframeListener
}