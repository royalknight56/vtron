import InstallTur from "./Tur.vue";

function main(system: any, _: any) {
  let win = system.createWindow({
    content: InstallTur,
    title: "system",
    center: true,
    height: 500,
    width: 600,
  });
  win.show();
}
console.log(main.name);
