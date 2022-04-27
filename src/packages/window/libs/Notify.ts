
import {showNotification,hideNotification}  from "@libs/GlobalOps";

class Notify{
    constructor(title:string,messages:string){
        showNotification(title,messages);
    }
}
export {
    Notify
}