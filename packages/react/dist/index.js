import i, { forwardRef as l, useRef as u, useImperativeHandle as s, useEffect as m } from "react";
import { TravenEditor as d } from "traven";
const R = l(({
  defaultValue: c = "",
  onChange: n,
  options: a = {},
  className: o
}, f) => {
  const r = u(null), e = u(null);
  return s(f, () => ({
    getValue: () => {
      var t;
      return ((t = e.current) == null ? void 0 : t.getValue()) || "";
    },
    getInstance: () => e.current
  }), []), m(() => {
    if (r.current)
      return r.current.innerHTML = "", e.current = new d({
        element: r.current,
        initialValue: c,
        onChange: (t) => n && n(t),
        ...a
      }), () => {
        e.current && typeof e.current.destroy == "function" && e.current.destroy();
      };
  }, []), /* @__PURE__ */ i.createElement("div", { ref: r, className: `traven-react-wrapper ${o || ""}` });
});
export {
  R as Traven
};
