import { forwardRef as e, useEffect as t, useImperativeHandle as n, useRef as r } from "react";
import { TravenEditor as i } from "@freedomware/traven";
//#region \0rolldown/runtime.js
var a = (e, t) => () => (t || (e((t = { exports: {} }).exports, t), e = null), t.exports), o = /* @__PURE__ */ ((e) => typeof require < "u" ? require : typeof Proxy < "u" ? new Proxy(e, { get: (e, t) => (typeof require < "u" ? require : e)[t] }) : e)(function(e) {
	if (typeof require < "u") return require.apply(this, arguments);
	throw Error("Calling `require` for \"" + e + "\" in an environment that doesn't expose the `require` function. See https://rolldown.rs/in-depth/bundling-cjs#require-external-modules for more details.");
}), s = /* @__PURE__ */ a(((e) => {
	var t = o("react"), n = Symbol.for("react.element"), r = Symbol.for("react.fragment"), i = Object.prototype.hasOwnProperty, a = t.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentOwner, s = {
		key: !0,
		ref: !0,
		__self: !0,
		__source: !0
	};
	function c(e, t, r) {
		var o, c = {}, l = null, u = null;
		for (o in r !== void 0 && (l = "" + r), t.key !== void 0 && (l = "" + t.key), t.ref !== void 0 && (u = t.ref), t) i.call(t, o) && !s.hasOwnProperty(o) && (c[o] = t[o]);
		if (e && e.defaultProps) for (o in t = e.defaultProps, t) c[o] === void 0 && (c[o] = t[o]);
		return {
			$$typeof: n,
			type: e,
			key: l,
			ref: u,
			props: c,
			_owner: a.current
		};
	}
	e.Fragment = r, e.jsx = c, e.jsxs = c;
})), c = /* @__PURE__ */ a(((e) => {
	process.env.NODE_ENV !== "production" && (function() {
		var t = o("react"), n = Symbol.for("react.element"), r = Symbol.for("react.portal"), i = Symbol.for("react.fragment"), a = Symbol.for("react.strict_mode"), s = Symbol.for("react.profiler"), c = Symbol.for("react.provider"), l = Symbol.for("react.context"), u = Symbol.for("react.forward_ref"), d = Symbol.for("react.suspense"), f = Symbol.for("react.suspense_list"), p = Symbol.for("react.memo"), m = Symbol.for("react.lazy"), h = Symbol.for("react.offscreen"), g = Symbol.iterator, _ = "@@iterator";
		function ee(e) {
			if (typeof e != "object" || !e) return null;
			var t = g && e[g] || e[_];
			return typeof t == "function" ? t : null;
		}
		var v = t.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;
		function y(e) {
			te("error", e, [...arguments].slice(1));
		}
		function te(e, t, n) {
			var r = v.ReactDebugCurrentFrame.getStackAddendum();
			r !== "" && (t += "%s", n = n.concat([r]));
			var i = n.map(function(e) {
				return String(e);
			});
			i.unshift("Warning: " + t), Function.prototype.apply.call(console[e], console, i);
		}
		var ne = !1, re = !1, ie = !1, ae = !1, oe = !1, se = Symbol.for("react.module.reference");
		function ce(e) {
			return !!(typeof e == "string" || typeof e == "function" || e === i || e === s || oe || e === a || e === d || e === f || ae || e === h || ne || re || ie || typeof e == "object" && e && (e.$$typeof === m || e.$$typeof === p || e.$$typeof === c || e.$$typeof === l || e.$$typeof === u || e.$$typeof === se || e.getModuleId !== void 0));
		}
		function le(e, t, n) {
			var r = e.displayName;
			if (r) return r;
			var i = t.displayName || t.name || "";
			return i === "" ? n : n + "(" + i + ")";
		}
		function b(e) {
			return e.displayName || "Context";
		}
		function x(e) {
			if (e == null) return null;
			if (typeof e.tag == "number" && y("Received an unexpected object in getComponentNameFromType(). This is likely a bug in React. Please file an issue."), typeof e == "function") return e.displayName || e.name || null;
			if (typeof e == "string") return e;
			switch (e) {
				case i: return "Fragment";
				case r: return "Portal";
				case s: return "Profiler";
				case a: return "StrictMode";
				case d: return "Suspense";
				case f: return "SuspenseList";
			}
			if (typeof e == "object") switch (e.$$typeof) {
				case l: return b(e) + ".Consumer";
				case c: return b(e._context) + ".Provider";
				case u: return le(e, e.render, "ForwardRef");
				case p:
					var t = e.displayName || null;
					return t === null ? x(e.type) || "Memo" : t;
				case m:
					var n = e, o = n._payload, h = n._init;
					try {
						return x(h(o));
					} catch {
						return null;
					}
			}
			return null;
		}
		var S = Object.assign, C = 0, w, T, E, ue, D, O, k;
		function A() {}
		A.__reactDisabledLog = !0;
		function de() {
			if (C === 0) {
				w = console.log, T = console.info, E = console.warn, ue = console.error, D = console.group, O = console.groupCollapsed, k = console.groupEnd;
				var e = {
					configurable: !0,
					enumerable: !0,
					value: A,
					writable: !0
				};
				Object.defineProperties(console, {
					info: e,
					log: e,
					warn: e,
					error: e,
					group: e,
					groupCollapsed: e,
					groupEnd: e
				});
			}
			C++;
		}
		function fe() {
			if (C--, C === 0) {
				var e = {
					configurable: !0,
					enumerable: !0,
					writable: !0
				};
				Object.defineProperties(console, {
					log: S({}, e, { value: w }),
					info: S({}, e, { value: T }),
					warn: S({}, e, { value: E }),
					error: S({}, e, { value: ue }),
					group: S({}, e, { value: D }),
					groupCollapsed: S({}, e, { value: O }),
					groupEnd: S({}, e, { value: k })
				});
			}
			C < 0 && y("disabledDepth fell below zero. This is a bug in React. Please file an issue.");
		}
		var j = v.ReactCurrentDispatcher, M;
		function N(e, t, n) {
			if (M === void 0) try {
				throw Error();
			} catch (e) {
				var r = e.stack.trim().match(/\n( *(at )?)/);
				M = r && r[1] || "";
			}
			return "\n" + M + e;
		}
		var P = !1, F = new (typeof WeakMap == "function" ? WeakMap : Map)();
		function I(e, t) {
			if (!e || P) return "";
			var n = F.get(e);
			if (n !== void 0) return n;
			var r;
			P = !0;
			var i = Error.prepareStackTrace;
			Error.prepareStackTrace = void 0;
			var a = j.current;
			j.current = null, de();
			try {
				if (t) {
					var o = function() {
						throw Error();
					};
					if (Object.defineProperty(o.prototype, "props", { set: function() {
						throw Error();
					} }), typeof Reflect == "object" && Reflect.construct) {
						try {
							Reflect.construct(o, []);
						} catch (e) {
							r = e;
						}
						Reflect.construct(e, [], o);
					} else {
						try {
							o.call();
						} catch (e) {
							r = e;
						}
						e.call(o.prototype);
					}
				} else {
					try {
						throw Error();
					} catch (e) {
						r = e;
					}
					e();
				}
			} catch (t) {
				if (t && r && typeof t.stack == "string") {
					for (var s = t.stack.split("\n"), c = r.stack.split("\n"), l = s.length - 1, u = c.length - 1; l >= 1 && u >= 0 && s[l] !== c[u];) u--;
					for (; l >= 1 && u >= 0; l--, u--) if (s[l] !== c[u]) {
						if (l !== 1 || u !== 1) do
							if (l--, u--, u < 0 || s[l] !== c[u]) {
								var d = "\n" + s[l].replace(" at new ", " at ");
								return e.displayName && d.includes("<anonymous>") && (d = d.replace("<anonymous>", e.displayName)), typeof e == "function" && F.set(e, d), d;
							}
						while (l >= 1 && u >= 0);
						break;
					}
				}
			} finally {
				P = !1, j.current = a, fe(), Error.prepareStackTrace = i;
			}
			var f = e ? e.displayName || e.name : "", p = f ? N(f) : "";
			return typeof e == "function" && F.set(e, p), p;
		}
		function pe(e, t, n) {
			return I(e, !1);
		}
		function me(e) {
			var t = e.prototype;
			return !!(t && t.isReactComponent);
		}
		function L(e, t, n) {
			if (e == null) return "";
			if (typeof e == "function") return I(e, me(e));
			if (typeof e == "string") return N(e);
			switch (e) {
				case d: return N("Suspense");
				case f: return N("SuspenseList");
			}
			if (typeof e == "object") switch (e.$$typeof) {
				case u: return pe(e.render);
				case p: return L(e.type, t, n);
				case m:
					var r = e, i = r._payload, a = r._init;
					try {
						return L(a(i), t, n);
					} catch {}
			}
			return "";
		}
		var R = Object.prototype.hasOwnProperty, z = {}, B = v.ReactDebugCurrentFrame;
		function V(e) {
			if (e) {
				var t = e._owner, n = L(e.type, e._source, t ? t.type : null);
				B.setExtraStackFrame(n);
			} else B.setExtraStackFrame(null);
		}
		function he(e, t, n, r, i) {
			var a = Function.call.bind(R);
			for (var o in e) if (a(e, o)) {
				var s = void 0;
				try {
					if (typeof e[o] != "function") {
						var c = Error((r || "React class") + ": " + n + " type `" + o + "` is invalid; it must be a function, usually from the `prop-types` package, but received `" + typeof e[o] + "`.This often happens because of typos such as `PropTypes.function` instead of `PropTypes.func`.");
						throw c.name = "Invariant Violation", c;
					}
					s = e[o](t, o, r, n, null, "SECRET_DO_NOT_PASS_THIS_OR_YOU_WILL_BE_FIRED");
				} catch (e) {
					s = e;
				}
				s && !(s instanceof Error) && (V(i), y("%s: type specification of %s `%s` is invalid; the type checker function must return `null` or an `Error` but returned a %s. You may have forgotten to pass an argument to the type checker creator (arrayOf, instanceOf, objectOf, oneOf, oneOfType, and shape all require an argument).", r || "React class", n, o, typeof s), V(null)), s instanceof Error && !(s.message in z) && (z[s.message] = !0, V(i), y("Failed %s type: %s", n, s.message), V(null));
			}
		}
		var ge = Array.isArray;
		function H(e) {
			return ge(e);
		}
		function _e(e) {
			return typeof Symbol == "function" && Symbol.toStringTag && e[Symbol.toStringTag] || e.constructor.name || "Object";
		}
		function ve(e) {
			try {
				return U(e), !1;
			} catch {
				return !0;
			}
		}
		function U(e) {
			return "" + e;
		}
		function W(e) {
			if (ve(e)) return y("The provided key is an unsupported type %s. This value must be coerced to a string before before using it here.", _e(e)), U(e);
		}
		var G = v.ReactCurrentOwner, ye = {
			key: !0,
			ref: !0,
			__self: !0,
			__source: !0
		}, K, q, J = {};
		function be(e) {
			if (R.call(e, "ref")) {
				var t = Object.getOwnPropertyDescriptor(e, "ref").get;
				if (t && t.isReactWarning) return !1;
			}
			return e.ref !== void 0;
		}
		function xe(e) {
			if (R.call(e, "key")) {
				var t = Object.getOwnPropertyDescriptor(e, "key").get;
				if (t && t.isReactWarning) return !1;
			}
			return e.key !== void 0;
		}
		function Se(e, t) {
			if (typeof e.ref == "string" && G.current && t && G.current.stateNode !== t) {
				var n = x(G.current.type);
				J[n] || (y("Component \"%s\" contains the string ref \"%s\". Support for string refs will be removed in a future major release. This case cannot be automatically converted to an arrow function. We ask you to manually fix this case by using useRef() or createRef() instead. Learn more about using refs safely here: https://reactjs.org/link/strict-mode-string-ref", x(G.current.type), e.ref), J[n] = !0);
			}
		}
		function Ce(e, t) {
			var n = function() {
				K || (K = !0, y("%s: `key` is not a prop. Trying to access it will result in `undefined` being returned. If you need to access the same value within the child component, you should pass it as a different prop. (https://reactjs.org/link/special-props)", t));
			};
			n.isReactWarning = !0, Object.defineProperty(e, "key", {
				get: n,
				configurable: !0
			});
		}
		function we(e, t) {
			var n = function() {
				q || (q = !0, y("%s: `ref` is not a prop. Trying to access it will result in `undefined` being returned. If you need to access the same value within the child component, you should pass it as a different prop. (https://reactjs.org/link/special-props)", t));
			};
			n.isReactWarning = !0, Object.defineProperty(e, "ref", {
				get: n,
				configurable: !0
			});
		}
		var Te = function(e, t, r, i, a, o, s) {
			var c = {
				$$typeof: n,
				type: e,
				key: t,
				ref: r,
				props: s,
				_owner: o
			};
			return c._store = {}, Object.defineProperty(c._store, "validated", {
				configurable: !1,
				enumerable: !1,
				writable: !0,
				value: !1
			}), Object.defineProperty(c, "_self", {
				configurable: !1,
				enumerable: !1,
				writable: !1,
				value: i
			}), Object.defineProperty(c, "_source", {
				configurable: !1,
				enumerable: !1,
				writable: !1,
				value: a
			}), Object.freeze && (Object.freeze(c.props), Object.freeze(c)), c;
		};
		function Ee(e, t, n, r, i) {
			var a, o = {}, s = null, c = null;
			for (a in n !== void 0 && (W(n), s = "" + n), xe(t) && (W(t.key), s = "" + t.key), be(t) && (c = t.ref, Se(t, i)), t) R.call(t, a) && !ye.hasOwnProperty(a) && (o[a] = t[a]);
			if (e && e.defaultProps) {
				var l = e.defaultProps;
				for (a in l) o[a] === void 0 && (o[a] = l[a]);
			}
			if (s || c) {
				var u = typeof e == "function" ? e.displayName || e.name || "Unknown" : e;
				s && Ce(o, u), c && we(o, u);
			}
			return Te(e, s, c, i, r, G.current, o);
		}
		var Y = v.ReactCurrentOwner, X = v.ReactDebugCurrentFrame;
		function Z(e) {
			if (e) {
				var t = e._owner, n = L(e.type, e._source, t ? t.type : null);
				X.setExtraStackFrame(n);
			} else X.setExtraStackFrame(null);
		}
		var Q = !1;
		function $(e) {
			return typeof e == "object" && !!e && e.$$typeof === n;
		}
		function De() {
			if (Y.current) {
				var e = x(Y.current.type);
				if (e) return "\n\nCheck the render method of `" + e + "`.";
			}
			return "";
		}
		function Oe(e) {
			if (e !== void 0) {
				var t = e.fileName.replace(/^.*[\\\/]/, ""), n = e.lineNumber;
				return "\n\nCheck your code at " + t + ":" + n + ".";
			}
			return "";
		}
		var ke = {};
		function Ae(e) {
			var t = De();
			if (!t) {
				var n = typeof e == "string" ? e : e.displayName || e.name;
				n && (t = "\n\nCheck the top-level render call using <" + n + ">.");
			}
			return t;
		}
		function je(e, t) {
			if (!(!e._store || e._store.validated || e.key != null)) {
				e._store.validated = !0;
				var n = Ae(t);
				if (!ke[n]) {
					ke[n] = !0;
					var r = "";
					e && e._owner && e._owner !== Y.current && (r = " It was passed a child from " + x(e._owner.type) + "."), Z(e), y("Each child in a list should have a unique \"key\" prop.%s%s See https://reactjs.org/link/warning-keys for more information.", n, r), Z(null);
				}
			}
		}
		function Me(e, t) {
			if (typeof e == "object") {
				if (H(e)) for (var n = 0; n < e.length; n++) {
					var r = e[n];
					$(r) && je(r, t);
				}
				else if ($(e)) e._store && (e._store.validated = !0);
				else if (e) {
					var i = ee(e);
					if (typeof i == "function" && i !== e.entries) for (var a = i.call(e), o; !(o = a.next()).done;) $(o.value) && je(o.value, t);
				}
			}
		}
		function Ne(e) {
			var t = e.type;
			if (!(t == null || typeof t == "string")) {
				var n;
				if (typeof t == "function") n = t.propTypes;
				else if (typeof t == "object" && (t.$$typeof === u || t.$$typeof === p)) n = t.propTypes;
				else return;
				if (n) {
					var r = x(t);
					he(n, e.props, "prop", r, e);
				} else t.PropTypes !== void 0 && !Q && (Q = !0, y("Component %s declared `PropTypes` instead of `propTypes`. Did you misspell the property assignment?", x(t) || "Unknown"));
				typeof t.getDefaultProps == "function" && !t.getDefaultProps.isReactClassApproved && y("getDefaultProps is only used on classic React.createClass definitions. Use a static property named `defaultProps` instead.");
			}
		}
		function Pe(e) {
			for (var t = Object.keys(e.props), n = 0; n < t.length; n++) {
				var r = t[n];
				if (r !== "children" && r !== "key") {
					Z(e), y("Invalid prop `%s` supplied to `React.Fragment`. React.Fragment can only have `key` and `children` props.", r), Z(null);
					break;
				}
			}
			e.ref !== null && (Z(e), y("Invalid attribute `ref` supplied to `React.Fragment`."), Z(null));
		}
		var Fe = {};
		function Ie(e, t, r, a, o, s) {
			var c = ce(e);
			if (!c) {
				var l = "";
				(e === void 0 || typeof e == "object" && e && Object.keys(e).length === 0) && (l += " You likely forgot to export your component from the file it's defined in, or you might have mixed up default and named imports.");
				var u = Oe(o);
				u ? l += u : l += De();
				var d;
				e === null ? d = "null" : H(e) ? d = "array" : e !== void 0 && e.$$typeof === n ? (d = "<" + (x(e.type) || "Unknown") + " />", l = " Did you accidentally export a JSX literal instead of a component?") : d = typeof e, y("React.jsx: type is invalid -- expected a string (for built-in components) or a class/function (for composite components) but got: %s.%s", d, l);
			}
			var f = Ee(e, t, r, o, s);
			if (f == null) return f;
			if (c) {
				var p = t.children;
				if (p !== void 0) if (a) if (H(p)) {
					for (var m = 0; m < p.length; m++) Me(p[m], e);
					Object.freeze && Object.freeze(p);
				} else y("React.jsx: Static children should always be an array. You are likely explicitly calling React.jsxs or React.jsxDEV. Use the Babel transform instead.");
				else Me(p, e);
			}
			if (R.call(t, "key")) {
				var h = x(e), g = Object.keys(t).filter(function(e) {
					return e !== "key";
				}), _ = g.length > 0 ? "{key: someKey, " + g.join(": ..., ") + ": ...}" : "{key: someKey}";
				Fe[h + _] || (y("A props object containing a \"key\" prop is being spread into JSX:\n  let props = %s;\n  <%s {...props} />\nReact keys must be passed directly to JSX without using spread:\n  let props = %s;\n  <%s key={someKey} {...props} />", _, h, g.length > 0 ? "{" + g.join(": ..., ") + ": ...}" : "{}", h), Fe[h + _] = !0);
			}
			return e === i ? Pe(f) : Ne(f), f;
		}
		function Le(e, t, n) {
			return Ie(e, t, n, !0);
		}
		function Re(e, t, n) {
			return Ie(e, t, n, !1);
		}
		var ze = Re, Be = Le;
		e.Fragment = i, e.jsx = ze, e.jsxs = Be;
	})();
})), l = (/* @__PURE__ */ a(((e, t) => {
	process.env.NODE_ENV === "production" ? t.exports = s() : t.exports = c();
})))(), u = e(({ defaultValue: e = "", onChange: a, options: o = {}, className: s }, c) => {
	let u = r(null), d = r(null);
	return n(c, () => ({
		getValue: () => d.current?.getValue() || "",
		getInstance: () => d.current
	}), []), t(() => {
		if (u.current) return u.current.replaceChildren(), d.current = new i({
			element: u.current,
			initialValue: e,
			onChange: (e) => a && a(e),
			...o
		}), () => {
			d.current && typeof d.current.destroy == "function" && d.current.destroy();
		};
	}, []), /* @__PURE__ */ (0, l.jsx)("div", {
		ref: u,
		className: `traven-react-wrapper ${s || ""}`
	});
});
//#endregion
export { u as Traven };
