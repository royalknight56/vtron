import { System } from "@libs/System";

function emitEvents(system:System,eventsNameArray: string[], data: any) {
  eventsNameArray.forEach((eventName) => {
    system.Eventer.emit(eventName, data);
  });
}

export {emitEvents};