import { System } from "@libs/System";

function emitEvents(system: System, eventsName: string, data={}) {
  let eventNamesArr = eventsName.split(".");
  eventNamesArr.forEach((eventName, index) => {
    system.Eventer.emit(eventNamesArr.slice(index, eventNamesArr.length).join('.'),
      {
        type: eventsName,
        ...data
      });
  });
  system.Eventer.emit('system', {
    type: eventsName,
    ...data
  });
}

export { emitEvents };