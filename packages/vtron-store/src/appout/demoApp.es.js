const {defineComponent, ref, openBlock, createElementBlock, toDisplayString } = vue;

const _hoisted_1 = { style: { "width": "100%", "height": "100%", "background-color": "#575454", "display": "flex", "justify-content": "center", "align-items": "center" } };
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "Tur",
  setup(__props) {
    const msg = ref("安装引导程序");
    return (_ctx, _cache) => {
      return openBlock(), createElementBlock("div", _hoisted_1, toDisplayString(msg.value), 1);
    };
  }
});

function main(system, _) {
  let win = system.createWindow({
    content: _sfc_main,
    title: "system",
    center: true,
    height: 500,
    width: 600
  });
  win.show();
}
console.log(main.name);
