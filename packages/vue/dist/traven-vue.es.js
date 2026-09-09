import { createElementBlock as e, onBeforeUnmount as t, onMounted as n, openBlock as r, ref as i } from "vue";
import { TravenEditor as a } from "@freedomware/traven";
//#region src/Traven.vue
var o = {
	__name: "Traven",
	props: {
		defaultValue: {
			type: String,
			default: ""
		},
		options: {
			type: Object,
			default: () => ({})
		}
	},
	emits: ["change"],
	setup(o, { expose: s, emit: c }) {
		let l = o, u = c, d = i(null), f = null;
		return n(() => {
			d.value && (f = new a({
				element: d.value,
				initialValue: l.defaultValue,
				onChange: (e) => {
					u("change", e);
				},
				...l.options
			}));
		}), t(() => {
			f && typeof f.destroy == "function" && f.destroy();
		}), s({
			getValue: () => f?.getValue() || "",
			getInstance: () => f
		}), (t, n) => (r(), e("div", {
			ref_key: "container",
			ref: d,
			class: "traven-vue-wrapper"
		}, null, 512));
	}
};
//#endregion
export { o as Traven };
