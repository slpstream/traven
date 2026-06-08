import { ref as c, onMounted as i, onBeforeUnmount as p, openBlock as s, createElementBlock as f } from "vue";
import { TravenEditor as m } from "traven";
const _ = {
  __name: "Traven",
  props: {
    defaultValue: { type: String, default: "" },
    options: { type: Object, default: () => ({}) }
  },
  emits: ["change"],
  setup(r, { expose: a, emit: l }) {
    const n = r, u = l, t = c(null);
    let e = null;
    return i(() => {
      t.value && (e = new m({
        element: t.value,
        initialValue: n.defaultValue,
        onChange: (o) => {
          u("change", o);
        },
        ...n.options
      }));
    }), p(() => {
      e && typeof e.destroy == "function" && e.destroy();
    }), a({
      getValue: () => (e == null ? void 0 : e.getValue()) || "",
      getInstance: () => e
    }), (o, d) => (s(), f("div", {
      ref_key: "container",
      ref: t,
      class: "traven-vue-wrapper"
    }, null, 512));
  }
};
export {
  _ as Traven
};
