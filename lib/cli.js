#!/usr/bin/env node
import { accessSync, constants, mkdirSync, readFileSync, realpathSync, statSync, writeFileSync } from "node:fs";
import { basename, dirname, isAbsolute, join, posix, resolve, win32 } from "node:path";
import { fileURLToPath } from "node:url";
import { access, mkdir, mkdtemp, readFile, readdir, rename, rm, stat, writeFile } from "node:fs/promises";
import { zstdDecompressSync } from "node:zlib";
import { randomBytes } from "node:crypto";
import { tmpdir } from "node:os";
import { spawn } from "node:child_process";
// node_modules/zod/v4/core/util.js
function getEnumValues(entries) {
	const numericValues = Object.values(entries).filter((v) => typeof v === "number");
	return Object.entries(entries).filter(([k, _]) => numericValues.indexOf(+k) === -1).map(([_, v]) => v);
}
function joinValues(array, separator = "|") {
	return array.map((val) => stringifyPrimitive(val)).join(separator);
}
function jsonStringifyReplacer(_, value) {
	if (typeof value === "bigint") return value.toString();
	return value;
}
var Cached = class {
	constructor(getter) {
		this._getter = getter;
		this._value = void 0;
	}
	get value() {
		const getter = this._getter;
		if (getter !== void 0) {
			this._value = getter();
			this._getter = void 0;
		}
		return this._value;
	}
};
function cached(getter) {
	return new Cached(getter);
}
function nullish(input) {
	return input === null || input === void 0;
}
function cleanRegex(source) {
	const start = source.startsWith("^") ? 1 : 0;
	const end = source.endsWith("$") ? source.length - 1 : source.length;
	return source.slice(start, end);
}
function floatSafeRemainder(val, step) {
	const ratio = val / step;
	const roundedRatio = Math.round(ratio);
	const tolerance = 4 * Number.EPSILON * Math.max(Math.abs(ratio), 1);
	if (Math.abs(ratio - roundedRatio) < tolerance) return 0;
	return ratio - roundedRatio;
}
function assignProp(target, prop, value) {
	Object.defineProperty(target, prop, {
		value,
		writable: true,
		enumerable: true,
		configurable: true
	});
}
/**
* Whichever object a def's `shape` currently answers from: the one the caller passed until the first read, the frozen copy after it.
*
* Its keys and descriptors read without invoking anything, which is what lets a discriminated union check its discriminator, and the cycle walk read a shape, without resolving a getter that references the schema being constructed. A def that answers `shape` from an accessor of its own has none.
*/
function rawShape(def) {
	const desc = Object.getOwnPropertyDescriptor(def, "shape");
	return desc?.get ? desc.get.raw : desc?.value;
}
function sourceShape(schema) {
	return rawShape(schema._zod.def) ?? schema._zod.def.shape;
}
function deferProp(target, key, getter) {
	Object.defineProperty(target, key, {
		get() {
			const value = getter();
			assignProp(this, key, value);
			return value;
		},
		enumerable: true,
		configurable: true
	});
}
function putProp(target, key, value) {
	if (key in target) assignProp(target, key, value);
	else target[key] = value;
}
/**
* Copies `keys` of `source`'s shape onto `target`, each value passed through `wrap`.
*
* A key the source has resolved is copied through now, so the derived shape states it outright and nothing has to resolve it to learn what it holds. A key the source still defers stays deferred, and reads back through the source's own `shape`, so it resolves once and both shapes get that one schema.
*/
function mirrorShape(target, source, keys, wrap) {
	const raw = sourceShape(source);
	for (const key of keys) {
		const desc = Object.getOwnPropertyDescriptor(raw, key);
		if (!desc.enumerable) continue;
		if (desc.get) deferProp(target, key, () => {
			const value = source._zod.def.shape[key];
			return wrap ? wrap(value, key) : value;
		});
		else putProp(target, key, wrap ? wrap(desc.value, key) : desc.value);
	}
}
function mirrorProps(target, source) {
	for (const key of Reflect.ownKeys(source)) {
		const desc = Object.getOwnPropertyDescriptor(source, key);
		if (!desc.enumerable) continue;
		if (desc.get) deferProp(target, key, () => source[key]);
		else putProp(target, key, desc.value);
	}
}
function mergeDefs(...defs) {
	const mergedDescriptors = {};
	for (const def of defs) {
		const descriptors = Object.getOwnPropertyDescriptors(def);
		Object.assign(mergedDescriptors, descriptors);
	}
	return Object.defineProperties({}, mergedDescriptors);
}
function esc(str) {
	return JSON.stringify(str);
}
function slugify(input) {
	return input.toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/[\s_-]+/g, "-").replace(/^-+|-+$/g, "");
}
const captureStackTrace = "captureStackTrace" in Error ? Error.captureStackTrace : (..._args) => {};
function isObject(data) {
	return typeof data === "object" && data !== null && !Array.isArray(data);
}
const allowsEval = /* @__PURE__*/ cached(() => {
	if (globalConfig.jitless) return false;
	if (typeof navigator !== "undefined" && navigator?.userAgent?.includes("Cloudflare")) return false;
	try {
		new Function("");
		return true;
	} catch (_) {
		return false;
	}
});
function isPlainObject(o) {
	if (isObject(o) === false) return false;
	const ctor = o.constructor;
	if (ctor === void 0) return true;
	if (typeof ctor !== "function") return true;
	const prot = ctor.prototype;
	if (isObject(prot) === false) return false;
	if (Object.prototype.hasOwnProperty.call(prot, "isPrototypeOf") === false) return false;
	return true;
}
function shallowClone(o) {
	if (isPlainObject(o)) return { ...o };
	if (Array.isArray(o)) return [...o];
	if (o instanceof Map) return new Map(o);
	if (o instanceof Set) return new Set(o);
	return o;
}
const propertyKeyTypes = /* @__PURE__*/ new Set([
	"string",
	"number",
	"symbol"
]);
function escapeRegex$2(str) {
	return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function clone(inst, def, params) {
	const cl = new inst._zod.constr(def ?? inst._zod.def);
	if (!def || params?.parent) cl._zod.parent = inst;
	return cl;
}
function normalizeParams(_params) {
	const params = _params;
	if (!params) return {};
	if (typeof params === "string") return { error: () => params };
	if (params?.message !== void 0) {
		if (params?.error !== void 0) throw new Error("Cannot specify both `message` and `error` params");
		params.error = params.message;
	}
	delete params.message;
	if (typeof params.error === "string") return {
		...params,
		error: () => params.error
	};
	return params;
}
function stringifyPrimitive(value) {
	if (typeof value === "bigint") return value.toString() + "n";
	if (typeof value === "string") return `"${value}"`;
	return `${value}`;
}
function optionalKeys(shape) {
	return Object.keys(shape).filter((k) => {
		return shape[k]._zod.optin !== void 0 && shape[k]._zod.optout === "optional";
	});
}
const NUMBER_FORMAT_RANGES = /*@__PURE__*/ (() => ({
	safeint: [Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER],
	int32: [-2147483648, 2147483647],
	uint32: [0, 4294967295],
	float32: [-34028234663852886e22, 34028234663852886e22],
	float64: [-Number.MAX_VALUE, Number.MAX_VALUE]
}))();
const BIGINT_FORMAT_RANGES = {
	int64: [/* @__PURE__*/ BigInt("-9223372036854775808"), /* @__PURE__*/ BigInt("9223372036854775807")],
	uint64: [/* @__PURE__*/ BigInt(0), /* @__PURE__*/ BigInt("18446744073709551615")]
};
function pick(schema, mask) {
	const currDef = schema._zod.def;
	const checks = currDef.checks;
	if (checks && checks.length > 0) throw new Error(".pick() cannot be used on object schemas containing refinements");
	const newShape = {};
	mirrorShape(newShape, schema, maskedKeys(schema, mask));
	return clone(schema, mergeDefs(currDef, {
		shape: newShape,
		checks: []
	}));
}
function maskedKeys(schema, mask) {
	const raw = sourceShape(schema);
	const keys = [];
	for (const key of Reflect.ownKeys(mask)) {
		if (!Object.getOwnPropertyDescriptor(raw, key)?.enumerable) throw new Error(`Unrecognized key: "${String(key)}"`);
		if (mask[key]) keys.push(key);
	}
	return keys;
}
function omit(schema, mask) {
	const currDef = schema._zod.def;
	const checks = currDef.checks;
	if (checks && checks.length > 0) throw new Error(".omit() cannot be used on object schemas containing refinements");
	const omitted = new Set(maskedKeys(schema, mask));
	const newShape = {};
	mirrorShape(newShape, schema, Reflect.ownKeys(sourceShape(schema)).filter((key) => !omitted.has(key)));
	return clone(schema, mergeDefs(currDef, {
		shape: newShape,
		checks: []
	}));
}
function extend(schema, shape) {
	if (!isPlainObject(shape)) throw new Error("Invalid input to extend: expected a plain object");
	const checks = schema._zod.def.checks;
	if (checks && checks.length > 0) {
		const existingShape = sourceShape(schema);
		for (const key of Reflect.ownKeys(shape)) if (Object.getOwnPropertyDescriptor(existingShape, key) !== void 0) throw new Error("Cannot overwrite keys on object schemas containing refinements. Use `.safeExtend()` instead.");
	}
	return clone(schema, mergeDefs(schema._zod.def, { shape: extended(schema, shape) }));
}
function extended(schema, shape) {
	const newShape = {};
	mirrorShape(newShape, schema, Reflect.ownKeys(sourceShape(schema)));
	mirrorProps(newShape, shape);
	return newShape;
}
function safeExtend(schema, shape) {
	if (!isPlainObject(shape)) throw new Error("Invalid input to safeExtend: expected a plain object");
	return clone(schema, mergeDefs(schema._zod.def, { shape: extended(schema, shape) }));
}
function merge(a, b) {
	if (!b?._zod?.def) throw new Error("Invalid input to merge: expected an object schema. To merge a plain shape, use `.extend()`.");
	if (a._zod.def.checks?.length) throw new Error(".merge() cannot be used on object schemas containing refinements. Use .safeExtend() instead.");
	const newShape = {};
	mirrorShape(newShape, a, Reflect.ownKeys(sourceShape(a)));
	mirrorShape(newShape, b, Reflect.ownKeys(sourceShape(b)));
	return clone(a, mergeDefs(a._zod.def, {
		shape: newShape,
		get catchall() {
			return b._zod.def.catchall;
		},
		checks: b._zod.def.checks ?? []
	}));
}
function partial(Class, schema, mask, name = "partial") {
	const checks = schema._zod.def.checks;
	if (checks && checks.length > 0) throw new Error(`.${name}() cannot be used on object schemas containing refinements`);
	const selected = mask ? new Set(maskedKeys(schema, mask)) : void 0;
	const newShape = {};
	mirrorShape(newShape, schema, Reflect.ownKeys(sourceShape(schema)), Class && ((value, key) => selected && !selected.has(key) ? value : new Class({
		type: "optional",
		innerType: value
	})));
	return clone(schema, mergeDefs(schema._zod.def, {
		shape: newShape,
		checks: []
	}));
}
function required(Class, schema, mask) {
	const selected = mask ? new Set(maskedKeys(schema, mask)) : void 0;
	const newShape = {};
	mirrorShape(newShape, schema, Reflect.ownKeys(sourceShape(schema)), (value, key) => selected && !selected.has(key) ? value : new Class({
		type: "nonoptional",
		innerType: value
	}));
	return clone(schema, mergeDefs(schema._zod.def, { shape: newShape }));
}
function aborted(x, startIndex = 0) {
	if (x.aborted === true) return true;
	for (let i = startIndex; i < x.issues.length; i++) if (x.issues[i]?.continue !== true) return true;
	return false;
}
function explicitlyAborted(x, startIndex = 0) {
	if (x.aborted === true) return true;
	for (let i = startIndex; i < x.issues.length; i++) if (x.issues[i]?.continue === false) return true;
	return false;
}
function prefixIssues(path, issues) {
	return issues.map((iss) => {
		var _a;
		(_a = iss).path ?? (_a.path = []);
		iss.path.unshift(path);
		return iss;
	});
}
function unwrapMessage(message) {
	return typeof message === "string" ? message : message?.message;
}
/** The leading size checks of `defChecks` that set an upper bound, each paired with it. */
function sizeCaps(defChecks) {
	const caps = [];
	for (const ch of defChecks ?? []) {
		const d = ch._zod.def;
		if (!/_(length|size)$|_equals$/.test(d.check)) break;
		const max = d.maximum ?? d.length ?? d.size;
		if (max >= 0) caps.push([max, ch]);
	}
	return caps;
}
function attachSchema(issues, start, inst) {
	var _a;
	for (let i = start; i < issues.length; i++) (_a = issues[i]).schema ?? (_a.schema = inst);
}
function finalizeIssue(iss, ctx, config) {
	var _a;
	const traits = iss.inst?._zod?.traits;
	if (traits?.has("$ZodType")) {
		if (traits.has("$ZodCheck")) (_a = iss).schema ?? (_a.schema = iss.inst);
		else iss.schema = iss.inst;
	}
	const schemaError = iss.schema !== iss.inst ? iss.schema?._zod.def?.error : void 0;
	const message = iss.message ? iss.message : unwrapMessage(iss.inst?._zod.def?.error?.(iss)) ?? unwrapMessage(schemaError?.(iss)) ?? unwrapMessage(ctx?.error?.(iss)) ?? unwrapMessage(config.customError?.(iss)) ?? unwrapMessage(config.localeError?.(iss)) ?? "Invalid input";
	const full = {};
	for (const k of Object.keys(iss)) {
		if (k === "inst" || k === "schema" || k === "continue" || k === "input" || k === "__proto__") continue;
		full[k] = iss[k];
	}
	full.path ?? (full.path = []);
	full.message = message;
	if (ctx?.reportInput) full.input = iss.input;
	return full;
}
const highSurrogate = /[\uD800-\uDBFF]/;
function codePointLength(str) {
	const units = str.length;
	if (!highSurrogate.test(str)) return units;
	let count = units;
	for (let i = 0; i < units - 1; i++) if ((str.charCodeAt(i) & 64512) === 55296 && (str.charCodeAt(i + 1) & 64512) === 56320) {
		count--;
		i++;
	}
	return count;
}
function getLengthableOrigin(input) {
	if (Array.isArray(input)) return "array";
	if (typeof input === "string") return "string";
	return "unknown";
}
function parsedType(data) {
	const t = typeof data;
	switch (t) {
		case "number": return Number.isNaN(data) ? "nan" : "number";
		case "object": {
			if (data === null) return "null";
			if (Array.isArray(data)) return "array";
			const obj = data;
			if (obj && Object.getPrototypeOf(obj) !== Object.prototype && "constructor" in obj && obj.constructor) return obj.constructor.name;
		}
	}
	return t;
}
function issue(...args) {
	const [iss, input, inst] = args;
	if (typeof iss === "string") return {
		message: iss,
		code: "custom",
		input,
		inst
	};
	return { ...iss };
}
/**
* Installs a trait's members on its prototype. Each value builds that member for the instance on first read; the built value shadows the accessor as an own property, so a detached `const { parse } = schema` keeps working.
*
* Call this from a `proto` initializer, which runs once per prototype — never per instance.
*/
function members(proto, table) {
	for (const key in table) {
		const desc = Object.getOwnPropertyDescriptor(table, key);
		if (desc.get) Object.defineProperty(proto, key, {
			...desc,
			enumerable: false
		});
		else defineBound(proto, key, desc.value);
	}
}
/** Shadows a prototype member with an own value, so a getter that builds from the instance runs once. */
function own(inst, key, value, enumerable = true) {
	Object.defineProperty(inst, key, {
		configurable: true,
		writable: true,
		enumerable,
		value
	});
	return value;
}
/** Like {@link own}, for a member that was never an own data property and has to stay out of `Object.keys`. */
function hide(inst, key, value) {
	return own(inst, key, value, false);
}
/** Adds members a table derives from the instance: each builds on first read and shadows as own data, and assignment shadows the same way, as when these were own properties. */
/* @__NO_SIDE_EFFECTS__ */
function derived(computes, table) {
	for (const key in computes) {
		const compute = computes[key];
		Object.defineProperty(table, key, {
			configurable: true,
			enumerable: true,
			get() {
				return own(this, key, compute(this));
			},
			set(value) {
				own(this, key, value);
			}
		});
	}
	return table;
}
function defineBound(proto, key, fn) {
	Object.defineProperty(proto, key, {
		configurable: true,
		get() {
			return this == null ? fn : own(this, key, fn.bind(this));
		},
		set(value) {
			own(this, key, value);
		}
	});
}
/** Returns the prototype to install on, or `undefined` if this group is already installed on it. */
function claim(inst, sentinel) {
	const proto = Object.getPrototypeOf(inst);
	return sentinel in proto ? void 0 : proto;
}
let installing;
let broke = false;
const breaker = {
	configurable: true,
	get() {
		broke = true;
	}
};
/**
* Installs a lazily-derived internal on the `_zod` prototype of `inst`'s
* constructor, computed from the internals object itself and cached there on
* first read. One accessor per constructor rather than one per instance.
*/
function defineLazyInternal(inst, key, compute) {
	const proto = Object.getPrototypeOf(inst._zod);
	if (key in proto && installing !== inst._zod) {
		installing = void 0;
		return;
	}
	installing = inst._zod;
	Object.defineProperty(proto, key, {
		configurable: true,
		get() {
			Object.defineProperty(this, key, breaker);
			const outer = broke;
			broke = false;
			try {
				const value = compute(this);
				if (broke) delete this[key];
				else Object.defineProperty(this, key, {
					configurable: true,
					writable: true,
					value
				});
				broke = broke || outer;
				return value;
			} catch (err) {
				delete this[key];
				broke = broke || outer;
				throw err;
			}
		},
		set(value) {
			Object.defineProperty(this, key, {
				configurable: true,
				writable: true,
				value
			});
		}
	});
}
/**
* Installs `key` on `inst`'s prototype, computed by `make` on first read and cached there as an own
* data property. One accessor per constructor rather than one per instance, because an own accessor
* puts every instance after the first into v8 dictionary mode. The key doubles as the sentinel.
*/
function installLazyProp(inst, key, make, enumerable) {
	const proto = claim(inst, key);
	if (!proto) return;
	Object.defineProperty(proto, key, {
		configurable: true,
		get() {
			const desc = {
				configurable: true,
				writable: true,
				enumerable,
				value: void 0
			};
			Object.defineProperty(this, key, desc);
			desc.value = make(this);
			Object.defineProperty(this, key, desc);
			return desc.value;
		},
		set(value) {
			Object.defineProperty(this, key, {
				configurable: true,
				writable: true,
				enumerable,
				value
			});
		}
	});
}
/** Marks the thunk `_catch` synthesises for a constant catch value. `Function.length` cannot tell that thunk from a user callback — rest and defaulted parameters both report arity 0 — and a user callback reads `ctx.error`, whose issues only finalize correctly against the caller's per-parse error map. Provenance can say what arity cannot. A plain string key rather than `Symbol.for`, whose call at module scope no bundler can prove pure — the same shape that anchored `urlCanParse` into every build. */
const CONSTANT_CATCH = "~constantCatch";
/** Wraps a constant catch value in a thunk tagged with {@link CONSTANT_CATCH}. */
function constantCatch(value) {
	const fn = () => value;
	fn[CONSTANT_CATCH] = true;
	return fn;
}
// node_modules/zod/v4/core/core.js
var _a$1;
const _zodDesc = {
	value: void 0,
	enumerable: false
};
let _E = "captureStackTrace" in Error ? Error : null;
function newError(Definition) {
	const E = _E;
	if (E) {
		const saved = E.stackTraceLimit;
		if (typeof saved === "number") {
			try {
				E.stackTraceLimit = 0;
			} catch {
				_E = null;
				return new Definition();
			}
			try {
				return new Definition();
			} finally {
				E.stackTraceLimit = saved;
			}
		}
	}
	return new Definition();
}
/* @__NO_SIDE_EFFECTS__ */
function $constructor(name, initializer, proto, params) {
	const zodProto = {};
	function Internals(def) {
		this.def = def;
		this.constr = _;
		this.traits = /* @__PURE__ */ new Set();
	}
	Internals.prototype = zodProto;
	const protoMembers = proto;
	const initialized = protoMembers && /* @__PURE__ */ new WeakSet();
	function init(inst, def) {
		if (!inst._zod) {
			_zodDesc.value = new Internals(def);
			try {
				Object.defineProperty(inst, "_zod", _zodDesc);
			} finally {
				_zodDesc.value = void 0;
			}
		} else if (inst._zod.traits.has(name)) return;
		inst._zod.traits.add(name);
		initializer(inst, def);
		if (initialized) {
			const own = Object.getPrototypeOf(inst);
			const ctorProto = inst._zod.constr.prototype;
			let up = own;
			while (up && up !== ctorProto) up = Object.getPrototypeOf(up);
			const target = up ?? own;
			if (!initialized.has(target)) {
				initialized.add(target);
				members(target, protoMembers);
			}
		}
		const proto = _.prototype;
		for (const k in proto) {
			if (!Object.prototype.hasOwnProperty.call(proto, k)) continue;
			if (!(k in inst)) inst[k] = proto[k].bind(inst);
		}
	}
	const Parent = params?.Parent ?? Object;
	class Definition extends Parent {}
	Object.defineProperty(Definition, "name", { value: name });
	function _(def) {
		const inst = params?.Parent ? newError(Definition) : this;
		init(inst, def);
		const deferred = inst._zod.deferred;
		if (deferred) {
			for (const fn of deferred) fn();
			inst._zod.deferred = void 0;
		}
		const pp = globalThis.__zod_globalConfig?.postProcessor;
		if (pp) pp(inst);
		return inst;
	}
	Object.defineProperty(_, "init", { value: init });
	Object.defineProperty(_, Symbol.hasInstance, { value: (inst) => {
		if (params?.Parent && inst instanceof params.Parent) return true;
		return inst?._zod?.traits?.has(name);
	} });
	Object.defineProperty(_, "name", { value: name });
	return _;
}
var $ZodAsyncError = class extends Error {
	constructor() {
		super(`Encountered Promise during synchronous parse. Use .parseAsync() instead.`);
	}
};
var $ZodEncodeError = class extends Error {
	constructor(name) {
		super(`Encountered unidirectional transform during encode: ${name}`);
		this.name = "ZodEncodeError";
	}
};
(_a$1 = globalThis).__zod_globalConfig ?? (_a$1.__zod_globalConfig = {});
const globalConfig = globalThis.__zod_globalConfig;
function config(newConfig) {
	if (newConfig) Object.assign(globalConfig, newConfig);
	return globalConfig;
}
// node_modules/zod/v4/core/errors.js
function _getMessage() {
	const internals = this._zod;
	internals.message ?? (internals.message = JSON.stringify(internals.def, jsonStringifyReplacer, 2));
	return internals.message;
}
function _setMessage(value) {
	this._zod.message = value;
}
const _messageDesc = {
	get: _getMessage,
	set: _setMessage,
	enumerable: true,
	configurable: true
};
const _issuesDesc = {
	value: void 0,
	enumerable: false
};
const _installedToString = /* @__PURE__ */ new WeakSet([Object.prototype, Error.prototype]);
const initializer$1 = (inst, def) => {
	inst.name = "$ZodError";
	_issuesDesc.value = def;
	Object.defineProperty(inst, "issues", _issuesDesc);
	_issuesDesc.value = void 0;
	Object.defineProperty(inst, "message", _messageDesc);
	const proto = Object.getPrototypeOf(inst);
	if (!_installedToString.has(proto)) {
		_installedToString.add(proto);
		Object.defineProperty(proto, "toString", {
			configurable: true,
			enumerable: false,
			get() {
				const value = () => this.message;
				Object.defineProperty(this, "toString", {
					value,
					configurable: true,
					writable: true
				});
				return value;
			},
			set(value) {
				Object.defineProperty(this, "toString", {
					value,
					configurable: true,
					writable: true
				});
			}
		});
	}
};
const $ZodError = /* @__PURE__ */ $constructor("$ZodError", initializer$1);
/** Get-or-create `obj[key]` as an own data property. A path segment naming an inherited member
* ("toString", "constructor") would otherwise read through to the prototype, and assigning
* "__proto__" would hit the setter instead of creating a key. */
function node(obj, key, make) {
	if (!Object.prototype.hasOwnProperty.call(obj, key)) {
		if (key === "__proto__") Object.defineProperty(obj, key, {
			value: make(),
			writable: true,
			enumerable: true,
			configurable: true
		});
		else obj[key] = make();
	}
	return obj[key];
}
function flattenError(error, mapper = (issue) => issue.message) {
	const fieldErrors = {};
	const formErrors = [];
	for (const sub of error.issues) if (sub.path.length > 0) node(fieldErrors, sub.path[0], () => []).push(mapper(sub));
	else formErrors.push(mapper(sub));
	return {
		formErrors,
		fieldErrors
	};
}
function formatError(error, mapper = (issue) => issue.message) {
	const fieldErrors = { _errors: [] };
	const processError = (error, path = []) => {
		for (const issue of error.issues) if (issue.code === "invalid_union" && issue.errors.length) issue.errors.map((issues) => processError({ issues }, [...path, ...issue.path]));
		else if (issue.code === "invalid_key") processError({ issues: issue.issues }, [...path, ...issue.path]);
		else if (issue.code === "invalid_element") processError({ issues: issue.issues }, [...path, ...issue.path]);
		else {
			const fullpath = [...path, ...issue.path];
			if (fullpath.length === 0) fieldErrors._errors.push(mapper(issue));
			else {
				let curr = fieldErrors;
				let i = 0;
				while (i < fullpath.length) {
					const el = fullpath[i];
					const terminal = i === fullpath.length - 1;
					if (el === "_errors") {
						if (terminal) curr._errors.push(mapper(issue));
						i++;
						continue;
					}
					if (!Object.prototype.hasOwnProperty.call(curr, el)) Object.defineProperty(curr, el, {
						value: { _errors: [] },
						enumerable: true,
						writable: true,
						configurable: true
					});
					const node = curr[el];
					if (terminal) node._errors.push(mapper(issue));
					curr = node;
					i++;
				}
			}
		}
	};
	processError(error);
	return fieldErrors;
}
// node_modules/zod/v4/core/parse.js
function finalizeParams(callee, params) {
	return {
		callee: params?.callee ?? callee,
		Err: params?.Err
	};
}
const _parse = (_Err) => {
	const fn = (schema, value, _ctx, _params) => {
		const ctx = _ctx ? {
			..._ctx,
			async: false
		} : { async: false };
		const result = schema._zod.run({
			value,
			issues: []
		}, ctx);
		if (result instanceof Promise) throw new $ZodAsyncError();
		if (result.issues.length) {
			const e = new ((_params?.Err) ?? _Err)(result.issues.map((iss) => finalizeIssue(iss, ctx, config())));
			captureStackTrace(e, _params?.callee ?? fn);
			throw e;
		}
		return result.value;
	};
	return fn;
};
const _parseAsync = (_Err) => {
	const fn = async (schema, value, _ctx, params) => {
		const ctx = _ctx ? {
			..._ctx,
			async: true
		} : { async: true };
		let result = schema._zod.run({
			value,
			issues: []
		}, ctx);
		if (result instanceof Promise) result = await result;
		if (result.issues.length) {
			const e = new ((params?.Err) ?? _Err)(result.issues.map((iss) => finalizeIssue(iss, ctx, config())));
			captureStackTrace(e, params?.callee ?? fn);
			throw e;
		}
		return result.value;
	};
	return fn;
};
const _safeParse = (_Err) => (schema, value, _ctx) => {
	const ctx = _ctx ? {
		..._ctx,
		async: false
	} : { async: false };
	const result = schema._zod.run({
		value,
		issues: []
	}, ctx);
	if (result instanceof Promise) throw new $ZodAsyncError();
	return result.issues.length ? failure(_Err, result.issues, ctx) : {
		success: true,
		data: result.value
	};
};
function failure(Err, issues, ctx) {
	let error;
	return {
		success: false,
		get error() {
			if (!error) {
				error = new Err(issues.map((iss) => finalizeIssue(iss, ctx, config())));
				issues = void 0;
				ctx = void 0;
			}
			return error;
		},
		set error(e) {
			error = e;
			issues = void 0;
			ctx = void 0;
		}
	};
}
const _safeParseAsync = (_Err) => async (schema, value, _ctx) => {
	const ctx = _ctx ? {
		..._ctx,
		async: true
	} : { async: true };
	let result = schema._zod.run({
		value,
		issues: []
	}, ctx);
	if (result instanceof Promise) result = await result;
	return result.issues.length ? failure(_Err, result.issues, ctx) : {
		success: true,
		data: result.value
	};
};
const COMPILE_INVALID = /* @__PURE__ */ Symbol.for("zod.compile.invalid");
const COMPILE_FALLBACK = /* @__PURE__ */ Symbol.for("zod.compile.fallback");
const validate = ((schema, value, _ctx) => {
	const validator = schema._zod.bag.validator;
	if (validator !== void 0) {
		if (validator(value) !== COMPILE_INVALID) return true;
		if (validator.definite === true && _ctx === void 0) return false;
	}
	return validateFallback(schema, value, _ctx);
});
function validateFallback(schema, value, _ctx) {
	const ctx = _ctx ? {
		..._ctx,
		async: false,
		abortEarly: true
	} : {
		async: false,
		abortEarly: true
	};
	const fallbackRun = schema._zod.bag.fallbackRun;
	let result;
	if (fallbackRun) {
		ctx[COMPILE_FALLBACK] = true;
		result = fallbackRun({
			value,
			issues: []
		}, ctx);
	} else result = schema._zod.run({
		value,
		issues: []
	}, ctx);
	if (result instanceof Promise) throw new $ZodAsyncError();
	return result.issues.length === 0;
}
const validateAsync$1 = async (schema, value, _ctx) => {
	const ctx = _ctx ? {
		..._ctx,
		async: true,
		abortEarly: true
	} : {
		async: true,
		abortEarly: true
	};
	let result = schema._zod.run({
		value,
		issues: []
	}, ctx);
	if (result instanceof Promise) result = await result;
	return result.issues.length === 0;
};
const _encode = (_Err) => {
	const parse = _parse(_Err);
	const fn = (schema, value, _ctx, _params) => {
		const ctx = _ctx ? {
			..._ctx,
			direction: "backward"
		} : { direction: "backward" };
		return parse(schema, value, ctx, finalizeParams(fn, _params));
	};
	return fn;
};
const _decode = (_Err) => {
	const parse = _parse(_Err);
	const fn = (schema, value, _ctx, _params) => {
		return parse(schema, value, _ctx, finalizeParams(fn, _params));
	};
	return fn;
};
const _encodeAsync = (_Err) => {
	const parseAsync = _parseAsync(_Err);
	const fn = async (schema, value, _ctx, _params) => {
		const ctx = _ctx ? {
			..._ctx,
			direction: "backward"
		} : { direction: "backward" };
		return await parseAsync(schema, value, ctx, finalizeParams(fn, _params));
	};
	return fn;
};
const _decodeAsync = (_Err) => {
	const parseAsync = _parseAsync(_Err);
	const fn = async (schema, value, _ctx, _params) => {
		return await parseAsync(schema, value, _ctx, finalizeParams(fn, _params));
	};
	return fn;
};
const _safeEncode = (_Err) => (schema, value, _ctx) => {
	const ctx = _ctx ? {
		..._ctx,
		direction: "backward"
	} : { direction: "backward" };
	return _safeParse(_Err)(schema, value, ctx);
};
const _safeDecode = (_Err) => (schema, value, _ctx) => {
	return _safeParse(_Err)(schema, value, _ctx);
};
const _safeEncodeAsync = (_Err) => async (schema, value, _ctx) => {
	const ctx = _ctx ? {
		..._ctx,
		direction: "backward"
	} : { direction: "backward" };
	return _safeParseAsync(_Err)(schema, value, ctx);
};
const _safeDecodeAsync = (_Err) => async (schema, value, _ctx) => {
	return _safeParseAsync(_Err)(schema, value, _ctx);
};
// node_modules/zod/v4/core/regexes.js
/**
* @deprecated CUID v1 is deprecated by its authors due to information leakage
* (timestamps embedded in the id). Use {@link cuid2} instead.
* See https://github.com/paralleldrive/cuid.
*/
const cuid = /^[cC][0-9a-z]{6,}$/;
const cuid2 = /^[0-9a-z]+$/;
const ulid = /^[0-7][0-9A-HJKMNP-TV-Za-hjkmnp-tv-z]{25}$/;
const xid = /^[0-9a-vA-V]{20}$/;
const ksuid = /^[A-Za-z0-9]{27}$/;
const nanoid = /^[a-zA-Z0-9_-]{21}$/;
function nanoidOfLength(length) {
	return new RegExp(`^[a-zA-Z0-9_-]{${length}}$`);
}
/** ISO 8601-1 duration regex. Does not support the 8601-2 extensions like negative durations or fractional/negative components. */
const duration = /^P(?:(\d+W)|(?!.*W)(?=\d|T\d)(\d+Y)?(\d+M)?(\d+D)?(T(?=\d)(\d+H)?(\d+M)?(\d+([.,]\d+)?S)?)?)$/;
/** A regex for any UUID-like identifier: 8-4-4-4-12 hex pattern */
const guid = /^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})$/;
/** Returns a regex for validating an RFC 9562/4122 UUID.
*
* @param version Optionally specify a version 1-8. If no version is specified, all versions are supported. */
const uuid = (version) => {
	if (!version) return /^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$/;
	return new RegExp(`^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-${version}[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12})$`);
};
/** Practical email validation */
const email = /^(?:[A-Za-z0-9_'+\-]+\.)*[A-Za-z0-9_'+\-]*[A-Za-z0-9_+-]@(?:[A-Za-z0-9][A-Za-z0-9\-]*\.)+[A-Za-z]{2,}$/;
const _emoji$1 = `^(?=[\\s\\S]*[\\p{Extended_Pictographic}\\p{Regional_Indicator}\\u20E3])[\\p{Extended_Pictographic}\\p{Emoji_Component}]+$`;
function emoji() {
	return new RegExp(_emoji$1, "u");
}
const ipv4 = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])$/;
const ipv6 = /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:))$/;
const cidrv4 = /^((25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\/([0-9]|[1-2][0-9]|3[0-2])$/;
const cidrv6 = /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:))\/(12[0-8]|1[01][0-9]|[1-9]?[0-9])$/;
const base64 = /^$|^(?:[0-9a-zA-Z+/]{4})*(?:(?:[0-9a-zA-Z+/]{2}==)|(?:[0-9a-zA-Z+/]{3}=))?$/;
const base64url = /^(?:[A-Za-z0-9_-]{4})*(?:[A-Za-z0-9_-]{2,3})?$/;
const httpProtocol = /^https?$/;
const e164 = /^\+[1-9]\d{6,14}$/;
const dateSource = `(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))`;
/** Anchors a pattern source. The interpolation lives here rather than at the call site because
* esbuild will not drop a `@__PURE__` call whose own argument interpolates a variable, but it
* will drop `anchor(dateSource)`. Keeping it inline pinned `date` into every bundle. */
function anchor(source) {
	return new RegExp(`^${source}$`);
}
const date = /*@__PURE__*/ anchor(dateSource);
function timeSource(args) {
	const hhmm = `(?:[01]\\d|2[0-3]):[0-5]\\d`;
	return typeof args.precision === "number" ? args.precision === -1 ? `${hhmm}` : args.precision === 0 ? `${hhmm}:[0-5]\\d` : `${hhmm}:[0-5]\\d\\.\\d{${args.precision}}` : args.seconds ? `${hhmm}:[0-5]\\d(?:\\.\\d+)?` : `${hhmm}(?::[0-5]\\d(?:\\.\\d+)?)?`;
}
function time(args) {
	return new RegExp(`^${timeSource(args)}$`);
}
function datetime(args) {
	const opts = ["Z"];
	if (args.offset) opts.push(`([+-](?:[01]\\d|2[0-3]):[0-5]\\d)`);
	const qualified = `${timeSource({
		precision: args.precision,
		seconds: true
	})}(?:${opts.join("|")})`;
	const timeRegex = args.local ? `${qualified}|${timeSource({ precision: args.precision })}` : qualified;
	return new RegExp(`^${dateSource}T(?:${timeRegex})$`);
}
const anyString = /^[\s\S]{0,}$/;
const number$1 = /^-?\d+(?:\.\d+)?$/;
const boolean$1 = /^(?:true|false)$/i;
const lowercase = /^[^A-Z]*$/;
const uppercase = /^[^a-z]*$/;
// node_modules/zod/v4/core/checks.js
const $ZodCheck = /*@__PURE__*/ $constructor("$ZodCheck", (inst, def) => {
	var _a;
	inst._zod ?? (inst._zod = {});
	inst._zod.def = def;
	(_a = inst._zod).onattach ?? (_a.onattach = []);
});
/** Default `when` for length-based checks: run only on non-nullish values with a `length`. */
const _whenHasLength = (payload) => {
	const val = payload.value;
	return !nullish(val) && val.length !== void 0;
};
const numericOriginMap = {
	number: "number",
	bigint: "bigint",
	object: "date"
};
const $ZodCheckLessThan = /*@__PURE__*/ $constructor("$ZodCheckLessThan", (inst, def) => {
	$ZodCheck.init(inst, def);
	const origin = numericOriginMap[typeof def.value];
	inst._zod.check = (payload) => {
		if (def.inclusive ? payload.value <= def.value : payload.value < def.value) return;
		payload.issues.push({
			origin: numericOriginMap[typeof payload.value] ?? origin,
			code: "too_big",
			maximum: typeof def.value === "object" ? def.value.getTime() : def.value,
			input: payload.value,
			inclusive: def.inclusive,
			inst,
			continue: !def.abort
		});
	};
});
const $ZodCheckGreaterThan = /*@__PURE__*/ $constructor("$ZodCheckGreaterThan", (inst, def) => {
	$ZodCheck.init(inst, def);
	const origin = numericOriginMap[typeof def.value];
	inst._zod.check = (payload) => {
		if (def.inclusive ? payload.value >= def.value : payload.value > def.value) return;
		payload.issues.push({
			origin: numericOriginMap[typeof payload.value] ?? origin,
			code: "too_small",
			minimum: typeof def.value === "object" ? def.value.getTime() : def.value,
			input: payload.value,
			inclusive: def.inclusive,
			inst,
			continue: !def.abort
		});
	};
});
const $ZodCheckMultipleOf = /*@__PURE__*/ $constructor("$ZodCheckMultipleOf", (inst, def) => {
	$ZodCheck.init(inst, def);
	inst._zod.check = (payload) => {
		if (typeof payload.value !== typeof def.value) throw new Error("Cannot mix number and bigint in multiple_of check.");
		if (typeof payload.value === "bigint" ? def.value !== BigInt(0) && payload.value % def.value === BigInt(0) : floatSafeRemainder(payload.value, def.value) === 0) return;
		payload.issues.push({
			origin: typeof payload.value,
			code: "not_multiple_of",
			divisor: def.value,
			input: payload.value,
			inst,
			continue: !def.abort
		});
	};
});
const $ZodCheckNumberFormat = /*@__PURE__*/ $constructor("$ZodCheckNumberFormat", (inst, def) => {
	$ZodCheck.init(inst, def);
	def.format = def.format || "float64";
	const isInt = def.format?.includes("int");
	const origin = isInt ? "int" : "number";
	const [minimum, maximum] = NUMBER_FORMAT_RANGES[def.format];
	inst._zod.check = (payload) => {
		const input = payload.value;
		if (isInt) {
			if (!Number.isInteger(input)) {
				payload.issues.push({
					expected: origin,
					format: def.format,
					code: "invalid_type",
					continue: false,
					input,
					inst
				});
				return;
			}
			if (!Number.isSafeInteger(input)) {
				if (input > 0) payload.issues.push({
					input,
					code: "too_big",
					maximum: Number.MAX_SAFE_INTEGER,
					note: "Integers must be within the safe integer range.",
					inst,
					origin,
					inclusive: true,
					continue: !def.abort
				});
				else payload.issues.push({
					input,
					code: "too_small",
					minimum: Number.MIN_SAFE_INTEGER,
					note: "Integers must be within the safe integer range.",
					inst,
					origin,
					inclusive: true,
					continue: !def.abort
				});
				return;
			}
		}
		if (input < minimum) payload.issues.push({
			origin: "number",
			input,
			code: "too_small",
			minimum,
			inclusive: true,
			inst,
			continue: !def.abort
		});
		if (input > maximum) payload.issues.push({
			origin: "number",
			input,
			code: "too_big",
			maximum,
			inclusive: true,
			inst,
			continue: !def.abort
		});
	};
});
const $ZodCheckMaxLength = /*@__PURE__*/ $constructor("$ZodCheckMaxLength", (inst, def) => {
	var _a;
	$ZodCheck.init(inst, def);
	(_a = inst._zod.def).when ?? (_a.when = _whenHasLength);
	inst._zod.check = (payload) => {
		const input = payload.value;
		const units = input.length;
		if ((typeof input === "string" && units > def.maximum ? codePointLength(input) : units) <= def.maximum) return;
		const origin = getLengthableOrigin(input);
		payload.issues.push({
			origin,
			code: "too_big",
			maximum: def.maximum,
			inclusive: true,
			input,
			inst,
			continue: !def.abort
		});
	};
});
const $ZodCheckMinLength = /*@__PURE__*/ $constructor("$ZodCheckMinLength", (inst, def) => {
	var _a;
	$ZodCheck.init(inst, def);
	(_a = inst._zod.def).when ?? (_a.when = _whenHasLength);
	inst._zod.check = (payload) => {
		const input = payload.value;
		const units = input.length;
		if ((typeof input === "string" && units >= def.minimum && units < def.minimum * 2 ? codePointLength(input) : units) >= def.minimum) return;
		const origin = getLengthableOrigin(input);
		payload.issues.push({
			origin,
			code: "too_small",
			minimum: def.minimum,
			inclusive: true,
			input,
			inst,
			continue: !def.abort
		});
	};
});
const $ZodCheckLengthEquals = /*@__PURE__*/ $constructor("$ZodCheckLengthEquals", (inst, def) => {
	var _a;
	$ZodCheck.init(inst, def);
	(_a = inst._zod.def).when ?? (_a.when = _whenHasLength);
	inst._zod.check = (payload) => {
		const input = payload.value;
		const units = input.length;
		const length = typeof input === "string" && units >= def.length && units <= def.length * 2 ? codePointLength(input) : units;
		if (length === def.length) return;
		const origin = getLengthableOrigin(input);
		const tooBig = length > def.length;
		payload.issues.push({
			origin,
			...tooBig ? {
				code: "too_big",
				maximum: def.length
			} : {
				code: "too_small",
				minimum: def.length
			},
			inclusive: true,
			exact: true,
			input: payload.value,
			inst,
			continue: !def.abort
		});
	};
});
const $ZodCheckStringFormat = /*@__PURE__*/ $constructor("$ZodCheckStringFormat", (inst, def) => {
	var _a, _b;
	$ZodCheck.init(inst, def);
	if (def.pattern) (_a = inst._zod).check ?? (_a.check = (payload) => {
		def.pattern.lastIndex = 0;
		if (def.pattern.test(payload.value)) return;
		payload.issues.push({
			origin: "string",
			code: "invalid_format",
			format: def.format,
			input: payload.value,
			...def.pattern ? { pattern: def.pattern.toString() } : {},
			inst,
			continue: !def.abort
		});
	});
	else (_b = inst._zod).check ?? (_b.check = () => {});
});
const $ZodCheckRegex = /*@__PURE__*/ $constructor("$ZodCheckRegex", (inst, def) => {
	$ZodCheckStringFormat.init(inst, def);
	inst._zod.check = (payload) => {
		def.pattern.lastIndex = 0;
		if (def.pattern.test(payload.value)) return;
		payload.issues.push({
			origin: "string",
			code: "invalid_format",
			format: "regex",
			input: payload.value,
			pattern: def.pattern.toString(),
			inst,
			continue: !def.abort
		});
	};
});
const $ZodCheckLowerCase = /*@__PURE__*/ $constructor("$ZodCheckLowerCase", (inst, def) => {
	def.pattern ?? (def.pattern = lowercase);
	$ZodCheckStringFormat.init(inst, def);
});
const $ZodCheckUpperCase = /*@__PURE__*/ $constructor("$ZodCheckUpperCase", (inst, def) => {
	def.pattern ?? (def.pattern = uppercase);
	$ZodCheckStringFormat.init(inst, def);
});
const $ZodCheckIncludes = /*@__PURE__*/ $constructor("$ZodCheckIncludes", (inst, def) => {
	$ZodCheck.init(inst, def);
	const escapedRegex = escapeRegex$2(def.includes);
	def.pattern = new RegExp(typeof def.position === "number" ? `^.{${def.position},}${escapedRegex}` : escapedRegex);
	inst._zod.check = (payload) => {
		if (payload.value.includes(def.includes, def.position)) return;
		payload.issues.push({
			origin: "string",
			code: "invalid_format",
			format: "includes",
			includes: def.includes,
			input: payload.value,
			inst,
			continue: !def.abort
		});
	};
});
const $ZodCheckStartsWith = /*@__PURE__*/ $constructor("$ZodCheckStartsWith", (inst, def) => {
	$ZodCheck.init(inst, def);
	const pattern = new RegExp(`^${escapeRegex$2(def.prefix)}.*`);
	def.pattern ?? (def.pattern = pattern);
	inst._zod.check = (payload) => {
		if (payload.value.startsWith(def.prefix)) return;
		payload.issues.push({
			origin: "string",
			code: "invalid_format",
			format: "starts_with",
			prefix: def.prefix,
			input: payload.value,
			inst,
			continue: !def.abort
		});
	};
});
const $ZodCheckEndsWith = /*@__PURE__*/ $constructor("$ZodCheckEndsWith", (inst, def) => {
	$ZodCheck.init(inst, def);
	const pattern = new RegExp(`.*${escapeRegex$2(def.suffix)}$`);
	def.pattern ?? (def.pattern = pattern);
	inst._zod.check = (payload) => {
		if (payload.value.endsWith(def.suffix)) return;
		payload.issues.push({
			origin: "string",
			code: "invalid_format",
			format: "ends_with",
			suffix: def.suffix,
			input: payload.value,
			inst,
			continue: !def.abort
		});
	};
});
const $ZodCheckOverwrite = /*@__PURE__*/ $constructor("$ZodCheckOverwrite", (inst, def) => {
	$ZodCheck.init(inst, def);
	inst._zod.check = (payload) => {
		payload.value = def.tx(payload.value);
	};
});
// node_modules/zod/v4/core/doc.js
var Doc = class {
	constructor(args = [], closed = {}) {
		this.content = [];
		this.indent = 0;
		this.args = args;
		this.closed = closed;
	}
	indented(fn) {
		this.indent += 1;
		try {
			fn(this);
		} finally {
			this.indent -= 1;
		}
	}
	write(arg) {
		if (typeof arg === "function") {
			arg(this, { execution: "sync" });
			arg(this, { execution: "async" });
			return;
		}
		const lines = arg.split("\n").filter((x) => x);
		const minIndent = Math.min(...lines.map((x) => x.length - x.trimStart().length));
		const dedented = lines.map((x) => x.slice(minIndent)).map((x) => " ".repeat(this.indent * 2) + x);
		for (const line of dedented) this.content.push(line);
	}
	compile() {
		const F = Function;
		const content = this?.content ?? [``];
		return new F(...Object.keys(this.closed), `return function (${this.args.join(", ")}) {\n${content.join("\n")}\n};`)(...Object.values(this.closed));
	}
};
// node_modules/zod/v4/core/versions.js
const version = {
	major: 4,
	minor: 6,
	patch: 6
};
// node_modules/zod/v4/core/schemas.js
const $ZodType = /*@__PURE__*/ $constructor("$ZodType", (inst, def) => {
	var _a;
	inst ?? (inst = {});
	inst._zod.def = def;
	inst._zod.bag = inst._zod.bag || {};
	inst._zod.version = version;
	const defChecks = inst._zod.def.checks;
	const checks = inst._zod.traits.has("$ZodCheck") ? [inst, ...defChecks ?? []] : defChecks?.length ? [...defChecks] : [];
	for (const ch of checks) for (const fn of ch._zod.onattach) fn(inst);
	if (checks.length === 0) {
		(_a = inst._zod).deferred ?? (_a.deferred = []);
		inst._zod.deferred?.push(() => {
			inst._zod.run = inst._zod.parse;
		});
	} else {
		const runChecks = (payload, checks, ctx) => {
			if (payload.memo) return payload;
			let isAborted = aborted(payload);
			let asyncResult;
			for (const ch of checks) {
				if (ch._zod.def.when) {
					if (explicitlyAborted(payload)) continue;
					if (!ch._zod.def.when(payload)) continue;
				} else if (isAborted) continue;
				const currLen = payload.issues.length;
				const _ = ch._zod.check(payload);
				if (_ instanceof Promise && ctx?.async === false) throw new $ZodAsyncError();
				if (asyncResult || _ instanceof Promise) asyncResult = (asyncResult ?? Promise.resolve()).then(async () => {
					await _;
					if (payload.issues.length === currLen) return;
					attachSchema(payload.issues, currLen, inst);
					if (!isAborted) isAborted = aborted(payload, currLen);
				});
				else {
					if (payload.issues.length === currLen) continue;
					attachSchema(payload.issues, currLen, inst);
					if (!isAborted) isAborted = aborted(payload, currLen);
				}
			}
			if (asyncResult) return asyncResult.then(() => {
				return payload;
			});
			return payload;
		};
		const handleCanaryResult = (canary, payload, ctx) => {
			if (aborted(canary)) {
				canary.aborted = true;
				return canary;
			}
			const checkResult = runChecks(payload, checks, ctx);
			if (checkResult instanceof Promise) {
				if (ctx.async === false) throw new $ZodAsyncError();
				return checkResult.then((checkResult) => inst._zod.parse(checkResult, ctx));
			}
			return inst._zod.parse(checkResult, ctx);
		};
		inst._zod.run = (payload, ctx) => {
			if (ctx.skipChecks) return inst._zod.parse(payload, ctx);
			if (ctx.direction === "backward") {
				const canary = inst._zod.parse({
					value: payload.value,
					issues: []
				}, {
					...ctx,
					skipChecks: true
				});
				if (canary instanceof Promise) return canary.then((canary) => {
					return handleCanaryResult(canary, payload, ctx);
				});
				return handleCanaryResult(canary, payload, ctx);
			}
			const result = inst._zod.parse(payload, ctx);
			if (result instanceof Promise) {
				if (ctx.async === false) throw new $ZodAsyncError();
				return result.then((result) => runChecks(result, checks, ctx));
			}
			return runChecks(result, checks, ctx);
		};
	}
}, {
	get "~standard"() {
		return hide(this, "~standard", standardProps(this));
	},
	set "~standard"(value) {
		own(this, "~standard", value);
	}
});
/** The Standard Schema surface for `inst`. Shared so wrappers can extend it without forcing it. */
const toStandardResult = (r, ctx) => r.issues.length ? { issues: r.issues.map((iss) => finalizeIssue(iss, ctx, config())) } : { value: r.value };
async function validateAsync(inst, value) {
	const ctx = { async: true };
	return toStandardResult(await inst._zod.run({
		value,
		issues: []
	}, ctx), ctx);
}
function standardProps(inst) {
	return {
		validate: (value) => {
			const ctx = { async: false };
			try {
				const r = inst._zod.run({
					value,
					issues: []
				}, ctx);
				if (!(r instanceof Promise)) return toStandardResult(r, ctx);
			} catch (_) {}
			return validateAsync(inst, value);
		},
		vendor: "zod",
		version: 1
	};
}
const $ZodString = /*@__PURE__*/ $constructor("$ZodString", (inst, def) => {
	$ZodType.init(inst, def);
	inst._zod.pattern = def.pattern ?? anyString;
	inst._zod.parse = (payload, _) => {
		if (def.coerce) try {
			payload.value = String(payload.value);
		} catch (_) {}
		if (typeof payload.value === "string") return payload;
		payload.issues.push({
			expected: "string",
			code: "invalid_type",
			input: payload.value,
			inst
		});
		return payload;
	};
});
const $ZodStringFormat = /*@__PURE__*/ $constructor("$ZodStringFormat", (inst, def) => {
	$ZodCheckStringFormat.init(inst, def);
	$ZodString.init(inst, def);
});
const $ZodGUID = /*@__PURE__*/ $constructor("$ZodGUID", (inst, def) => {
	def.pattern ?? (def.pattern = guid);
	$ZodStringFormat.init(inst, def);
});
const $ZodUUID = /*@__PURE__*/ $constructor("$ZodUUID", (inst, def) => {
	if (def.version) {
		const v = {
			v1: 1,
			v2: 2,
			v3: 3,
			v4: 4,
			v5: 5,
			v6: 6,
			v7: 7,
			v8: 8
		}[def.version];
		if (v === void 0) throw new Error(`Invalid UUID version: "${def.version}"`);
		def.pattern ?? (def.pattern = uuid(v));
	} else def.pattern ?? (def.pattern = uuid());
	$ZodStringFormat.init(inst, def);
});
const $ZodEmail = /*@__PURE__*/ $constructor("$ZodEmail", (inst, def) => {
	def.pattern ?? (def.pattern = email);
	$ZodStringFormat.init(inst, def);
});
function canParseURL(input) {
	try {
		if (typeof URL !== "undefined" && typeof URL.canParse === "function") return URL.canParse(input);
		new URL(input);
		return true;
	} catch {
		return false;
	}
}
function validateURL(trimmed, def) {
	if (!("normalize" in def) && !("hostname" in def) && !("protocol" in def)) return canParseURL(trimmed) || 2;
	return parseURLObject(trimmed, def);
}
/** Parses a URL while preserving the non-normalizing HTTP guard. */
function parseURLObject(trimmed, def) {
	if (!def.normalize && def.protocol?.source === httpProtocol.source && !/^https?:\/\//i.test(trimmed)) return 1;
	try {
		if (typeof URL !== "undefined") {
			const URLStatic = URL;
			if (typeof URLStatic.parse === "function") return URLStatic.parse(trimmed) ?? 2;
		}
		return new URL(trimmed);
	} catch {
		return 2;
	}
}
const asciiTabOrNewline = /[\t\n\r]/g;
/** The URL parser deletes every ASCII tab, LF and CR from its input before it parses, so `new URL("https://exa\nmple.com")` reports on `example.com`. Applying the same deletion to the returned value closes the half of that divergence which can move the host; the parser's other rewrite, stripping C0 controls at the edges, cannot. */
function stripTabAndNewline(value) {
	return value.replace(asciiTabOrNewline, "");
}
function urlHostnameOk(url, hostname) {
	hostname.lastIndex = 0;
	return hostname.test(url.hostname);
}
function urlProtocolOk(url, protocol) {
	protocol.lastIndex = 0;
	return protocol.test(url.protocol.endsWith(":") ? url.protocol.slice(0, -1) : url.protocol);
}
const $ZodURL = /*@__PURE__*/ $constructor("$ZodURL", (inst, def) => {
	$ZodStringFormat.init(inst, def);
	inst._zod.check = (payload) => {
		try {
			const trimmed = payload.value.trim();
			const url = validateURL(trimmed, def);
			if (url === 1) {
				payload.issues.push({
					code: "invalid_format",
					format: "url",
					note: "Invalid URL format",
					input: payload.value,
					inst,
					continue: !def.abort
				});
				return;
			}
			if (url === 2) {
				payload.issues.push({
					code: "invalid_format",
					format: "url",
					input: payload.value,
					inst,
					continue: !def.abort
				});
				return;
			}
			if (url === true) {
				payload.value = stripTabAndNewline(trimmed);
				return;
			}
			if (def.hostname && !urlHostnameOk(url, def.hostname)) payload.issues.push({
				code: "invalid_format",
				format: "url",
				note: "Invalid hostname",
				pattern: def.hostname.source,
				input: payload.value,
				inst,
				continue: !def.abort
			});
			if (def.protocol && !urlProtocolOk(url, def.protocol)) payload.issues.push({
				code: "invalid_format",
				format: "url",
				note: "Invalid protocol",
				pattern: def.protocol.source,
				input: payload.value,
				inst,
				continue: !def.abort
			});
			payload.value = def.normalize ? url.href : stripTabAndNewline(trimmed);
			return;
		} catch (_) {
			payload.issues.push({
				code: "invalid_format",
				format: "url",
				input: payload.value,
				inst,
				continue: !def.abort
			});
		}
	};
});
const $ZodEmoji = /*@__PURE__*/ $constructor("$ZodEmoji", (inst, def) => {
	def.pattern ?? (def.pattern = emoji());
	$ZodStringFormat.init(inst, def);
});
const $ZodNanoID = /*@__PURE__*/ $constructor("$ZodNanoID", (inst, def) => {
	if (def.length !== void 0 && (!Number.isInteger(def.length) || def.length < 1)) throw new Error(`Invalid nanoid length: ${def.length}`);
	def.pattern ?? (def.pattern = def.length === void 0 ? nanoid : nanoidOfLength(def.length));
	$ZodStringFormat.init(inst, def);
});
/**
* @deprecated CUID v1 is deprecated by its authors due to information leakage
* (timestamps embedded in the id). Use {@link $ZodCUID2} instead.
* See https://github.com/paralleldrive/cuid.
*/
const $ZodCUID = /*@__PURE__*/ $constructor("$ZodCUID", (inst, def) => {
	def.pattern ?? (def.pattern = cuid);
	$ZodStringFormat.init(inst, def);
});
const $ZodCUID2 = /*@__PURE__*/ $constructor("$ZodCUID2", (inst, def) => {
	def.pattern ?? (def.pattern = cuid2);
	$ZodStringFormat.init(inst, def);
});
const $ZodULID = /*@__PURE__*/ $constructor("$ZodULID", (inst, def) => {
	def.pattern ?? (def.pattern = ulid);
	$ZodStringFormat.init(inst, def);
});
const $ZodXID = /*@__PURE__*/ $constructor("$ZodXID", (inst, def) => {
	def.pattern ?? (def.pattern = xid);
	$ZodStringFormat.init(inst, def);
});
const $ZodKSUID = /*@__PURE__*/ $constructor("$ZodKSUID", (inst, def) => {
	def.pattern ?? (def.pattern = ksuid);
	$ZodStringFormat.init(inst, def);
});
const $ZodISODateTime = /*@__PURE__*/ $constructor("$ZodISODateTime", (inst, def) => {
	def.pattern ?? (def.pattern = datetime(def));
	$ZodStringFormat.init(inst, def);
});
const $ZodISODate = /*@__PURE__*/ $constructor("$ZodISODate", (inst, def) => {
	def.pattern ?? (def.pattern = date);
	$ZodStringFormat.init(inst, def);
});
const $ZodISOTime = /*@__PURE__*/ $constructor("$ZodISOTime", (inst, def) => {
	def.pattern ?? (def.pattern = time(def));
	$ZodStringFormat.init(inst, def);
});
const $ZodISODuration = /*@__PURE__*/ $constructor("$ZodISODuration", (inst, def) => {
	def.pattern ?? (def.pattern = duration);
	$ZodStringFormat.init(inst, def);
});
const $ZodIPv4 = /*@__PURE__*/ $constructor("$ZodIPv4", (inst, def) => {
	def.pattern ?? (def.pattern = ipv4);
	$ZodStringFormat.init(inst, def);
});
/** An IPv6 address is written with hex digits, colons and dots, and nothing else. The guard is what makes the check below an IPv6 check: `new URL("http://[...]")` parses an authority, not an address, so `@` and `\` re-delimit it and `"::@1\\"` validates against the host `0.0.0.1`. The URL parser also deletes ASCII tab, LF and CR rather than failing, which is how `"::1\n"` validated as `::1`. */
const ipv6Alphabet = /^[0-9a-fA-F:.]+$/;
function isValidIPv6(value) {
	if (!ipv6Alphabet.test(value)) return false;
	return canParseURL(`http://[${value}]`);
}
const $ZodIPv6 = /*@__PURE__*/ $constructor("$ZodIPv6", (inst, def) => {
	def.pattern ?? (def.pattern = ipv6);
	$ZodStringFormat.init(inst, def);
	inst._zod.check = (payload) => {
		if (!isValidIPv6(payload.value)) payload.issues.push({
			code: "invalid_format",
			format: "ipv6",
			input: payload.value,
			inst,
			continue: !def.abort
		});
	};
});
const $ZodCIDRv4 = /*@__PURE__*/ $constructor("$ZodCIDRv4", (inst, def) => {
	def.pattern ?? (def.pattern = cidrv4);
	$ZodStringFormat.init(inst, def);
});
function isValidCIDRv6(value) {
	const parts = value.split("/");
	if (parts.length !== 2) return false;
	const [address, prefix] = parts;
	if (!prefix) return false;
	const prefixNum = Number(prefix);
	if (`${prefixNum}` !== prefix) return false;
	if (prefixNum < 0 || prefixNum > 128) return false;
	return isValidIPv6(address);
}
const $ZodCIDRv6 = /*@__PURE__*/ $constructor("$ZodCIDRv6", (inst, def) => {
	def.pattern ?? (def.pattern = cidrv6);
	$ZodStringFormat.init(inst, def);
	inst._zod.check = (payload) => {
		if (!isValidCIDRv6(payload.value)) payload.issues.push({
			code: "invalid_format",
			format: "cidrv6",
			input: payload.value,
			inst,
			continue: !def.abort
		});
	};
});
function isValidBase64(data) {
	if (data === "") return true;
	if (/\s/.test(data)) return false;
	if (data.length % 4 !== 0) return false;
	try {
		atob(data);
		return true;
	} catch {
		return false;
	}
}
const base64Charset = /^[0-9a-zA-Z+/]*={0,2}$/;
const $ZodBase64 = /*@__PURE__*/ $constructor("$ZodBase64", (inst, def) => {
	def.pattern ?? (def.pattern = base64Charset);
	$ZodStringFormat.init(inst, def);
	inst._zod.check = (payload) => {
		if (isValidBase64(payload.value)) return;
		payload.issues.push({
			code: "invalid_format",
			format: "base64",
			input: payload.value,
			inst,
			continue: !def.abort
		});
	};
});
const base64urlCharset = /^[A-Za-z0-9_-]*$/;
function isValidBase64URL(data) {
	if (!base64urlCharset.test(data)) return false;
	const base64 = data.replace(/[-_]/g, (c) => c === "-" ? "+" : "/");
	return isValidBase64(base64.padEnd(Math.ceil(base64.length / 4) * 4, "="));
}
const $ZodBase64URL = /*@__PURE__*/ $constructor("$ZodBase64URL", (inst, def) => {
	def.pattern ?? (def.pattern = base64urlCharset);
	$ZodStringFormat.init(inst, def);
	inst._zod.check = (payload) => {
		if (isValidBase64URL(payload.value)) return;
		payload.issues.push({
			code: "invalid_format",
			format: "base64url",
			input: payload.value,
			inst,
			continue: !def.abort
		});
	};
});
const $ZodE164 = /*@__PURE__*/ $constructor("$ZodE164", (inst, def) => {
	def.pattern ?? (def.pattern = e164);
	$ZodStringFormat.init(inst, def);
});
function isValidJWT(token, algorithm = null) {
	try {
		const tokensParts = token.split(".");
		if (tokensParts.length !== 3) return false;
		const [header] = tokensParts;
		if (!header) return false;
		const parsedHeader = JSON.parse(atob(header));
		if ("typ" in parsedHeader && parsedHeader?.typ !== "JWT") return false;
		if (!parsedHeader.alg) return false;
		if (algorithm && (!("alg" in parsedHeader) || parsedHeader.alg !== algorithm)) return false;
		return true;
	} catch {
		return false;
	}
}
const $ZodJWT = /*@__PURE__*/ $constructor("$ZodJWT", (inst, def) => {
	$ZodStringFormat.init(inst, def);
	inst._zod.check = (payload) => {
		if (isValidJWT(payload.value, def.alg)) return;
		payload.issues.push({
			code: "invalid_format",
			format: "jwt",
			input: payload.value,
			inst,
			continue: !def.abort
		});
	};
});
const $ZodNumber = /*@__PURE__*/ $constructor("$ZodNumber", (inst, def) => {
	$ZodType.init(inst, def);
	inst._zod.pattern = number$1;
	inst._zod.parse = (payload, _ctx) => {
		if (def.coerce) try {
			payload.value = Number(payload.value);
		} catch (_) {}
		const input = payload.value;
		if (typeof input === "number" && !Number.isNaN(input) && Number.isFinite(input)) return payload;
		const received = typeof input === "number" ? Number.isNaN(input) ? "NaN" : !Number.isFinite(input) ? String(input) : void 0 : void 0;
		payload.issues.push({
			expected: "number",
			code: "invalid_type",
			input,
			inst,
			...received ? { received } : {}
		});
		return payload;
	};
});
const $ZodNumberFormat = /*@__PURE__*/ $constructor("$ZodNumberFormat", (inst, def) => {
	$ZodCheckNumberFormat.init(inst, def);
	$ZodNumber.init(inst, def);
});
const $ZodBoolean = /*@__PURE__*/ $constructor("$ZodBoolean", (inst, def) => {
	$ZodType.init(inst, def);
	inst._zod.pattern = boolean$1;
	inst._zod.parse = (payload, _ctx) => {
		if (def.coerce) try {
			payload.value = Boolean(payload.value);
		} catch (_) {}
		const input = payload.value;
		if (typeof input === "boolean") return payload;
		payload.issues.push({
			expected: "boolean",
			code: "invalid_type",
			input,
			inst
		});
		return payload;
	};
});
const $ZodUnknown = /*@__PURE__*/ $constructor("$ZodUnknown", (inst, def) => {
	$ZodType.init(inst, def);
	inst._zod.parse = (payload) => payload;
});
const $ZodNever = /*@__PURE__*/ $constructor("$ZodNever", (inst, def) => {
	$ZodType.init(inst, def);
	inst._zod.parse = (payload, _ctx) => {
		payload.issues.push({
			expected: "never",
			code: "invalid_type",
			input: payload.value,
			inst
		});
		return payload;
	};
});
function capSize(inst, size) {
	const caps = sizeCaps(inst._zod.def.checks);
	if (!caps.length) return;
	const cap = Math.min(...caps.map((c) => c[0]));
	const parse = inst._zod.parse;
	inst._zod.parse = (payload, ctx) => {
		const n = size(payload.value);
		if (n > cap && !ctx?.skipChecks && ctx?.direction !== "backward") {
			for (const [max, ch] of sizeCaps(inst._zod.def.checks)) if (n > max && ch._zod.def.when(payload)) {
				const start = payload.issues.length;
				ch._zod.check(payload);
				payload.issues[start].continue = false;
				attachSchema(payload.issues, start, inst);
				return payload;
			}
		}
		return parse(payload, ctx);
	};
}
const arraySize = (input) => Array.isArray(input) ? input.length : -1;
function handleArrayResult(result, final, index) {
	if (result.issues.length) final.issues.push(...prefixIssues(index, result.issues));
	final.value[index] = result.value;
}
const $ZodArray = /*@__PURE__*/ $constructor("$ZodArray", (inst, def) => {
	$ZodType.init(inst, def);
	const memo = globalConfig.memoizer;
	memo?.attach(inst);
	inst._zod.parse = (payload, ctx) => {
		const input = payload.value;
		if (!Array.isArray(input)) {
			payload.issues.push({
				expected: "array",
				code: "invalid_type",
				input,
				inst
			});
			return payload;
		}
		payload.value = memo ? memo.alloc(inst, payload, Array(input.length), ctx) : Array(input.length);
		const proms = [];
		const abortEarly = ctx?.abortEarly;
		for (let i = 0; i < input.length; i++) {
			const item = input[i];
			const result = def.element._zod.run({
				value: item,
				issues: []
			}, ctx);
			if (result instanceof Promise) proms.push(result.then((result) => handleArrayResult(result, payload, i)));
			else {
				handleArrayResult(result, payload, i);
				if (abortEarly && result.issues.length !== 0 && aborted(result)) break;
			}
		}
		if (proms.length) return Promise.all(proms).then(() => payload);
		return payload;
	};
	capSize(inst, arraySize);
});
function handlePropertyResult(result, final, key, input, optin, optout) {
	const isPresent = key in input;
	const isOptionalOut = optout === "optional";
	if (!isPresent && isOptionalOut && optin === "optional") return;
	if (result.issues.length) {
		if (optin !== void 0 && isOptionalOut && !isPresent) return;
		final.issues.push(...prefixIssues(key, result.issues));
	}
	if (!isPresent && optin === void 0) {
		if (!result.issues.length) final.issues.push({
			code: "invalid_type",
			expected: "nonoptional",
			input: void 0,
			path: [key]
		});
		return;
	}
	if (result.value === void 0) {
		if (isPresent || optin === "defaulted" && !isOptionalOut) final.value[key] = void 0;
	} else final.value[key] = result.value;
}
const NO_SYMBOL_KEYS = [];
function normalizeDef(def) {
	const keys = Object.keys(def.shape);
	const ownSymbols = Object.getOwnPropertySymbols(def.shape);
	const symbolKeys = ownSymbols.length ? ownSymbols : NO_SYMBOL_KEYS;
	const allKeys = symbolKeys.length ? [...keys, ...symbolKeys] : keys;
	for (const k of allKeys) if (!def.shape?.[k]?._zod?.traits?.has("$ZodType")) throw new Error(`Invalid element at key "${String(k)}": expected a Zod schema`);
	const okeys = optionalKeys(def.shape);
	return {
		...def,
		allKeys,
		symbolKeys,
		keySet: new Set(keys),
		numKeys: keys.length,
		optionalKeys: new Set(okeys)
	};
}
function handleCatchall(proms, input, payload, ctx, def, inst, abortEarly) {
	const unrecognized = [];
	const keySet = def.keySet;
	const _catchall = def.catchall._zod;
	const t = _catchall.def.type;
	const optin = _catchall.optin;
	const optout = _catchall.optout;
	let seen = 0;
	for (const key in input) {
		if (abortEarly && payload.issues.length !== seen) {
			if (aborted(payload, seen)) break;
			seen = payload.issues.length;
		}
		if (keySet.has(key)) continue;
		if (key === "__proto__") {
			if (t === "never") unrecognized.push(key);
			continue;
		}
		if (t === "never") {
			unrecognized.push(key);
			continue;
		}
		const r = _catchall.run({
			value: input[key],
			issues: []
		}, ctx);
		if (r instanceof Promise) proms.push(r.then((r) => handlePropertyResult(r, payload, key, input, optin, optout)));
		else handlePropertyResult(r, payload, key, input, optin, optout);
	}
	if (unrecognized.length) payload.issues.push({
		code: "unrecognized_keys",
		keys: unrecognized,
		input,
		inst,
		continue: true
	});
	if (!proms.length) return payload;
	return Promise.all(proms).then(() => {
		return payload;
	});
}
const $ZodObject = /*@__PURE__*/ $constructor("$ZodObject", (inst, def) => {
	$ZodType.init(inst, def);
	const desc = Object.getOwnPropertyDescriptor(def, "shape");
	const sh = desc?.get ? desc.get.raw : def.shape ?? {};
	if (sh) {
		const get = () => {
			const newSh = { ...sh };
			Object.defineProperty(def, "shape", { value: newSh });
			get.raw = newSh;
			return newSh;
		};
		get.raw = sh;
		Object.defineProperty(def, "shape", { get });
	}
	const _normalized = cached(() => normalizeDef(def));
	defineLazyInternal(inst, "propValues", (zod) => {
		const shape = zod.def.shape;
		const propValues = {};
		for (const key in shape) {
			const field = shape[key]._zod;
			if (field.values) {
				if (!Object.prototype.hasOwnProperty.call(propValues, key)) assignProp(propValues, key, /* @__PURE__ */ new Set());
				for (const v of field.values) propValues[key].add(v);
				if (field.optin !== void 0) propValues[key].add(void 0);
			}
		}
		return propValues;
	});
	const isObject$1 = isObject;
	const catchall = def.catchall;
	let value;
	const memo = globalConfig.memoizer;
	memo?.attach(inst);
	inst._zod.parse = (payload, ctx) => {
		value ?? (value = _normalized.value);
		const input = payload.value;
		if (!isObject$1(input)) {
			payload.issues.push({
				expected: "object",
				code: "invalid_type",
				input,
				inst
			});
			return payload;
		}
		payload.value = memo ? memo.alloc(inst, payload, {}, ctx) : {};
		const proms = [];
		const shape = value.shape;
		const abortEarly = ctx?.abortEarly;
		let seen = payload.issues.length;
		for (const key of value.allKeys) {
			if (abortEarly && payload.issues.length !== seen) {
				if (aborted(payload, seen)) break;
				seen = payload.issues.length;
			}
			if (key === "__proto__") continue;
			const el = shape[key];
			const optin = el._zod.optin;
			const optout = el._zod.optout;
			const r = el._zod.run({
				value: input[key],
				issues: []
			}, ctx);
			if (r instanceof Promise) proms.push(r.then((r) => handlePropertyResult(r, payload, key, input, optin, optout)));
			else handlePropertyResult(r, payload, key, input, optin, optout);
		}
		if (!catchall) return proms.length ? Promise.all(proms).then(() => payload) : payload;
		return handleCatchall(proms, input, payload, ctx, _normalized.value, inst, abortEarly === true);
	};
});
const $ZodObjectJIT = /*@__PURE__*/ $constructor("$ZodObjectJIT", (inst, def) => {
	$ZodObject.init(inst, def);
	const superParse = inst._zod.parse;
	const _normalized = cached(() => normalizeDef(def));
	const memo = globalConfig.memoizer;
	const generateFastpass = (shape) => {
		const normalized = _normalized.value;
		const syms = normalized.symbolKeys;
		const doc = new Doc(["payload", "ctx"], {
			shape,
			inst,
			memo,
			syms
		});
		const parseStr = (k) => `shape[${k}]._zod.run({ value: input[${k}], issues: [] }, ctx)`;
		const prefixStr = (id, k) => `
          let ${id}_ab = false;
          for (let i = 0; i < ${id}.issues.length; i++) {
            const iss = ${id}.issues[i];
            iss.path = iss.path ? [${k}, ...iss.path] : [${k}];
            payload.issues.push(iss);
            if (iss.continue !== true) ${id}_ab = true;
          }
          if (${id}_ab && ctx && ctx.abortEarly) {
            payload.value = newResult;
            return payload;
          }`;
		doc.write(`const input = payload.value;`);
		const ids = Object.create(null);
		let counter = 0;
		for (const key of normalized.allKeys) ids[key] = `key_${counter++}`;
		doc.write(memo ? `const newResult = memo.alloc(inst, payload, {}, ctx);` : `const newResult = {};`);
		for (const key of normalized.allKeys) {
			if (key === "__proto__") continue;
			const id = ids[key];
			const k = typeof key === "symbol" ? `syms[${syms.indexOf(key)}]` : esc(key);
			const isPresent = `${k} in input`;
			const schema = shape[key];
			const optin = schema?._zod?.optin;
			const isOptionalIn = optin !== void 0;
			const isOptionalOut = schema?._zod?.optout === "optional";
			doc.write(`const ${id} = ${parseStr(k)};`);
			if (isOptionalIn && isOptionalOut) {
				const assign = optin === "optional" ? `${id}_present` : `${id}.value !== undefined || ${id}_present`;
				doc.write(`
        const ${id}_present = ${isPresent};
        if (!${id}.issues.length || ${id}_present) {
          if (${id}.issues.length) {${prefixStr(id, k)}
          }

          if (${assign}) {
            newResult[${k}] = ${id}.value;
          }
        }

      `);
			} else if (!isOptionalIn) doc.write(`
        const ${id}_present = ${isPresent};
        if (${id}.issues.length) {${prefixStr(id, k)}
        }
        if (!${id}_present && !${id}.issues.length) {
          payload.issues.push({
            code: "invalid_type",
            expected: "nonoptional",
            input: undefined,
            path: [${k}]
          });
          if (ctx && ctx.abortEarly) {
            payload.value = newResult;
            return payload;
          }
        }

        if (${id}_present) {
          newResult[${k}] = ${id}.value;
        }

      `);
			else {
				doc.write(`
        if (${id}.issues.length) {${prefixStr(id, k)}
        }
      `);
				if (optin === "defaulted") doc.write(`newResult[${k}] = ${id}.value;`);
				else doc.write(`
        if (${id}.value !== undefined || ${isPresent}) {
          newResult[${k}] = ${id}.value;
        }
      `);
			}
		}
		doc.write(`payload.value = newResult;`);
		doc.write(`return payload;`);
		return doc.compile();
	};
	let fastpass;
	const isObject$2 = isObject;
	const jit = !globalConfig.jitless;
	const fastEnabled = jit && allowsEval.value;
	const catchall = def.catchall;
	let value;
	inst._zod.parse = (payload, ctx) => {
		value ?? (value = _normalized.value);
		const input = payload.value;
		if (!isObject$2(input)) {
			payload.issues.push({
				expected: "object",
				code: "invalid_type",
				input,
				inst
			});
			return payload;
		}
		if (jit && fastEnabled && ctx?.async === false && ctx.jitless !== true) {
			if (!fastpass) fastpass = generateFastpass(def.shape);
			payload = fastpass(payload, ctx);
			if (!catchall) return payload;
			return handleCatchall([], input, payload, ctx, value, inst, ctx?.abortEarly === true);
		}
		return superParse(payload, ctx);
	};
});
function handleUnionResults(results, final, inst, ctx) {
	for (const result of results) if (result.issues.length === 0) {
		final.value = result.value;
		return final;
	}
	const nonaborted = results.filter((r) => !aborted(r));
	if (nonaborted.length === 1) {
		final.value = nonaborted[0].value;
		return nonaborted[0];
	}
	final.issues.push({
		code: "invalid_union",
		input: final.value,
		inst,
		errors: results.map((result) => result.issues.map((iss) => finalizeIssue(iss, ctx, config())))
	});
	return final;
}
const $ZodUnion = /*@__PURE__*/ $constructor("$ZodUnion", (inst, def) => {
	$ZodType.init(inst, def);
	defineLazyInternal(inst, "optin", (zod) => zod.def.options.some((o) => o._zod.optin === "defaulted") ? "defaulted" : zod.def.options.some((o) => o._zod.optin !== void 0) ? "optional" : void 0);
	defineLazyInternal(inst, "optout", (zod) => zod.def.options.some((o) => o._zod.optout === "optional") ? "optional" : void 0);
	defineLazyInternal(inst, "values", (zod) => {
		if (zod.def.options.every((o) => o._zod.values)) return new Set(zod.def.options.flatMap((option) => Array.from(option._zod.values)));
	});
	defineLazyInternal(inst, "pattern", (zod) => {
		if (zod.def.options.every((o) => o._zod.pattern)) {
			const patterns = zod.def.options.map((o) => o._zod.pattern);
			return new RegExp(`^(${patterns.map((p) => cleanRegex(p.source)).join("|")})$`);
		}
	});
	const first = def.options.length === 1 ? def.options[0]._zod.run : null;
	inst._zod.parse = (payload, ctx) => {
		if (first) return first(payload, ctx);
		let async = false;
		const results = [];
		for (const option of def.options) {
			const result = option._zod.run({
				value: payload.value,
				issues: []
			}, ctx);
			if (result instanceof Promise) {
				results.push(result);
				async = true;
			} else {
				if (result.issues.length === 0) return result;
				results.push(result);
			}
		}
		if (!async) return handleUnionResults(results, payload, inst, ctx);
		return Promise.all(results).then((results) => {
			return handleUnionResults(results, payload, inst, ctx);
		});
	};
});
const $ZodIntersection = /*@__PURE__*/ $constructor("$ZodIntersection", (inst, def) => {
	$ZodType.init(inst, def);
	inst._zod.parse = (payload, ctx) => {
		const input = payload.value;
		const left = def.left._zod.run({
			value: input,
			issues: []
		}, ctx);
		const right = def.right._zod.run({
			value: input,
			issues: []
		}, ctx);
		if (left instanceof Promise || right instanceof Promise) return Promise.all([left, right]).then(([left, right]) => {
			return handleIntersectionResults(payload, left, right);
		});
		return handleIntersectionResults(payload, left, right);
	};
});
function mergeValues(a, b) {
	if (a === b) return {
		valid: true,
		data: a
	};
	if (a instanceof Date && b instanceof Date && +a === +b) return {
		valid: true,
		data: a
	};
	if (isPlainObject(a) && isPlainObject(b)) {
		const bKeys = Object.keys(b);
		const sharedKeys = Object.keys(a).filter((key) => bKeys.indexOf(key) !== -1);
		const newObj = {
			...a,
			...b
		};
		if (Object.prototype.hasOwnProperty.call(newObj, "__proto__")) delete newObj.__proto__;
		for (const key of sharedKeys) {
			if (key === "__proto__") continue;
			const sharedValue = mergeValues(a[key], b[key]);
			if (!sharedValue.valid) return {
				valid: false,
				mergeErrorPath: [key, ...sharedValue.mergeErrorPath]
			};
			newObj[key] = sharedValue.data;
		}
		return {
			valid: true,
			data: newObj
		};
	}
	if (Array.isArray(a) && Array.isArray(b)) {
		if (a.length !== b.length) return {
			valid: false,
			mergeErrorPath: []
		};
		const newArray = [];
		for (let index = 0; index < a.length; index++) {
			const itemA = a[index];
			const itemB = b[index];
			const sharedValue = mergeValues(itemA, itemB);
			if (!sharedValue.valid) return {
				valid: false,
				mergeErrorPath: [index, ...sharedValue.mergeErrorPath]
			};
			newArray.push(sharedValue.data);
		}
		return {
			valid: true,
			data: newArray
		};
	}
	return {
		valid: false,
		mergeErrorPath: []
	};
}
function handleIntersectionResults(result, left, right) {
	const unrecKeys = /* @__PURE__ */ new Map();
	let unrecIssue;
	const keyIssues = /* @__PURE__ */ new Map();
	const collect = (iss, side) => {
		let keys;
		if (iss.code === "unrecognized_keys" && !iss.path?.length) {
			unrecIssue ?? (unrecIssue = iss);
			keys = iss.keys;
		} else if (iss.code === "invalid_key" && iss.origin === "record" && iss.path?.length === 1) {
			const k = String(iss.path[0]);
			if (!keyIssues.has(k)) keyIssues.set(k, iss);
			keys = [k];
		} else return false;
		for (const k of keys) {
			if (!unrecKeys.has(k)) unrecKeys.set(k, {});
			unrecKeys.get(k)[side] = true;
		}
		return true;
	};
	for (const iss of left.issues) if (!collect(iss, "l")) result.issues.push(iss);
	for (const iss of right.issues) if (!collect(iss, "r")) result.issues.push(iss);
	const bothKeys = [...unrecKeys].filter(([, f]) => f.l && f.r).map(([k]) => k);
	if (bothKeys.length) {
		const aggregated = unrecIssue ? bothKeys.filter((k) => unrecIssue.keys.includes(k)) : [];
		if (aggregated.length) result.issues.push({
			...unrecIssue,
			keys: aggregated
		});
		for (const k of bothKeys) if (!aggregated.includes(k) && keyIssues.has(k)) result.issues.push(keyIssues.get(k));
	}
	const merged = mergeValues(left.value, right.value);
	if (!merged.valid) {
		if (aborted(result)) return result;
		throw new Error(`Unmergable intersection. Error path: ${JSON.stringify(merged.mergeErrorPath)}`);
	}
	result.value = merged.data;
	return result;
}
const $ZodEnum = /*@__PURE__*/ $constructor("$ZodEnum", (inst, def) => {
	$ZodType.init(inst, def);
	const values = getEnumValues(def.entries);
	const valuesSet = new Set(values);
	inst._zod.values = valuesSet;
	defineLazyInternal(inst, "pattern", (zod) => {
		const patternValues = getEnumValues(zod.def.entries).filter((k) => propertyKeyTypes.has(typeof k));
		return new RegExp(patternValues.length ? `^(${patternValues.map((o) => escapeRegex$2(o.toString())).join("|")})$` : "^[^\\s\\S]$");
	});
	inst._zod.parse = (payload, _ctx) => {
		const input = payload.value;
		if (valuesSet.has(input)) return payload;
		payload.issues.push({
			code: "invalid_value",
			values,
			input,
			inst
		});
		return payload;
	};
});
const $ZodLiteral = /*@__PURE__*/ $constructor("$ZodLiteral", (inst, def) => {
	$ZodType.init(inst, def);
	const values = new Set(def.values);
	inst._zod.values = values;
	defineLazyInternal(inst, "pattern", (zod) => {
		const vals = zod.def.values;
		return new RegExp(vals.length ? `^(${vals.map((o) => typeof o === "string" ? escapeRegex$2(o) : o ? escapeRegex$2(o.toString()) : String(o)).join("|")})$` : "^[^\\s\\S]$");
	});
	inst._zod.parse = (payload, _ctx) => {
		const input = payload.value;
		if (values.has(input)) return payload;
		payload.issues.push({
			code: "invalid_value",
			values: def.values,
			input,
			inst
		});
		return payload;
	};
});
const $ZodTransform = /*@__PURE__*/ $constructor("$ZodTransform", (inst, def) => {
	$ZodType.init(inst, def);
	inst._zod.optin = "optional";
	globalConfig.memoizer?.guard(inst);
	inst._zod.parse = (payload, ctx) => {
		if (ctx.direction === "backward") throw new $ZodEncodeError(inst.constructor.name);
		const _out = def.transform(payload.value, payload);
		if (ctx.async) return (_out instanceof Promise ? _out : Promise.resolve(_out)).then((output) => {
			payload.value = output;
			return payload;
		});
		if (_out instanceof Promise) throw new $ZodAsyncError();
		payload.value = _out;
		return payload;
	};
});
function handleOptionalResult(payload, result) {
	payload.value = result.issues.length ? void 0 : result.value;
	return payload;
}
const $ZodOptional = /*@__PURE__*/ $constructor("$ZodOptional", (inst, def) => {
	$ZodType.init(inst, def);
	defineLazyInternal(inst, "optin", (zod) => zod.def.innerType._zod.optin === "defaulted" ? "defaulted" : "optional");
	inst._zod.optout = "optional";
	defineLazyInternal(inst, "values", (zod) => {
		const values = zod.def.innerType._zod.values;
		return values ? /* @__PURE__ */ new Set([...values, void 0]) : void 0;
	});
	defineLazyInternal(inst, "pattern", (zod) => {
		const pattern = zod.def.innerType._zod.pattern;
		return pattern ? new RegExp(`^(${cleanRegex(pattern.source)})?$`) : void 0;
	});
	inst._zod.parse = (payload, ctx) => {
		if (payload.value === void 0) {
			if (def.innerType._zod.optin !== "defaulted") return payload;
			const result = def.innerType._zod.run({
				value: payload.value,
				issues: []
			}, ctx);
			if (result instanceof Promise) return result.then((result) => handleOptionalResult(payload, result));
			return handleOptionalResult(payload, result);
		}
		return def.innerType._zod.run(payload, ctx);
	};
});
const $ZodExactOptional = /*@__PURE__*/ $constructor("$ZodExactOptional", (inst, def) => {
	$ZodOptional.init(inst, def);
	defineLazyInternal(inst, "values", (zod) => zod.def.innerType._zod.values);
	defineLazyInternal(inst, "pattern", (zod) => zod.def.innerType._zod.pattern);
	inst._zod.parse = (payload, ctx) => {
		return def.innerType._zod.run(payload, ctx);
	};
});
const $ZodNullable = /*@__PURE__*/ $constructor("$ZodNullable", (inst, def) => {
	$ZodType.init(inst, def);
	defineLazyInternal(inst, "optin", (zod) => zod.def.innerType._zod.optin);
	defineLazyInternal(inst, "optout", (zod) => zod.def.innerType._zod.optout);
	defineLazyInternal(inst, "pattern", (zod) => {
		const pattern = zod.def.innerType._zod.pattern;
		return pattern ? new RegExp(`^(${cleanRegex(pattern.source)}|null)$`) : void 0;
	});
	defineLazyInternal(inst, "values", (zod) => {
		return zod.def.innerType._zod.values ? /* @__PURE__ */ new Set([...zod.def.innerType._zod.values, null]) : void 0;
	});
	inst._zod.parse = (payload, ctx) => {
		if (payload.value === null) return payload;
		return def.innerType._zod.run(payload, ctx);
	};
});
const $ZodDefault = /*@__PURE__*/ $constructor("$ZodDefault", (inst, def) => {
	$ZodType.init(inst, def);
	inst._zod.optin = "defaulted";
	defineLazyInternal(inst, "values", (zod) => zod.def.innerType._zod.values);
	inst._zod.parse = (payload, ctx) => {
		if (ctx.direction === "backward") return def.innerType._zod.run(payload, ctx);
		if (payload.value === void 0) {
			payload.value = def.defaultValue;
			/**
			* $ZodDefault returns the default value immediately in forward direction.
			* It doesn't pass the default value into the validator ("prefault"). There's no reason to pass the default value through validation. The validity of the default is enforced by TypeScript statically. Otherwise, it's the responsibility of the user to ensure the default is valid. In the case of pipes with divergent in/out types, you can specify the default on the `in` schema of your ZodPipe to set a "prefault" for the pipe.   */
			return payload;
		}
		const result = def.innerType._zod.run(payload, ctx);
		if (result instanceof Promise) return result.then((result) => handleDefaultResult(result, def));
		return handleDefaultResult(result, def);
	};
});
function handleDefaultResult(payload, def) {
	if (payload.value === void 0) payload.value = def.defaultValue;
	return payload;
}
const $ZodPrefault = /*@__PURE__*/ $constructor("$ZodPrefault", (inst, def) => {
	$ZodType.init(inst, def);
	inst._zod.optin = "defaulted";
	defineLazyInternal(inst, "values", (zod) => zod.def.innerType._zod.values);
	inst._zod.parse = (payload, ctx) => {
		if (ctx.direction === "backward") return def.innerType._zod.run(payload, ctx);
		if (payload.value === void 0) payload.value = def.defaultValue;
		return def.innerType._zod.run(payload, ctx);
	};
});
const $ZodNonOptional = /*@__PURE__*/ $constructor("$ZodNonOptional", (inst, def) => {
	$ZodType.init(inst, def);
	defineLazyInternal(inst, "values", (zod) => {
		const v = zod.def.innerType._zod.values;
		return v ? new Set([...v].filter((x) => x !== void 0)) : void 0;
	});
	inst._zod.parse = (payload, ctx) => {
		const result = def.innerType._zod.run(payload, ctx);
		if (result instanceof Promise) return result.then((result) => handleNonOptionalResult(result, inst));
		return handleNonOptionalResult(result, inst);
	};
});
function handleNonOptionalResult(payload, inst) {
	if (!payload.issues.length && payload.value === void 0) payload.issues.push({
		code: "invalid_type",
		expected: "nonoptional",
		input: payload.value,
		inst
	});
	return payload;
}
function handleCatchResult(payload, result, def, ctx) {
	if (!result.issues.length) {
		payload.value = result.value;
		if (result.memo) payload.memo = true;
		return payload;
	}
	payload.value = def.catchValue({
		...result,
		value: payload.value,
		error: { issues: result.issues.map((iss) => finalizeIssue(iss, ctx, config())) },
		input: payload.value
	});
	return payload;
}
const $ZodCatch = /*@__PURE__*/ $constructor("$ZodCatch", (inst, def) => {
	$ZodType.init(inst, def);
	defineLazyInternal(inst, "optin", (zod) => zod.def.innerType._zod.optin === "defaulted" ? "defaulted" : "optional");
	defineLazyInternal(inst, "optout", (zod) => zod.def.innerType._zod.optout);
	defineLazyInternal(inst, "values", (zod) => zod.def.innerType._zod.values);
	inst._zod.parse = (payload, ctx) => {
		if (ctx.direction === "backward") return def.innerType._zod.run(payload, ctx);
		const result = def.innerType._zod.run({
			value: payload.value,
			issues: []
		}, ctx);
		if (result instanceof Promise) return result.then((result) => handleCatchResult(payload, result, def, ctx));
		return handleCatchResult(payload, result, def, ctx);
	};
});
const $ZodPipe = /*@__PURE__*/ $constructor("$ZodPipe", (inst, def) => {
	$ZodType.init(inst, def);
	defineLazyInternal(inst, "values", (zod) => zod.def.in._zod.values);
	defineLazyInternal(inst, "optin", (zod) => zod.def.in._zod.optin);
	defineLazyInternal(inst, "optout", (zod) => zod.def.out._zod.optout);
	defineLazyInternal(inst, "propValues", (zod) => zod.def.in._zod.propValues);
	inst._zod.parse = (payload, ctx) => {
		if (ctx.direction === "backward") {
			const right = def.out._zod.run(payload, ctx);
			if (right instanceof Promise) return right.then((right) => handlePipeResult(right, def.in, ctx));
			return handlePipeResult(right, def.in, ctx);
		}
		const left = def.in._zod.run(payload, ctx);
		if (left instanceof Promise) return left.then((left) => handlePipeResult(left, def.out, ctx));
		return handlePipeResult(left, def.out, ctx);
	};
});
function handlePipeResult(left, next, ctx) {
	if (left.issues.some((iss) => iss.code !== "unrecognized_keys")) {
		left.aborted = true;
		return left;
	}
	return next._zod.run({
		value: left.value,
		issues: left.issues
	}, ctx);
}
const $ZodReadonly = /*@__PURE__*/ $constructor("$ZodReadonly", (inst, def) => {
	$ZodType.init(inst, def);
	defineLazyInternal(inst, "propValues", (zod) => zod.def.innerType._zod.propValues);
	defineLazyInternal(inst, "values", (zod) => zod.def.innerType._zod.values);
	defineLazyInternal(inst, "optin", (zod) => zod.def.innerType?._zod?.optin);
	defineLazyInternal(inst, "optout", (zod) => zod.def.innerType?._zod?.optout);
	inst._zod.parse = (payload, ctx) => {
		if (ctx.direction === "backward") return def.innerType._zod.run(payload, ctx);
		const result = def.innerType._zod.run(payload, ctx);
		if (result instanceof Promise) return result.then(handleReadonlyResult);
		return handleReadonlyResult(result);
	};
});
function handleReadonlyResult(payload) {
	if (!payload.memo) payload.value = Object.freeze(payload.value);
	return payload;
}
const $ZodCustom = /*@__PURE__*/ $constructor("$ZodCustom", (inst, def) => {
	$ZodCheck.init(inst, def);
	$ZodType.init(inst, def);
	inst._zod.parse = (payload, _) => {
		return payload;
	};
	inst._zod.check = (payload) => {
		const input = payload.value;
		const r = def.fn(input);
		if (r instanceof Promise) return r.then((r) => handleRefineResult(r, payload, input, inst));
		handleRefineResult(r, payload, input, inst);
	};
});
function handleRefineResult(result, payload, input, inst) {
	if (!result) {
		const _iss = {
			code: "custom",
			input,
			inst,
			path: [...inst._zod.def.path ?? []],
			continue: !inst._zod.def.abort
		};
		if (inst._zod.def.params) _iss.params = inst._zod.def.params;
		payload.issues.push(issue(_iss));
	}
}
// node_modules/zod/v4/core/memoizer.js
var $ZodCyclicError = class extends Error {
	constructor() {
		super(`Cannot parse a reference cycle that closes through a transform`);
		this.name = "ZodCyclicError";
	}
};
/** Keyed off the context object every schema in one parse call already shares. */
const STATE = "~memo";
const NO_ISSUES = [];
function isRef(value) {
	return value !== null && typeof value === "object";
}
function cloneIssues(issues) {
	return issues.map((iss) => iss.path ? {
		...iss,
		path: iss.path.slice()
	} : { ...iss });
}
const recursive = /*@__PURE__*/ new WeakMap();
/** What the walk established, in order of certainty: ordered so the strongest answer among children wins. */
const NONE = 0;
const ASSUMED = 1;
const PROVEN = 2;
/** Whether this schema's subtree contains a cycle, so one parse can re-enter it. */
function isRecursive(inst, stack, resolve) {
	const cached = recursive.get(inst);
	if (cached !== void 0) return cached ? PROVEN : NONE;
	if (stack.has(inst)) return PROVEN;
	stack.add(inst);
	let result = NONE;
	const check = (child) => {
		if (result !== PROVEN && child?._zod) {
			const answer = isRecursive(child, stack, resolve);
			if (answer > result) result = answer;
		}
	};
	const shape = (sh, spread) => {
		let answer = NONE;
		for (const key of Reflect.ownKeys(sh)) {
			const desc = Object.getOwnPropertyDescriptor(sh, key);
			if (spread && !desc.enumerable) continue;
			const child = desc.get ? ASSUMED : desc.value?._zod ? isRecursive(desc.value, stack, resolve) : NONE;
			if (child > answer) answer = child;
		}
		return answer;
	};
	const merge = (answer) => {
		if (answer > result) result = answer;
	};
	const def = inst._zod.def;
	switch (def.type) {
		case "object": {
			const raw = rawShape(def);
			merge(raw ? shape(raw, true) : ASSUMED);
			check(def.catchall);
			break;
		}
		case "array":
			check(def.element);
			break;
		case "tuple":
			for (const el of def.items) check(el);
			check(def.rest);
			break;
		case "record":
		case "map":
			check(def.keyType);
			check(def.valueType);
			break;
		case "set":
			check(def.valueType);
			break;
		case "union":
			for (const el of def.options) check(el);
			break;
		case "intersection":
			check(def.left);
			check(def.right);
			break;
		case "optional":
		case "nullable":
		case "default":
		case "prefault":
		case "catch":
		case "readonly":
		case "nonoptional":
		case "promise":
		case "success":
			check(def.innerType);
			break;
		case "pipe":
			check(def.in);
			check(def.out);
			break;
		case "function":
			check(def.input);
			check(def.output);
			break;
		case "lazy": {
			const inner = def._cachedInner ?? (resolve ? inst._zod.innerType : void 0);
			merge(inner ? isRecursive(inner, stack, false) : ASSUMED);
			break;
		}
		case "template_literal":
		case "string":
		case "number":
		case "int":
		case "boolean":
		case "bigint":
		case "symbol":
		case "undefined":
		case "null":
		case "void":
		case "never":
		case "any":
		case "unknown":
		case "date":
		case "nan":
		case "enum":
		case "literal":
		case "file":
		case "transform":
		case "custom": break;
		default: for (const key in def) {
			const desc = Object.getOwnPropertyDescriptor(def, key);
			if (!desc || desc.get) continue;
			const value = desc.value;
			if (!value || typeof value !== "object") continue;
			if (value._zod) check(value);
			else if (Array.isArray(value)) for (const el of value) check(el);
		}
	}
	stack.delete(inst);
	return settle(inst, result);
}
/** An assumed answer must not outlive the resolution that settles it, so only a certain one is cached. */
function settle(inst, answer) {
	if (answer !== ASSUMED) recursive.set(inst, answer === PROVEN);
	return answer;
}
function bucketFor(state, inst) {
	let bucket = state.buckets.get(inst);
	if (!bucket) {
		bucket = /* @__PURE__ */ new WeakMap();
		state.buckets.set(inst, bucket);
	}
	return bucket;
}
let handoff;
const open = [];
const memo = {
	alloc(_inst, payload, empty) {
		const bucket = handoff;
		if (!bucket) return empty;
		handoff = void 0;
		const entry = {
			value: empty,
			issues: null
		};
		bucket.set(payload.value, entry);
		open.push(entry);
		return empty;
	},
	guard(inst) {
		var _a;
		(_a = inst._zod).deferred ?? (_a.deferred = []);
		inst._zod.deferred.push(() => {
			const base = inst._zod.parse;
			const wrapped = (payload, ctx) => {
				if (ctx.direction !== "backward" && isBackEdge(ctx, payload.value)) throw new $ZodCyclicError();
				return base(payload, ctx);
			};
			inst._zod.parse = wrapped;
			if (inst._zod.run === base) inst._zod.run = wrapped;
		});
	},
	attach(inst) {
		var _a;
		let isRecursiveInst;
		let rechecked = false;
		let lastCtx;
		let lastBucket;
		(_a = inst._zod).deferred ?? (_a.deferred = []);
		inst._zod.deferred.push(() => {
			const base = inst._zod.parse;
			const wrapped = (payload, ctx) => {
				if (isRecursiveInst === void 0) {
					const walked = isRecursive(inst, /* @__PURE__ */ new Set(), false);
					if (walked === NONE) {
						inst._zod.parse = base;
						if (inst._zod.run === wrapped) inst._zod.run = base;
						return base(payload, ctx);
					}
					if (walked === PROVEN || rechecked) isRecursiveInst = true;
					else rechecked = true;
				}
				const input = payload.value;
				if (!isRef(input)) return base(payload, ctx);
				let state = ctx[STATE];
				if (!state) {
					state = {
						buckets: /* @__PURE__ */ new WeakMap(),
						backEdges: void 0
					};
					ctx[STATE] = state;
				}
				let bucket;
				if (lastCtx === ctx) bucket = lastBucket;
				else {
					bucket = bucketFor(state, inst);
					lastCtx = ctx;
					lastBucket = bucket;
				}
				const hit = bucket.get(input);
				if (hit) {
					payload.value = hit.value;
					if (hit.issues) {
						if (hit.issues.length) payload.issues.push(...cloneIssues(hit.issues));
					} else {
						payload.memo = true;
						state.backEdges ?? (state.backEdges = /* @__PURE__ */ new WeakSet());
						state.backEdges.add(hit.value);
					}
					return payload;
				}
				handoff = bucket;
				const depth = open.length;
				const result = base(payload, ctx);
				handoff = void 0;
				const entry = open.length > depth ? open.pop() : void 0;
				if (result instanceof Promise) return result.then((r) => {
					if (entry) entry.issues = r.issues.length ? cloneIssues(r.issues) : NO_ISSUES;
					return r;
				});
				if (entry) entry.issues = result.issues.length ? cloneIssues(result.issues) : NO_ISSUES;
				return result;
			};
			inst._zod.parse = wrapped;
			if (inst._zod.run === base) inst._zod.run = wrapped;
		});
	}
};
/** The memoizer that gives containers cycle support. `zod` installs it by default; `zod/mini` opts in with `config({ memoizer: memoizer() })`. */
function memoizer() {
	return memo;
}
/** Whether this value is a node a back-edge resolved to before it finished. */
function isBackEdge(ctx, value) {
	const backEdges = ctx[STATE]?.backEdges;
	return backEdges !== void 0 && isRef(value) && backEdges.has(value);
}
// node_modules/zod/v4/locales/en.js
const error = () => {
	const Sizable = {
		string: {
			unit: "characters",
			verb: "to have"
		},
		file: {
			unit: "bytes",
			verb: "to have"
		},
		array: {
			unit: "items",
			verb: "to have"
		},
		set: {
			unit: "items",
			verb: "to have"
		},
		map: {
			unit: "entries",
			verb: "to have"
		}
	};
	function getSizing(origin) {
		return Sizable[origin] ?? null;
	}
	const FormatDictionary = {
		regex: "input",
		email: "email address",
		url: "URL",
		emoji: "emoji",
		uuid: "UUID",
		uuidv4: "UUIDv4",
		uuidv6: "UUIDv6",
		nanoid: "nanoid",
		guid: "GUID",
		cuid: "cuid",
		cuid2: "cuid2",
		ulid: "ULID",
		xid: "XID",
		ksuid: "KSUID",
		datetime: "ISO datetime",
		date: "ISO date",
		time: "ISO time",
		duration: "ISO duration",
		ipv4: "IPv4 address",
		ipv6: "IPv6 address",
		mac: "MAC address",
		cidrv4: "IPv4 range",
		cidrv6: "IPv6 range",
		base64: "base64-encoded string",
		base64url: "base64url-encoded string",
		json_string: "JSON string",
		e164: "E.164 number",
		currency_code: "currency code",
		credit_card: "credit card number",
		iban: "IBAN",
		jwt: "JWT",
		template_literal: "input"
	};
	const TypeDictionary = { nan: "NaN" };
	function getTypeName(type, input) {
		if (type === "number" && typeof input === "number" && !Number.isFinite(input)) return String(input);
		return TypeDictionary[type] ?? type;
	}
	return (issue) => {
		switch (issue.code) {
			case "invalid_type": return `Invalid input: expected ${getTypeName(issue.expected)}, received ${getTypeName(parsedType(issue.input), issue.input)}`;
			case "invalid_value":
				if (issue.values.length === 1) return `Invalid input: expected ${stringifyPrimitive(issue.values[0])}`;
				return `Invalid option: expected one of ${joinValues(issue.values, "|")}`;
			case "too_big": {
				const adj = issue.exact ? "exactly " : issue.inclusive ? "<=" : "<";
				const sizing = getSizing(issue.origin);
				if (sizing) return `Too big: expected ${issue.origin ?? "value"} to have ${adj}${issue.maximum.toString()} ${sizing.unit ?? "elements"}`;
				return `Too big: expected ${issue.origin ?? "value"} to be ${adj}${issue.maximum.toString()}`;
			}
			case "too_small": {
				const adj = issue.exact ? "exactly " : issue.inclusive ? ">=" : ">";
				const sizing = getSizing(issue.origin);
				if (sizing) return `Too small: expected ${issue.origin} to have ${adj}${issue.minimum.toString()} ${sizing.unit}`;
				return `Too small: expected ${issue.origin} to be ${adj}${issue.minimum.toString()}`;
			}
			case "invalid_format": {
				const _issue = issue;
				if (_issue.format === "starts_with") return `Invalid string: must start with "${_issue.prefix}"`;
				if (_issue.format === "ends_with") return `Invalid string: must end with "${_issue.suffix}"`;
				if (_issue.format === "includes") return `Invalid string: must include "${_issue.includes}"`;
				if (_issue.format === "regex") return `Invalid string: must match pattern ${_issue.pattern}`;
				return `Invalid ${FormatDictionary[_issue.format] ?? issue.format}`;
			}
			case "not_multiple_of": return `Invalid number: must be a multiple of ${issue.divisor}`;
			case "unrecognized_keys": return `Unrecognized key${issue.keys.length > 1 ? "s" : ""}: ${joinValues(issue.keys, ", ")}`;
			case "invalid_key": return `Invalid key in ${issue.origin}`;
			case "invalid_union":
				if (issue.options && Array.isArray(issue.options) && issue.options.length > 0) return `Invalid discriminator value. Expected ${issue.options.map((o) => `'${o}'`).join(" | ")}`;
				if (issue.inclusive === false) return "Invalid input: more than one option matched";
				return "Invalid input";
			case "invalid_element": return `Invalid value in ${issue.origin}`;
			default: return `Invalid input`;
		}
	};
};
function en_default() {
	return { localeError: error() };
}
// node_modules/zod/v4/core/registries.js
var _a;
var $ZodRegistry = class {
	constructor() {
		this._map = /* @__PURE__ */ new WeakMap();
		this._idmap = /* @__PURE__ */ new Map();
	}
	add(schema, ..._meta) {
		const meta = _meta[0];
		this._map.set(schema, meta);
		if (meta && typeof meta === "object" && "id" in meta) this._idmap.set(meta.id, schema);
		return this;
	}
	clear() {
		this._map = /* @__PURE__ */ new WeakMap();
		this._idmap = /* @__PURE__ */ new Map();
		return this;
	}
	remove(schema) {
		const meta = this._map.get(schema);
		if (meta && typeof meta === "object" && "id" in meta) this._idmap.delete(meta.id);
		this._map.delete(schema);
		return this;
	}
	get(schema) {
		const p = schema._zod.parent;
		if (p) {
			const pm = { ...this.get(p) ?? {} };
			delete pm.id;
			const f = {
				...pm,
				...this._map.get(schema)
			};
			return Object.keys(f).length ? f : void 0;
		}
		return this._map.get(schema);
	}
	has(schema) {
		return this._map.has(schema);
	}
};
function registry() {
	return new $ZodRegistry();
}
(_a = globalThis).__zod_globalRegistry ?? (_a.__zod_globalRegistry = registry());
const globalRegistry = globalThis.__zod_globalRegistry;
// node_modules/zod/v4/core/api.js
function snapshotChecks(def) {
	if (def.checks) def.checks = [...def.checks];
	return def;
}
// @__NO_SIDE_EFFECTS__
function _string(Class, params) {
	return new Class(snapshotChecks({
		type: "string",
		...normalizeParams(params)
	}));
}
// @__NO_SIDE_EFFECTS__
function _email(Class, params) {
	return new Class({
		type: "string",
		format: "email",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
// @__NO_SIDE_EFFECTS__
function _guid(Class, params) {
	return new Class({
		type: "string",
		format: "guid",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
// @__NO_SIDE_EFFECTS__
function _uuid(Class, params) {
	return new Class({
		type: "string",
		format: "uuid",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
// @__NO_SIDE_EFFECTS__
function _uuidv4(Class, params) {
	return new Class({
		type: "string",
		format: "uuid",
		check: "string_format",
		abort: false,
		version: "v4",
		...normalizeParams(params)
	});
}
// @__NO_SIDE_EFFECTS__
function _uuidv6(Class, params) {
	return new Class({
		type: "string",
		format: "uuid",
		check: "string_format",
		abort: false,
		version: "v6",
		...normalizeParams(params)
	});
}
// @__NO_SIDE_EFFECTS__
function _uuidv7(Class, params) {
	return new Class({
		type: "string",
		format: "uuid",
		check: "string_format",
		abort: false,
		version: "v7",
		...normalizeParams(params)
	});
}
// @__NO_SIDE_EFFECTS__
function _url(Class, params) {
	return new Class({
		type: "string",
		format: "url",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
// @__NO_SIDE_EFFECTS__
function _emoji(Class, params) {
	return new Class({
		type: "string",
		format: "emoji",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
// @__NO_SIDE_EFFECTS__
function _nanoid(Class, params) {
	return new Class({
		type: "string",
		format: "nanoid",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
/**
* @deprecated CUID v1 is deprecated by its authors due to information leakage
* (timestamps embedded in the id). Use {@link _cuid2} instead.
* See https://github.com/paralleldrive/cuid.
*/
// @__NO_SIDE_EFFECTS__
function _cuid(Class, params) {
	return new Class({
		type: "string",
		format: "cuid",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
// @__NO_SIDE_EFFECTS__
function _cuid2(Class, params) {
	return new Class({
		type: "string",
		format: "cuid2",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
// @__NO_SIDE_EFFECTS__
function _ulid(Class, params) {
	return new Class({
		type: "string",
		format: "ulid",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
// @__NO_SIDE_EFFECTS__
function _xid(Class, params) {
	return new Class({
		type: "string",
		format: "xid",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
// @__NO_SIDE_EFFECTS__
function _ksuid(Class, params) {
	return new Class({
		type: "string",
		format: "ksuid",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
// @__NO_SIDE_EFFECTS__
function _ipv4(Class, params) {
	return new Class({
		type: "string",
		format: "ipv4",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
// @__NO_SIDE_EFFECTS__
function _ipv6(Class, params) {
	return new Class({
		type: "string",
		format: "ipv6",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
// @__NO_SIDE_EFFECTS__
function _cidrv4(Class, params) {
	return new Class({
		type: "string",
		format: "cidrv4",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
// @__NO_SIDE_EFFECTS__
function _cidrv6(Class, params) {
	return new Class({
		type: "string",
		format: "cidrv6",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
// @__NO_SIDE_EFFECTS__
function _base64(Class, params) {
	return new Class({
		type: "string",
		format: "base64",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
// @__NO_SIDE_EFFECTS__
function _base64url(Class, params) {
	return new Class({
		type: "string",
		format: "base64url",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
// @__NO_SIDE_EFFECTS__
function _e164(Class, params) {
	return new Class({
		type: "string",
		format: "e164",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
// @__NO_SIDE_EFFECTS__
function _jwt(Class, params) {
	return new Class({
		type: "string",
		format: "jwt",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
// @__NO_SIDE_EFFECTS__
function _isoDateTime(Class, params) {
	return new Class({
		type: "string",
		format: "datetime",
		check: "string_format",
		offset: false,
		local: false,
		precision: null,
		...normalizeParams(params)
	});
}
// @__NO_SIDE_EFFECTS__
function _isoDate(Class, params) {
	return new Class({
		type: "string",
		format: "date",
		check: "string_format",
		...normalizeParams(params)
	});
}
// @__NO_SIDE_EFFECTS__
function _isoTime(Class, params) {
	return new Class({
		type: "string",
		format: "time",
		check: "string_format",
		precision: null,
		...normalizeParams(params)
	});
}
// @__NO_SIDE_EFFECTS__
function _isoDuration(Class, params) {
	return new Class({
		type: "string",
		format: "duration",
		check: "string_format",
		...normalizeParams(params)
	});
}
// @__NO_SIDE_EFFECTS__
function _number(Class, params) {
	return new Class(snapshotChecks({
		type: "number",
		checks: [],
		...normalizeParams(params)
	}));
}
// @__NO_SIDE_EFFECTS__
function _int(Class, params) {
	return new Class({
		type: "number",
		check: "number_format",
		abort: false,
		format: "safeint",
		...normalizeParams(params)
	});
}
// @__NO_SIDE_EFFECTS__
function _boolean(Class, params) {
	return new Class({
		type: "boolean",
		...normalizeParams(params)
	});
}
// @__NO_SIDE_EFFECTS__
function _unknown(Class) {
	return new Class({ type: "unknown" });
}
// @__NO_SIDE_EFFECTS__
function _never(Class, params) {
	return new Class({
		type: "never",
		...normalizeParams(params)
	});
}
// @__NO_SIDE_EFFECTS__
function _lt(value, params) {
	return new $ZodCheckLessThan({
		check: "less_than",
		...normalizeParams(params),
		value,
		inclusive: false
	});
}
// @__NO_SIDE_EFFECTS__
function _lte(value, params) {
	return new $ZodCheckLessThan({
		check: "less_than",
		...normalizeParams(params),
		value,
		inclusive: true
	});
}
// @__NO_SIDE_EFFECTS__
function _gt(value, params) {
	return new $ZodCheckGreaterThan({
		check: "greater_than",
		...normalizeParams(params),
		value,
		inclusive: false
	});
}
// @__NO_SIDE_EFFECTS__
function _gte(value, params) {
	return new $ZodCheckGreaterThan({
		check: "greater_than",
		...normalizeParams(params),
		value,
		inclusive: true
	});
}
// @__NO_SIDE_EFFECTS__
function _multipleOf(value, params) {
	return new $ZodCheckMultipleOf({
		check: "multiple_of",
		...normalizeParams(params),
		value
	});
}
// @__NO_SIDE_EFFECTS__
function _maxLength(maximum, params) {
	return new $ZodCheckMaxLength({
		check: "max_length",
		...normalizeParams(params),
		maximum
	});
}
// @__NO_SIDE_EFFECTS__
function _minLength(minimum, params) {
	return new $ZodCheckMinLength({
		check: "min_length",
		...normalizeParams(params),
		minimum
	});
}
// @__NO_SIDE_EFFECTS__
function _length(length, params) {
	return new $ZodCheckLengthEquals({
		check: "length_equals",
		...normalizeParams(params),
		length
	});
}
// @__NO_SIDE_EFFECTS__
function _regex(pattern, params) {
	return new $ZodCheckRegex({
		check: "string_format",
		format: "regex",
		...normalizeParams(params),
		pattern
	});
}
// @__NO_SIDE_EFFECTS__
function _lowercase(params) {
	return new $ZodCheckLowerCase({
		check: "string_format",
		format: "lowercase",
		...normalizeParams(params)
	});
}
// @__NO_SIDE_EFFECTS__
function _uppercase(params) {
	return new $ZodCheckUpperCase({
		check: "string_format",
		format: "uppercase",
		...normalizeParams(params)
	});
}
// @__NO_SIDE_EFFECTS__
function _includes(includes, params) {
	return new $ZodCheckIncludes({
		check: "string_format",
		format: "includes",
		...normalizeParams(params),
		includes
	});
}
// @__NO_SIDE_EFFECTS__
function _startsWith(prefix, params) {
	return new $ZodCheckStartsWith({
		check: "string_format",
		format: "starts_with",
		...normalizeParams(params),
		prefix
	});
}
// @__NO_SIDE_EFFECTS__
function _endsWith(suffix, params) {
	return new $ZodCheckEndsWith({
		check: "string_format",
		format: "ends_with",
		...normalizeParams(params),
		suffix
	});
}
// @__NO_SIDE_EFFECTS__
function _overwrite(tx) {
	return new $ZodCheckOverwrite({
		check: "overwrite",
		tx
	});
}
// @__NO_SIDE_EFFECTS__
function _normalize(form) {
	return /* @__PURE__ */ _overwrite((input) => input.normalize(form));
}
// @__NO_SIDE_EFFECTS__
function _trim() {
	return /* @__PURE__ */ _overwrite((input) => input.trim());
}
// @__NO_SIDE_EFFECTS__
function _toLowerCase() {
	return /* @__PURE__ */ _overwrite((input) => input.toLowerCase());
}
// @__NO_SIDE_EFFECTS__
function _toUpperCase() {
	return /* @__PURE__ */ _overwrite((input) => input.toUpperCase());
}
// @__NO_SIDE_EFFECTS__
function _slugify() {
	return /* @__PURE__ */ _overwrite((input) => slugify(input));
}
// @__NO_SIDE_EFFECTS__
function _array(Class, element, params) {
	return new Class({
		type: "array",
		element,
		...normalizeParams(params)
	});
}
// @__NO_SIDE_EFFECTS__
function _refine(Class, fn, _params) {
	return new Class({
		type: "custom",
		check: "custom",
		fn,
		...normalizeParams(_params)
	});
}
// @__NO_SIDE_EFFECTS__
function _superRefine(fn, params) {
	const ch = /* @__PURE__ */ _check((payload) => {
		payload.addIssue = (issue$2) => {
			if (typeof issue$2 === "string") payload.issues.push(issue(issue$2, payload.value, ch._zod.def));
			else {
				const _issue = issue$2;
				if (_issue.fatal) _issue.continue = false;
				_issue.code ?? (_issue.code = "custom");
				if (!("input" in _issue)) _issue.input = payload.value;
				_issue.inst ?? (_issue.inst = ch);
				_issue.continue ?? (_issue.continue = !ch._zod.def.abort);
				payload.issues.push(issue(_issue));
			}
		};
		return fn(payload.value, payload);
	}, params);
	return ch;
}
// @__NO_SIDE_EFFECTS__
function _check(fn, params) {
	const ch = new $ZodCheck({
		check: "custom",
		...normalizeParams(params)
	});
	ch._zod.check = fn;
	return ch;
}
// node_modules/zod/v4/core/to-json-schema.js
function assignProps(target, ...sources) {
	for (const source of sources) for (const key of Reflect.ownKeys(source)) if (Object.prototype.propertyIsEnumerable.call(source, key)) assignProp(target, key, source[key]);
	return target;
}
function initializeContext(params) {
	let target = params?.target ?? "draft-2020-12";
	if (target === "draft-4") target = "draft-04";
	if (target === "draft-7") target = "draft-07";
	return {
		processors: params.processors ?? {},
		metadataRegistry: params?.metadata ?? globalRegistry,
		target,
		unrepresentable: params?.unrepresentable ?? "throw",
		override: params?.override ?? (() => {}),
		io: params?.io ?? "output",
		counter: 0,
		seen: /* @__PURE__ */ new Map(),
		sharedDefsExtractedFor: void 0,
		sharedEmitDoneFor: void 0,
		cycles: params?.cycles ?? "ref",
		reused: params?.reused ?? "inline",
		intersections: [],
		deferred: [],
		external: params?.external ?? void 0
	};
}
/**
* Applies the `unrepresentable` setting at a site that has no JSON Schema equivalent. Throws
* `message` unless the setting (or the handler's return value) says otherwise. Returns `true` if a
* custom JSON Schema was written into `json`, in which case the caller must not write its own.
*/
function handleUnrepresentable(schema, ctx, json, params, message) {
	const result = typeof ctx.unrepresentable === "function" ? ctx.unrepresentable({
		zodSchema: schema,
		path: params.path,
		message
	}) : ctx.unrepresentable;
	if (result === "any") return false;
	if (result === void 0 || result === "throw") throw new Error(message);
	Object.assign(json, result);
	return true;
}
function processSchema(schema, ctx, _params = {
	path: [],
	schemaPath: []
}) {
	var _a;
	const def = schema._zod.def;
	const seen = ctx.seen.get(schema);
	if (seen) {
		seen.count++;
		if (_params.schemaPath.includes(schema)) seen.cycle = _params.path;
		return seen.schema;
	}
	const result = {
		schema: {},
		count: 1,
		cycle: void 0,
		path: _params.path
	};
	ctx.seen.set(schema, result);
	ctx.sharedDefsExtractedFor = void 0;
	ctx.sharedEmitDoneFor = void 0;
	const overrideSchema = schema._zod.toJSONSchema?.();
	if (overrideSchema) result.schema = overrideSchema;
	else {
		const params = {
			..._params,
			schemaPath: [..._params.schemaPath, schema],
			path: _params.path
		};
		if (schema._zod.processJSONSchema) schema._zod.processJSONSchema(ctx, result.schema, params);
		else {
			const _json = result.schema;
			const processor = ctx.processors[def.type];
			if (!processor) throw new Error(`[toJSONSchema]: Non-representable type encountered: ${def.type}`);
			processor(schema, ctx, _json, params);
		}
		const parent = schema._zod.parent;
		if (parent) {
			if (!result.ref) result.ref = parent;
			processSchema(parent, ctx, params);
			ctx.seen.get(parent).isParent = true;
		}
	}
	const meta = ctx.metadataRegistry.get(schema);
	if (meta) assignProps(result.schema, meta);
	if (ctx.io === "input" && isTransforming(schema)) {
		delete result.schema.examples;
		delete result.schema.default;
	}
	if (ctx.io === "input" && "_prefault" in result.schema) (_a = result.schema).default ?? (_a.default = result.schema._prefault);
	delete result.schema._prefault;
	return ctx.seen.get(schema).schema;
}
function encodeJSONPointerSegment(segment) {
	return segment.replace(/~/g, "~0").replace(/\//g, "~1");
}
function extractDefs(ctx, schema) {
	const root = ctx.seen.get(schema);
	if (!root) throw new Error("Unprocessed schema. This is a bug in Zod.");
	if (ctx.external && ctx.sharedDefsExtractedFor === ctx.external) return;
	const idToSchema = /* @__PURE__ */ new Map();
	for (const entry of ctx.seen.entries()) {
		const id = ctx.metadataRegistry.get(entry[0])?.id;
		if (id) {
			const existing = idToSchema.get(id);
			if (existing && existing !== entry[0]) throw new Error(`Duplicate schema id "${id}" detected during JSON Schema conversion. Two different schemas cannot share the same id when converted together.`);
			idToSchema.set(id, entry[0]);
		}
	}
	const makeURI = (entry) => {
		const defsSegment = ctx.target === "draft-2020-12" ? "$defs" : "definitions";
		if (ctx.external) {
			const externalId = ctx.external.registry.get(entry[0])?.id;
			const uriGenerator = ctx.external.uri ?? ((id) => id);
			if (externalId) return { ref: uriGenerator(externalId) };
			const id = entry[1].defId ?? entry[1].schema.id ?? `schema${ctx.counter++}`;
			entry[1].defId = id;
			return {
				defId: id,
				ref: `${uriGenerator("__shared")}#/${defsSegment}/${encodeJSONPointerSegment(id)}`
			};
		}
		const uriPrefix = `#`;
		const defUriPrefix = `${uriPrefix}/${defsSegment}/`;
		if (entry[1] === root && !entry[1].schema.id) return { ref: uriPrefix };
		const defId = entry[1].schema.id ?? `__schema${ctx.counter++}`;
		return {
			defId,
			ref: defUriPrefix + encodeJSONPointerSegment(defId)
		};
	};
	const extractToDef = (entry) => {
		if (entry[1].schema.$ref) return;
		const seen = entry[1];
		const { ref, defId } = makeURI(entry);
		seen.def = { ...seen.schema };
		if (defId) seen.defId = defId;
		const schema = seen.schema;
		for (const key in schema) delete schema[key];
		schema.$ref = ref;
	};
	if (ctx.cycles === "throw") for (const entry of ctx.seen.entries()) {
		const seen = entry[1];
		if (seen.cycle) throw new Error(`Cycle detected: #/${seen.cycle?.join("/")}/<root>

Set the \`cycles\` parameter to \`"ref"\` to resolve cyclical schemas with defs.`);
	}
	for (const entry of ctx.seen.entries()) {
		const seen = entry[1];
		if (schema === entry[0]) {
			extractToDef(entry);
			continue;
		}
		if (ctx.external) {
			const ext = ctx.external.registry.get(entry[0])?.id;
			if (schema !== entry[0] && ext) {
				extractToDef(entry);
				continue;
			}
		}
		if (ctx.metadataRegistry.get(entry[0])?.id) {
			extractToDef(entry);
			continue;
		}
		if (seen.cycle) {
			extractToDef(entry);
			continue;
		}
		if (seen.count > 1) {
			if (ctx.reused === "ref") extractToDef(entry);
		}
	}
	if (ctx.external) ctx.sharedDefsExtractedFor = ctx.external;
}
/** Rewrites `anyOf: [{type: "a"}, {type: "b"}]` to `type: ["a", "b"]`, which every JSON Schema draft treats as equivalent and most consumers render far better for the nullable case. Only branches that are a bare type assertion qualify — anything carrying a constraint, `$ref`, `const` or metadata is left alone. Runs after `flattenRef`, so a branch an override decorated or `$defs` extraction turned into a `$ref` is no longer bare and correctly stays in `anyOf`. `oneOf` is excluded: `integer` and `number` overlap, so "exactly one" and "at least one" are not the same there. OpenAPI 3.0 is excluded: its `type` must be a single string. */
function compactTypeUnion(schema) {
	const options = schema.anyOf;
	if (!Array.isArray(options) || options.length === 0 || schema.type !== void 0) return;
	const types = [];
	for (const option of options) {
		if (!option || typeof option !== "object") return;
		compactTypeUnion(option);
		const keys = Object.keys(option);
		if (keys.length !== 1 || keys[0] !== "type") return;
		const type = option.type;
		for (const member of Array.isArray(type) ? type : [type]) {
			if (typeof member !== "string") return;
			if (!types.includes(member)) types.push(member);
		}
	}
	delete schema.anyOf;
	schema.type = types.length === 1 ? types[0] : types;
}
/** Keywords `foldIntersection` knows how to combine. Anything else — `$ref`, `patternProperties`,
* an annotation like `description` — makes a member unfoldable, so a constraint this does not
* understand leaves the `allOf` alone instead of being silently dropped or misattributed. */
const FOLDABLE_KEYS = /* @__PURE__ */ new Set([
	"type",
	"properties",
	"required",
	"additionalProperties"
]);
const UNION_KEYS = ["oneOf", "anyOf"];
/** A member's constraint on a key it does not declare itself. A `catchall` states one; `false`, an absent `additionalProperties`, and the empty schema a loose object emits state nothing. */
function undeclaredConstraint(member) {
	const extra = member.additionalProperties;
	if (extra === void 0 || extra === false || typeof extra !== "object" || extra === null) return null;
	return Object.keys(extra).length ? extra : null;
}
/** Combines object members into the single object they describe together, or returns `null` if any of them carries a keyword outside {@link FOLDABLE_KEYS}. */
function foldObjects(members) {
	const objects = [];
	for (const member of members) {
		if (typeof member !== "object" || member.type !== "object") return null;
		for (const key in member) if (!FOLDABLE_KEYS.has(key)) return null;
		objects.push(member);
	}
	const properties = {};
	const required = /* @__PURE__ */ new Set();
	for (const object of objects) {
		for (const key in object.properties) {
			if (Object.prototype.hasOwnProperty.call(properties, key)) continue;
			const parts = [];
			for (const other of objects) {
				const part = other.properties?.[key] ?? undeclaredConstraint(other);
				if (part === null || part === void 0) continue;
				if (!parts.some((seen) => JSON.stringify(seen) === JSON.stringify(part))) parts.push(part);
			}
			assignProp(properties, key, parts.length === 1 ? parts[0] : foldObjects(parts) ?? { allOf: parts });
		}
		for (const key of object.required ?? []) required.add(key);
	}
	const folded = {
		type: "object",
		properties
	};
	if (required.size) folded.required = [...required];
	if (objects.every((object) => object.additionalProperties === false)) folded.additionalProperties = false;
	else {
		const constraints = [];
		for (const object of objects) {
			const constraint = undeclaredConstraint(object);
			if (constraint && !constraints.some((seen) => JSON.stringify(seen) === JSON.stringify(constraint))) constraints.push(constraint);
		}
		if (constraints.length === 1) folded.additionalProperties = constraints[0];
		else if (constraints.length > 1) folded.additionalProperties = { allOf: constraints };
	}
	return folded;
}
/** `additionalProperties` in an `allOf` member sees only that member's own `properties`, so two
* closed object members reject each other's keys and the schema validates nothing. Zod's parser
* pools the key sets instead — `handleIntersectionResults` reports a key as unrecognized only when
* *every* side rejects it — so the emitted schema has to pool them too, and folding the members
* into one object is the encoding that says so on every target.
*
* This runs from `finalize`, after `extractDefs`, which is what keeps it clear of the `$ref`
* machinery: a member extracted into `$defs` is already a `$ref` by now and declines to fold, so it
* keeps its reference and its own closedness rather than being inlined as a stale copy. */
function foldIntersection(json) {
	const allOf = json.allOf;
	if (!Array.isArray(allOf) || allOf.length < 2) return;
	for (const key of FOLDABLE_KEYS) if (key in json) return;
	const unions = allOf.filter((m) => UNION_KEYS.some((k) => Array.isArray(m[k])));
	let folded = null;
	if (!unions.length) folded = foldObjects(allOf);
	else {
		const union = unions[0];
		const keyword = UNION_KEYS.find((k) => Array.isArray(union[k]));
		if (Object.keys(union).length !== 1) return;
		const rest = allOf.filter((m) => m !== union);
		const branches = union[keyword].map((branch) => foldObjects([...rest, branch]));
		if (branches.some((b) => !b)) return;
		folded = { [keyword]: branches };
	}
	if (!folded) return;
	delete json.allOf;
	assignProps(json, folded);
}
function finalize(ctx, schema) {
	const root = ctx.seen.get(schema);
	if (!root) throw new Error("Unprocessed schema. This is a bug in Zod.");
	const flattenRef = (zodSchema) => {
		const seen = ctx.seen.get(zodSchema);
		if (seen.ref === null) return;
		const schema = seen.def ?? seen.schema;
		const _cached = { ...schema };
		const ref = seen.ref;
		seen.ref = null;
		if (ref) {
			flattenRef(ref);
			const refSeen = ctx.seen.get(ref);
			const refSchema = refSeen.schema;
			if (refSchema.$ref && (ctx.target === "draft-07" || ctx.target === "draft-04" || ctx.target === "openapi-3.0")) {
				schema.allOf = schema.allOf ?? [];
				schema.allOf.push(refSchema);
			} else assignProps(schema, refSchema);
			assignProps(schema, _cached);
			if (zodSchema._zod.parent === ref) for (const key in schema) {
				if (key === "$ref" || key === "allOf") continue;
				if (!(key in _cached)) delete schema[key];
			}
			if (refSchema.$ref && refSeen.def) for (const key in schema) {
				if (key === "$ref" || key === "allOf") continue;
				if (key in refSeen.def && JSON.stringify(schema[key]) === JSON.stringify(refSeen.def[key])) delete schema[key];
			}
		}
		const parent = zodSchema._zod.parent;
		if (parent && parent !== ref) {
			flattenRef(parent);
			const parentSeen = ctx.seen.get(parent);
			if (parentSeen?.schema.$ref) {
				schema.$ref = parentSeen.schema.$ref;
				if (parentSeen.def) for (const key in schema) {
					if (key === "$ref" || key === "allOf") continue;
					if (key in parentSeen.def && JSON.stringify(schema[key]) === JSON.stringify(parentSeen.def[key])) delete schema[key];
				}
			}
		}
		ctx.override({
			zodSchema,
			jsonSchema: schema,
			path: seen.path ?? []
		});
	};
	if (!ctx.external || ctx.sharedEmitDoneFor !== ctx.external) {
		for (const entry of [...ctx.seen.entries()].reverse()) flattenRef(entry[0]);
		if (ctx.target !== "openapi-3.0") for (const entry of ctx.seen.entries()) compactTypeUnion(entry[1].def ?? entry[1].schema);
		for (const rewrite of ctx.deferred) rewrite();
		if (ctx.intersections.length) {
			const carriers = /* @__PURE__ */ new Map();
			for (const seen of ctx.seen.values()) for (const json of [seen.schema, seen.def]) {
				const allOf = json?.allOf;
				if (!Array.isArray(allOf)) continue;
				const existing = carriers.get(allOf);
				if (existing) existing.push(json);
				else carriers.set(allOf, [json]);
			}
			for (const allOf of ctx.intersections) for (const json of carriers.get(allOf) ?? []) foldIntersection(json);
		}
	}
	const result = {};
	if (ctx.target === "draft-2020-12") result.$schema = "https://json-schema.org/draft/2020-12/schema";
	else if (ctx.target === "draft-07") result.$schema = "http://json-schema.org/draft-07/schema#";
	else if (ctx.target === "draft-04") result.$schema = "http://json-schema.org/draft-04/schema#";
	else if (ctx.target === "openapi-3.0") {}
	if (ctx.external?.uri) {
		const id = ctx.external.registry.get(schema)?.id;
		if (!id) throw new Error("Schema is missing an `id` property");
		result.$id = ctx.external.uri(id);
	}
	assignProps(result, root.defId ? root.schema : root.def ?? root.schema);
	const rootMetaId = ctx.metadataRegistry.get(schema)?.id;
	if (rootMetaId !== void 0 && result.id === rootMetaId) delete result.id;
	const defs = ctx.external?.defs ?? {};
	if (!ctx.external || ctx.sharedEmitDoneFor !== ctx.external) for (const entry of ctx.seen.entries()) {
		const seen = entry[1];
		if (seen.def && seen.defId) {
			if (seen.def.id === seen.defId) delete seen.def.id;
			assignProp(defs, seen.defId, seen.def);
		}
	}
	if (ctx.external) ctx.sharedEmitDoneFor = ctx.external;
	if (ctx.external) {} else if (Object.keys(defs).length > 0) {
		if (ctx.target === "draft-2020-12") result.$defs = defs;
		else result.definitions = defs;
	}
	try {
		const finalized = JSON.parse(JSON.stringify(result));
		Object.defineProperty(finalized, "~standard", {
			value: {
				...schema["~standard"],
				jsonSchema: {
					input: createStandardJSONSchemaMethod(schema, "input", ctx.processors),
					output: createStandardJSONSchemaMethod(schema, "output", ctx.processors)
				}
			},
			enumerable: false,
			writable: false
		});
		return finalized;
	} catch (_err) {
		throw new Error("Error converting schema to JSON.");
	}
}
function isTransforming(_schema, _ctx) {
	const ctx = _ctx ?? { seen: /* @__PURE__ */ new Set() };
	if (ctx.seen.has(_schema)) return false;
	ctx.seen.add(_schema);
	const def = _schema._zod.def;
	if (def.type === "transform") return true;
	if (def.type === "array") return isTransforming(def.element, ctx);
	if (def.type === "set") return isTransforming(def.valueType, ctx);
	if (def.type === "lazy") return isTransforming(def.getter(), ctx);
	if (def.type === "promise" || def.type === "optional" || def.type === "nonoptional" || def.type === "nullable" || def.type === "readonly" || def.type === "default" || def.type === "prefault" || def.type === "catch") return isTransforming(def.innerType, ctx);
	if (def.type === "intersection") return isTransforming(def.left, ctx) || isTransforming(def.right, ctx);
	if (def.type === "record" || def.type === "map") return isTransforming(def.keyType, ctx) || isTransforming(def.valueType, ctx);
	if (def.type === "pipe") {
		if (_schema._zod.traits.has("$ZodCodec")) return true;
		return isTransforming(def.in, ctx) || isTransforming(def.out, ctx);
	}
	if (def.type === "object") {
		for (const key in def.shape) if (isTransforming(def.shape[key], ctx)) return true;
		return false;
	}
	if (def.type === "union") {
		for (const option of def.options) if (isTransforming(option, ctx)) return true;
		return false;
	}
	if (def.type === "tuple") {
		for (const item of def.items) if (isTransforming(item, ctx)) return true;
		if (def.rest && isTransforming(def.rest, ctx)) return true;
		return false;
	}
	return false;
}
/**
* Creates a toJSONSchema method for a schema instance.
* This encapsulates the logic of initializing context, processing, extracting defs, and finalizing.
*/
const createToJSONSchemaMethod = (schema, processors = {}) => (params) => {
	const ctx = initializeContext({
		...params,
		processors
	});
	processSchema(schema, ctx);
	extractDefs(ctx, schema);
	return finalize(ctx, schema);
};
const createStandardJSONSchemaMethod = (schema, io, processors = {}) => (params) => {
	const { libraryOptions, target } = params ?? {};
	const ctx = initializeContext({
		...libraryOptions ?? {},
		target,
		io,
		processors
	});
	processSchema(schema, ctx);
	extractDefs(ctx, schema);
	return finalize(ctx, schema);
};
// node_modules/zod/v4/core/json-schema-processors.js
const narrowMin = (agg, key, value) => {
	if (agg[key] === void 0 || value > agg[key]) agg[key] = value;
};
const narrowMax = (agg, key, value) => {
	if (agg[key] === void 0 || value < agg[key]) agg[key] = value;
};
const narrowBoth = (agg, value) => {
	narrowMin(agg, "minimum", value);
	narrowMax(agg, "maximum", value);
};
const addDivisor = (agg, value) => {
	agg.multipleOf ?? (agg.multipleOf = []);
	if (!agg.multipleOf.includes(value)) agg.multipleOf.push(value);
};
const addPattern = (agg, pattern) => {
	agg.patterns ?? (agg.patterns = /* @__PURE__ */ new Set());
	agg.patterns.add(pattern);
};
const intersectMime = (agg, mime) => {
	agg.mime = agg.mime ? agg.mime.filter((m) => mime.includes(m)) : [...mime];
};
const setFormat = (agg, format) => {
	agg.format = format;
	if (format.includes("int")) agg.isInt = true;
};
const minContributor = (agg, def) => narrowMin(agg, "minimum", def.minimum);
const maxContributor = (agg, def) => narrowMax(agg, "maximum", def.maximum);
const formatContributor = (ranges) => (agg, def) => {
	setFormat(agg, def.format);
	const [minimum, maximum] = ranges[def.format];
	narrowMin(agg, "minimum", minimum);
	narrowMax(agg, "maximum", maximum);
};
const contributors = {
	greater_than: (agg, def) => narrowMin(agg, def.inclusive ? "minimum" : "exclusiveMinimum", def.value),
	less_than: (agg, def) => narrowMax(agg, def.inclusive ? "maximum" : "exclusiveMaximum", def.value),
	multiple_of: (agg, def) => addDivisor(agg, def.value),
	number_format: formatContributor(NUMBER_FORMAT_RANGES),
	bigint_format: formatContributor(BIGINT_FORMAT_RANGES),
	min_length: minContributor,
	max_length: maxContributor,
	length_equals: (agg, def) => narrowBoth(agg, def.length),
	min_size: minContributor,
	max_size: maxContributor,
	size_equals: (agg, def) => narrowBoth(agg, def.size),
	string_format: (agg, def) => {
		setFormat(agg, def.format);
		if (def.pattern) addPattern(agg, def.pattern);
		if (def.format === "base64" || def.format === "base64url") agg.contentEncoding = def.format;
		if (def.local || def.precision === -1) agg.laxFormat = true;
	},
	mime_type: (agg, def) => intersectMime(agg, def.mime)
};
function aggregateChecks(schema) {
	const agg = {};
	const def = schema._zod.def;
	const list = schema._zod.traits.has("$ZodCheck") ? [schema, ...def.checks ?? []] : def.checks ?? [];
	for (const ch of list) contributors[ch._zod.def.check]?.(agg, ch._zod.def);
	const bag = schema._zod.bag;
	if (bag.minimum !== void 0) narrowMin(agg, "minimum", bag.minimum);
	if (bag.exclusiveMinimum !== void 0) narrowMin(agg, "exclusiveMinimum", bag.exclusiveMinimum);
	if (bag.maximum !== void 0) narrowMax(agg, "maximum", bag.maximum);
	if (bag.exclusiveMaximum !== void 0) narrowMax(agg, "exclusiveMaximum", bag.exclusiveMaximum);
	if (bag.multipleOf !== void 0) addDivisor(agg, bag.multipleOf);
	if (bag.format !== void 0) {
		agg.format ?? (agg.format = bag.format);
		if (bag.format.includes("int")) agg.isInt = true;
	}
	if (bag.mime) intersectMime(agg, bag.mime);
	for (const pattern of bag.patterns ?? []) addPattern(agg, pattern);
	return agg;
}
const formatMap = {
	guid: "uuid",
	url: "uri",
	datetime: "date-time",
	json_string: "json-string",
	regex: ""
};
const exactPatterns = /* @__PURE__ */ new Map([[base64Charset, base64], [base64urlCharset, base64url]]);
const exactPattern = (p) => exactPatterns.get(p) ?? p;
const stringProcessor = (schema, ctx, _json, _params) => {
	const json = _json;
	json.type = "string";
	const { minimum, maximum, format, patterns, contentEncoding, laxFormat } = aggregateChecks(schema);
	if (typeof minimum === "number") json.minLength = minimum;
	if (typeof maximum === "number") json.maxLength = maximum;
	if (format) {
		json.format = formatMap[format] ?? format;
		if (json.format === "") delete json.format;
		if (format === "time" || laxFormat) delete json.format;
	}
	if (contentEncoding) json.contentEncoding = contentEncoding;
	if (patterns && patterns.size > 0) {
		const patternList = [...patterns].map(exactPattern);
		if (patternList.length === 1) json.pattern = patternList[0].source;
		else if (patternList.length > 1) json.allOf = [...patternList.map((regex) => ({
			...ctx.target === "draft-07" || ctx.target === "draft-04" || ctx.target === "openapi-3.0" ? { type: "string" } : {},
			pattern: regex.source
		}))];
	}
};
const numberProcessor = (schema, ctx, _json, params) => {
	const json = _json;
	const { minimum, maximum, multipleOf, exclusiveMaximum, exclusiveMinimum, isInt } = aggregateChecks(schema);
	json.type = isInt ? "integer" : "number";
	const exMin = typeof exclusiveMinimum === "number" && exclusiveMinimum >= (minimum ?? Number.NEGATIVE_INFINITY);
	const exMax = typeof exclusiveMaximum === "number" && exclusiveMaximum <= (maximum ?? Number.POSITIVE_INFINITY);
	const legacy = ctx.target === "draft-04" || ctx.target === "openapi-3.0";
	if (exMin) {
		if (legacy) {
			json.minimum = exclusiveMinimum;
			json.exclusiveMinimum = true;
		} else json.exclusiveMinimum = exclusiveMinimum;
	} else if (typeof minimum === "number") json.minimum = minimum;
	if (exMax) {
		if (legacy) {
			json.maximum = exclusiveMaximum;
			json.exclusiveMaximum = true;
		} else json.exclusiveMaximum = exclusiveMaximum;
	} else if (typeof maximum === "number") json.maximum = maximum;
	if (multipleOf) {
		const divisors = /* @__PURE__ */ new Set();
		for (const divisor of multipleOf) if (Number.isFinite(divisor) && divisor !== 0) divisors.add(Math.abs(divisor));
		else handleUnrepresentable(schema, ctx, json, params, `A multipleOf divisor of ${divisor} cannot be represented in JSON Schema`);
		const [first, ...rest] = divisors;
		if (first !== void 0) json.multipleOf = first;
		if (rest.length) json.allOf = [...json.allOf ?? [], ...rest.map((m) => ({ multipleOf: m }))];
	}
};
const booleanProcessor = (_schema, _ctx, json, _params) => {
	json.type = "boolean";
};
const neverProcessor = (_schema, _ctx, json, _params) => {
	json.not = {};
};
const enumProcessor = (schema, _ctx, json, _params) => {
	const def = schema._zod.def;
	const values = getEnumValues(def.entries);
	if (values.length === 0) {
		json.not = {};
		return;
	}
	if (values.every((v) => typeof v === "number")) json.type = "number";
	if (values.every((v) => typeof v === "string")) json.type = "string";
	json.enum = values;
};
const literalProcessor = (schema, ctx, json, params) => {
	const def = schema._zod.def;
	if (def.values.length === 0) {
		json.not = {};
		return;
	}
	const vals = [];
	for (const val of def.values) if (val === void 0) {
		if (handleUnrepresentable(schema, ctx, json, params, "Literal `undefined` cannot be represented in JSON Schema")) return;
	} else if (typeof val === "bigint") {
		if (handleUnrepresentable(schema, ctx, json, params, "BigInt literals cannot be represented in JSON Schema")) return;
		vals.push(Number(val));
	} else vals.push(val);
	if (vals.length === 0) {} else if (vals.length === 1) {
		const val = vals[0];
		json.type = val === null ? "null" : typeof val;
		if (ctx.target === "draft-04" || ctx.target === "openapi-3.0") json.enum = [val];
		else json.const = val;
	} else {
		if (vals.every((v) => typeof v === "number")) json.type = "number";
		if (vals.every((v) => typeof v === "string")) json.type = "string";
		if (vals.every((v) => typeof v === "boolean")) json.type = "boolean";
		if (vals.every((v) => v === null)) json.type = "null";
		json.enum = vals;
	}
};
const customProcessor = (schema, ctx, json, params) => {
	handleUnrepresentable(schema, ctx, json, params, "Custom types cannot be represented in JSON Schema");
};
const transformProcessor = (schema, ctx, json, params) => {
	handleUnrepresentable(schema, ctx, json, params, "Transforms cannot be represented in JSON Schema");
};
const arrayProcessor = (schema, ctx, _json, params) => {
	const json = _json;
	const def = schema._zod.def;
	const { minimum, maximum } = aggregateChecks(schema);
	if (typeof minimum === "number") json.minItems = minimum;
	if (typeof maximum === "number") json.maxItems = maximum;
	json.type = "array";
	json.items = processSchema(def.element, ctx, {
		...params,
		path: [...params.path, "items"]
	});
};
function inputOptin(schema) {
	const def = schema._zod.def;
	if (def.type === "pipe" && def.in._zod.traits.has("$ZodTransform")) return inputOptin(def.out);
	if (def.type === "catch") return inputOptin(def.innerType);
	return schema._zod.optin;
}
const objectProcessor = (schema, ctx, _json, params) => {
	const json = _json;
	const def = schema._zod.def;
	const shape = def.shape;
	if (Object.getOwnPropertySymbols(shape).length && handleUnrepresentable(schema, ctx, json, params, "Symbol keys cannot be represented in JSON Schema")) return;
	json.type = "object";
	json.properties = {};
	for (const key in shape) assignProp(json.properties, key, processSchema(shape[key], ctx, {
		...params,
		path: [
			...params.path,
			"properties",
			key
		]
	}));
	const requiredKeys = [];
	for (const key of Object.keys(shape)) {
		const field = def.shape[key];
		if (ctx.io === "input" ? inputOptin(field) === void 0 : field._zod.optout === void 0) requiredKeys.push(key);
	}
	if (requiredKeys.length > 0) json.required = requiredKeys;
	if (def.catchall?._zod.def.type === "never") json.additionalProperties = false;
	else if (!def.catchall) {
		if (ctx.io === "output") json.additionalProperties = false;
	} else if (def.catchall) json.additionalProperties = processSchema(def.catchall, ctx, {
		...params,
		path: [...params.path, "additionalProperties"]
	});
};
const unionProcessor = (schema, ctx, json, params) => {
	const def = schema._zod.def;
	const isExclusive = def.inclusive === false;
	const options = def.options.map((x, i) => processSchema(x, ctx, {
		...params,
		path: [
			...params.path,
			isExclusive ? "oneOf" : "anyOf",
			i
		]
	}));
	if (isExclusive) json.oneOf = options;
	else json.anyOf = options;
};
const intersectionProcessor = (schema, ctx, json, params) => {
	const def = schema._zod.def;
	const a = processSchema(def.left, ctx, {
		...params,
		path: [
			...params.path,
			"allOf",
			0
		]
	});
	const b = processSchema(def.right, ctx, {
		...params,
		path: [
			...params.path,
			"allOf",
			1
		]
	});
	const isSimpleIntersection = (val) => "allOf" in val && Object.keys(val).length === 1;
	const allOf = [...isSimpleIntersection(a) ? a.allOf : [a], ...isSimpleIntersection(b) ? b.allOf : [b]];
	json.allOf = allOf;
	ctx.intersections.push(allOf);
};
const nullableProcessor = (schema, ctx, json, params) => {
	const def = schema._zod.def;
	const inner = processSchema(def.innerType, ctx, params);
	const seen = ctx.seen.get(schema);
	if (ctx.target === "openapi-3.0") {
		seen.ref = def.innerType;
		json.nullable = true;
	} else json.anyOf = [inner, { type: "null" }];
};
const nonoptionalProcessor = (schema, ctx, _json, params) => {
	const def = schema._zod.def;
	processSchema(def.innerType, ctx, params);
	const seen = ctx.seen.get(schema);
	seen.ref = def.innerType;
};
/** Round-trips a default value through JSON so the emitted schema is guaranteed to be valid JSON.
* A BigInt has no reliable encoding, so it goes through `unrepresentable` like any other
* unrepresentable value. Returns a sentinel when the caller must not write a default of its own. */
const UNREPRESENTABLE_DEFAULT = Symbol();
function serializeDefaultValue(value, schema, ctx, json, params) {
	let unrepresentable = false;
	const serialized = JSON.stringify(value, (_, val) => {
		if (typeof val !== "bigint") return val;
		unrepresentable = true;
		return null;
	});
	if (!unrepresentable) return JSON.parse(serialized);
	handleUnrepresentable(schema, ctx, json, params, "BigInt defaults cannot be represented in JSON Schema");
	return UNREPRESENTABLE_DEFAULT;
}
const defaultProcessor = (schema, ctx, json, params) => {
	const def = schema._zod.def;
	processSchema(def.innerType, ctx, params);
	const seen = ctx.seen.get(schema);
	seen.ref = def.innerType;
	const value = serializeDefaultValue(def.defaultValue, schema, ctx, json, params);
	if (value !== UNREPRESENTABLE_DEFAULT) json.default = value;
};
const prefaultProcessor = (schema, ctx, json, params) => {
	const def = schema._zod.def;
	processSchema(def.innerType, ctx, params);
	const seen = ctx.seen.get(schema);
	seen.ref = def.innerType;
	if (ctx.io !== "input") return;
	const value = serializeDefaultValue(def.defaultValue, schema, ctx, json, params);
	if (value !== UNREPRESENTABLE_DEFAULT) json._prefault = value;
};
const catchProcessor = (schema, ctx, json, params) => {
	const def = schema._zod.def;
	processSchema(def.innerType, ctx, params);
	const seen = ctx.seen.get(schema);
	seen.ref = def.innerType;
	let catchValue;
	try {
		catchValue = def.catchValue(void 0);
	} catch {
		handleUnrepresentable(schema, ctx, json, params, "Dynamic catch values are not supported in JSON Schema");
		return;
	}
	json.default = catchValue;
};
const pipeProcessor = (schema, ctx, _json, params) => {
	const def = schema._zod.def;
	const inIsTransform = def.in._zod.traits.has("$ZodTransform");
	const innerType = ctx.io === "input" ? inIsTransform ? def.out : def.in : def.out;
	processSchema(innerType, ctx, params);
	const seen = ctx.seen.get(schema);
	seen.ref = innerType;
};
const readonlyProcessor = (schema, ctx, json, params) => {
	const def = schema._zod.def;
	processSchema(def.innerType, ctx, params);
	const seen = ctx.seen.get(schema);
	seen.ref = def.innerType;
	json.readOnly = true;
};
const optionalProcessor = (schema, ctx, _json, params) => {
	const def = schema._zod.def;
	processSchema(def.innerType, ctx, params);
	const seen = ctx.seen.get(schema);
	seen.ref = def.innerType;
};
// node_modules/zod/v4/classic/errors.js
const _installedErrorProtos = /* @__PURE__ */ new WeakSet([Object.prototype, Error.prototype]);
function _lazyMethod(proto, key, make) {
	Object.defineProperty(proto, key, {
		configurable: true,
		enumerable: false,
		get() {
			const value = make(this);
			Object.defineProperty(this, key, {
				value,
				configurable: true,
				writable: true
			});
			return value;
		},
		set(value) {
			Object.defineProperty(this, key, {
				value,
				configurable: true,
				writable: true
			});
		}
	});
}
const initializer = (inst, issues) => {
	$ZodError.init(inst, issues);
	inst.name = "ZodError";
	const proto = Object.getPrototypeOf(inst);
	if (_installedErrorProtos.has(proto)) return;
	_installedErrorProtos.add(proto);
	_lazyMethod(proto, "format", (self) => (mapper) => formatError(self, mapper));
	_lazyMethod(proto, "flatten", (self) => (mapper) => flattenError(self, mapper));
	_lazyMethod(proto, "addIssue", (self) => (issue) => {
		self.issues.push(issue);
		self.message = JSON.stringify(self.issues, jsonStringifyReplacer, 2);
	});
	_lazyMethod(proto, "addIssues", (self) => (issues) => {
		self.issues.push(...issues);
		self.message = JSON.stringify(self.issues, jsonStringifyReplacer, 2);
	});
	Object.defineProperty(proto, "isEmpty", {
		configurable: true,
		enumerable: false,
		get() {
			return this.issues.length === 0;
		}
	});
};
const ZodRealError = /*@__PURE__*/ $constructor("ZodError", initializer, void 0, { Parent: Error });
// node_modules/zod/v4/classic/parse.js
const parse = /* @__PURE__ */ _parse(ZodRealError);
const parseAsync = /* @__PURE__ */ _parseAsync(ZodRealError);
const safeParse = /* @__PURE__ */ _safeParse(ZodRealError);
const safeParseAsync = /* @__PURE__ */ _safeParseAsync(ZodRealError);
const encode = /* @__PURE__ */ _encode(ZodRealError);
const decode = /* @__PURE__ */ _decode(ZodRealError);
const encodeAsync = /* @__PURE__ */ _encodeAsync(ZodRealError);
const decodeAsync = /* @__PURE__ */ _decodeAsync(ZodRealError);
const safeEncode = /* @__PURE__ */ _safeEncode(ZodRealError);
const safeDecode = /* @__PURE__ */ _safeDecode(ZodRealError);
const safeEncodeAsync = /* @__PURE__ */ _safeEncodeAsync(ZodRealError);
const safeDecodeAsync = /* @__PURE__ */ _safeDecodeAsync(ZodRealError);
// node_modules/zod/v4/classic/schemas.js
function _ensureDefaultLocale() {
	if (!globalConfig.localeError) config(en_default());
}
function _ensureDefaultMemoizer() {
	if (!globalConfig.memoizer) config({ memoizer: memoizer() });
}
const ZodType = /*@__PURE__*/ $constructor("ZodType", (inst, def) => {
	_ensureDefaultLocale();
	$ZodType.init(inst, def);
	inst.def = def;
	inst.type = def.type;
	return inst;
}, {
	check(...chks) {
		const def = this.def;
		return this.clone(mergeDefs(def, { checks: [...def.checks ?? [], ...chks.map((ch) => typeof ch === "function" ? { _zod: {
			check: ch,
			def: { check: "custom" },
			onattach: []
		} } : ch)] }), { parent: true });
	},
	with(...chks) {
		return this.check(...chks);
	},
	clone(def, params) {
		return clone(this, def, params);
	},
	brand() {
		return this;
	},
	register(reg, meta) {
		reg.add(this, meta);
		return this;
	},
	refine(check, params) {
		return this.check(refine(check, params));
	},
	superRefine(refinement, params) {
		return this.check(superRefine(refinement, params));
	},
	overwrite(fn) {
		return this.check(/* @__PURE__ */ _overwrite(fn));
	},
	optional() {
		return optional(this);
	},
	exactOptional() {
		return exactOptional(this);
	},
	nullable() {
		return nullable(this);
	},
	nullish() {
		return optional(nullable(this));
	},
	nonoptional(params) {
		return nonoptional(this, params);
	},
	array() {
		return array(this);
	},
	or(arg) {
		return union([this, arg]);
	},
	and(arg) {
		return intersection(this, arg);
	},
	transform(tx) {
		return pipe(this, transform(tx));
	},
	default(d) {
		return _default(this, d);
	},
	prefault(d) {
		return prefault(this, d);
	},
	catch(params) {
		return _catch(this, params);
	},
	pipe(target) {
		return pipe(this, target);
	},
	readonly() {
		return readonly(this);
	},
	describe(description) {
		const cl = this.clone();
		globalRegistry.add(cl, { description });
		return cl;
	},
	meta(...args) {
		if (args.length === 0) return globalRegistry.get(this);
		const cl = this.clone();
		globalRegistry.add(cl, args[0]);
		return cl;
	},
	isOptional() {
		return this.safeParse(void 0).success;
	},
	isNullable() {
		return this.safeParse(null).success;
	},
	apply(fn, ...args) {
		return args.length === 0 ? fn(this) : fn(this, ...args);
	},
	get "~standard"() {
		return hide(this, "~standard", {
			...standardProps(this),
			jsonSchema: {
				input: createStandardJSONSchemaMethod(this, "input"),
				output: createStandardJSONSchemaMethod(this, "output")
			}
		});
	},
	set "~standard"(value) {
		own(this, "~standard", value);
	},
	parse: function _parse(data, params) {
		return parse(this, data, params, { callee: _parse });
	},
	parseAsync: async function _parseAsync(data, params) {
		return await parseAsync(this, data, params, { callee: _parseAsync });
	},
	safeParse(data, params) {
		return safeParse(this, data, params);
	},
	async safeParseAsync(data, params) {
		return safeParseAsync(this, data, params);
	},
	get spa() {
		return this?.safeParseAsync;
	},
	set spa(value) {
		own(this, "spa", value);
	},
	validate(data, params) {
		return validate(this, data, params);
	},
	validateAsync(data, params) {
		return validateAsync$1(this, data, params);
	},
	encode: function _encode(data, params) {
		return encode(this, data, params, { callee: _encode });
	},
	decode: function _decode(data, params) {
		return decode(this, data, params, { callee: _decode });
	},
	encodeAsync: async function _encodeAsync(data, params) {
		return await encodeAsync(this, data, params, { callee: _encodeAsync });
	},
	decodeAsync: async function _decodeAsync(data, params) {
		return await decodeAsync(this, data, params, { callee: _decodeAsync });
	},
	safeEncode(data, params) {
		return safeEncode(this, data, params);
	},
	safeDecode(data, params) {
		return safeDecode(this, data, params);
	},
	async safeEncodeAsync(data, params) {
		return safeEncodeAsync(this, data, params);
	},
	async safeDecodeAsync(data, params) {
		return safeDecodeAsync(this, data, params);
	},
	toJSONSchema(params) {
		return createToJSONSchemaMethod(this, {})(params);
	},
	get description() {
		return globalRegistry.get(this)?.description;
	},
	get _def() {
		return this._zod.def;
	}
});
/** @internal */
const _ZodString = /*@__PURE__*/ $constructor("_ZodString", (inst, def) => {
	$ZodString.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => stringProcessor(inst, ctx, json, params);
}, /*@__PURE__*/ derived({
	format: (inst) => aggregateChecks(inst).format ?? null,
	minLength: (inst) => aggregateChecks(inst).minimum ?? null,
	maxLength: (inst) => aggregateChecks(inst).maximum ?? null
}, {
	regex(...args) {
		return this.check(/* @__PURE__ */ _regex(...args));
	},
	includes(...args) {
		return this.check(/* @__PURE__ */ _includes(...args));
	},
	startsWith(...args) {
		return this.check(/* @__PURE__ */ _startsWith(...args));
	},
	endsWith(...args) {
		return this.check(/* @__PURE__ */ _endsWith(...args));
	},
	min(...args) {
		return this.check(/* @__PURE__ */ _minLength(...args));
	},
	max(...args) {
		return this.check(/* @__PURE__ */ _maxLength(...args));
	},
	length(...args) {
		return this.check(/* @__PURE__ */ _length(...args));
	},
	nonempty(...args) {
		return this.check(/* @__PURE__ */ _minLength(1, ...args));
	},
	lowercase(params) {
		return this.check(/* @__PURE__ */ _lowercase(params));
	},
	uppercase(params) {
		return this.check(/* @__PURE__ */ _uppercase(params));
	},
	trim() {
		return this.check(/* @__PURE__ */ _trim());
	},
	normalize(...args) {
		return this.check(/* @__PURE__ */ _normalize(...args));
	},
	toLowerCase() {
		return this.check(/* @__PURE__ */ _toLowerCase());
	},
	toUpperCase() {
		return this.check(/* @__PURE__ */ _toUpperCase());
	},
	slugify() {
		return this.check(/* @__PURE__ */ _slugify());
	}
}));
const ZodString = /*@__PURE__*/ $constructor("ZodString", (inst, def) => {
	$ZodString.init(inst, def);
	_ZodString.init(inst, def);
}, {
	email(params) {
		return this.check(/* @__PURE__ */ _email(ZodEmail, params));
	},
	url(params) {
		return this.check(/* @__PURE__ */ _url(ZodURL, params));
	},
	jwt(params) {
		return this.check(/* @__PURE__ */ _jwt(ZodJWT, params));
	},
	emoji(params) {
		return this.check(/* @__PURE__ */ _emoji(ZodEmoji, params));
	},
	guid(params) {
		return this.check(/* @__PURE__ */ _guid(ZodGUID, params));
	},
	uuid(params) {
		return this.check(/* @__PURE__ */ _uuid(ZodUUID, params));
	},
	uuidv4(params) {
		return this.check(/* @__PURE__ */ _uuidv4(ZodUUID, params));
	},
	uuidv6(params) {
		return this.check(/* @__PURE__ */ _uuidv6(ZodUUID, params));
	},
	uuidv7(params) {
		return this.check(/* @__PURE__ */ _uuidv7(ZodUUID, params));
	},
	nanoid(params) {
		return this.check(/* @__PURE__ */ _nanoid(ZodNanoID, params));
	},
	cuid(params) {
		return this.check(/* @__PURE__ */ _cuid(ZodCUID, params));
	},
	cuid2(params) {
		return this.check(/* @__PURE__ */ _cuid2(ZodCUID2, params));
	},
	ulid(params) {
		return this.check(/* @__PURE__ */ _ulid(ZodULID, params));
	},
	base64(params) {
		return this.check(/* @__PURE__ */ _base64(ZodBase64, params));
	},
	base64url(params) {
		return this.check(/* @__PURE__ */ _base64url(ZodBase64URL, params));
	},
	xid(params) {
		return this.check(/* @__PURE__ */ _xid(ZodXID, params));
	},
	ksuid(params) {
		return this.check(/* @__PURE__ */ _ksuid(ZodKSUID, params));
	},
	ipv4(params) {
		return this.check(/* @__PURE__ */ _ipv4(ZodIPv4, params));
	},
	ipv6(params) {
		return this.check(/* @__PURE__ */ _ipv6(ZodIPv6, params));
	},
	cidrv4(params) {
		return this.check(/* @__PURE__ */ _cidrv4(ZodCIDRv4, params));
	},
	cidrv6(params) {
		return this.check(/* @__PURE__ */ _cidrv6(ZodCIDRv6, params));
	},
	e164(params) {
		return this.check(/* @__PURE__ */ _e164(ZodE164, params));
	},
	datetime(params) {
		return this.check(/* @__PURE__ */ _isoDateTime(ZodISODateTime, params));
	},
	date(params) {
		return this.check(/* @__PURE__ */ _isoDate(ZodISODate, params));
	},
	time(params) {
		return this.check(/* @__PURE__ */ _isoTime(ZodISOTime, params));
	},
	duration(params) {
		return this.check(/* @__PURE__ */ _isoDuration(ZodISODuration, params));
	}
});
function string(params) {
	return /* @__PURE__ */ _string(ZodString, params);
}
const ZodStringFormat = /*@__PURE__*/ $constructor("ZodStringFormat", (inst, def) => {
	$ZodStringFormat.init(inst, def);
	_ZodString.init(inst, def);
});
const ZodISODateTime = /*@__PURE__*/ $constructor("ZodISODateTime", (inst, def) => {
	$ZodISODateTime.init(inst, def);
	ZodStringFormat.init(inst, def);
});
const ZodISODate = /*@__PURE__*/ $constructor("ZodISODate", (inst, def) => {
	$ZodISODate.init(inst, def);
	ZodStringFormat.init(inst, def);
});
const ZodISOTime = /*@__PURE__*/ $constructor("ZodISOTime", (inst, def) => {
	$ZodISOTime.init(inst, def);
	ZodStringFormat.init(inst, def);
});
const ZodISODuration = /*@__PURE__*/ $constructor("ZodISODuration", (inst, def) => {
	$ZodISODuration.init(inst, def);
	ZodStringFormat.init(inst, def);
});
const ZodEmail = /*@__PURE__*/ $constructor("ZodEmail", (inst, def) => {
	$ZodEmail.init(inst, def);
	ZodStringFormat.init(inst, def);
});
const ZodGUID = /*@__PURE__*/ $constructor("ZodGUID", (inst, def) => {
	$ZodGUID.init(inst, def);
	ZodStringFormat.init(inst, def);
});
const ZodUUID = /*@__PURE__*/ $constructor("ZodUUID", (inst, def) => {
	$ZodUUID.init(inst, def);
	ZodStringFormat.init(inst, def);
});
const ZodURL = /*@__PURE__*/ $constructor("ZodURL", (inst, def) => {
	$ZodURL.init(inst, def);
	ZodStringFormat.init(inst, def);
});
const ZodEmoji = /*@__PURE__*/ $constructor("ZodEmoji", (inst, def) => {
	$ZodEmoji.init(inst, def);
	ZodStringFormat.init(inst, def);
});
const ZodNanoID = /*@__PURE__*/ $constructor("ZodNanoID", (inst, def) => {
	$ZodNanoID.init(inst, def);
	ZodStringFormat.init(inst, def);
});
/**
* @deprecated CUID v1 is deprecated by its authors due to information leakage
* (timestamps embedded in the id). Use {@link ZodCUID2} instead.
* See https://github.com/paralleldrive/cuid.
*/
const ZodCUID = /*@__PURE__*/ $constructor("ZodCUID", (inst, def) => {
	$ZodCUID.init(inst, def);
	ZodStringFormat.init(inst, def);
});
const ZodCUID2 = /*@__PURE__*/ $constructor("ZodCUID2", (inst, def) => {
	$ZodCUID2.init(inst, def);
	ZodStringFormat.init(inst, def);
});
const ZodULID = /*@__PURE__*/ $constructor("ZodULID", (inst, def) => {
	$ZodULID.init(inst, def);
	ZodStringFormat.init(inst, def);
});
const ZodXID = /*@__PURE__*/ $constructor("ZodXID", (inst, def) => {
	$ZodXID.init(inst, def);
	ZodStringFormat.init(inst, def);
});
const ZodKSUID = /*@__PURE__*/ $constructor("ZodKSUID", (inst, def) => {
	$ZodKSUID.init(inst, def);
	ZodStringFormat.init(inst, def);
});
const ZodIPv4 = /*@__PURE__*/ $constructor("ZodIPv4", (inst, def) => {
	$ZodIPv4.init(inst, def);
	ZodStringFormat.init(inst, def);
});
const ZodIPv6 = /*@__PURE__*/ $constructor("ZodIPv6", (inst, def) => {
	$ZodIPv6.init(inst, def);
	ZodStringFormat.init(inst, def);
});
const ZodCIDRv4 = /*@__PURE__*/ $constructor("ZodCIDRv4", (inst, def) => {
	$ZodCIDRv4.init(inst, def);
	ZodStringFormat.init(inst, def);
});
const ZodCIDRv6 = /*@__PURE__*/ $constructor("ZodCIDRv6", (inst, def) => {
	$ZodCIDRv6.init(inst, def);
	ZodStringFormat.init(inst, def);
});
const ZodBase64 = /*@__PURE__*/ $constructor("ZodBase64", (inst, def) => {
	$ZodBase64.init(inst, def);
	ZodStringFormat.init(inst, def);
});
const ZodBase64URL = /*@__PURE__*/ $constructor("ZodBase64URL", (inst, def) => {
	$ZodBase64URL.init(inst, def);
	ZodStringFormat.init(inst, def);
});
const ZodE164 = /*@__PURE__*/ $constructor("ZodE164", (inst, def) => {
	$ZodE164.init(inst, def);
	ZodStringFormat.init(inst, def);
});
const ZodJWT = /*@__PURE__*/ $constructor("ZodJWT", (inst, def) => {
	$ZodJWT.init(inst, def);
	ZodStringFormat.init(inst, def);
});
const ZodNumber = /*@__PURE__*/ $constructor("ZodNumber", (inst, def) => {
	$ZodNumber.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => numberProcessor(inst, ctx, json, params);
	inst.isFinite = true;
}, /*@__PURE__*/ derived({
	minValue: (inst) => {
		const { minimum, exclusiveMinimum } = aggregateChecks(inst);
		return Math.max(minimum ?? Number.NEGATIVE_INFINITY, exclusiveMinimum ?? Number.NEGATIVE_INFINITY);
	},
	maxValue: (inst) => {
		const { maximum, exclusiveMaximum } = aggregateChecks(inst);
		return Math.min(maximum ?? Number.POSITIVE_INFINITY, exclusiveMaximum ?? Number.POSITIVE_INFINITY);
	},
	isInt: (inst) => {
		const { isInt, multipleOf } = aggregateChecks(inst);
		return !!isInt || !!multipleOf?.some(Number.isSafeInteger);
	},
	format: (inst) => aggregateChecks(inst).format ?? null
}, {
	gt(value, params) {
		return this.check(/* @__PURE__ */ _gt(value, params));
	},
	gte(value, params) {
		return this.check(/* @__PURE__ */ _gte(value, params));
	},
	min(value, params) {
		return this.check(/* @__PURE__ */ _gte(value, params));
	},
	lt(value, params) {
		return this.check(/* @__PURE__ */ _lt(value, params));
	},
	lte(value, params) {
		return this.check(/* @__PURE__ */ _lte(value, params));
	},
	max(value, params) {
		return this.check(/* @__PURE__ */ _lte(value, params));
	},
	int(params) {
		return this.check(int(params));
	},
	safe(params) {
		return this.check(int(params));
	},
	positive(params) {
		return this.check(/* @__PURE__ */ _gt(0, params));
	},
	nonnegative(params) {
		return this.check(/* @__PURE__ */ _gte(0, params));
	},
	negative(params) {
		return this.check(/* @__PURE__ */ _lt(0, params));
	},
	nonpositive(params) {
		return this.check(/* @__PURE__ */ _lte(0, params));
	},
	multipleOf(value, params) {
		return this.check(/* @__PURE__ */ _multipleOf(value, params));
	},
	step(value, params) {
		return this.check(/* @__PURE__ */ _multipleOf(value, params));
	},
	finite() {
		return this;
	}
}));
function number(params) {
	return /* @__PURE__ */ _number(ZodNumber, params);
}
const ZodNumberFormat = /*@__PURE__*/ $constructor("ZodNumberFormat", (inst, def) => {
	$ZodNumberFormat.init(inst, def);
	ZodNumber.init(inst, def);
});
function int(params) {
	return /* @__PURE__ */ _int(ZodNumberFormat, params);
}
const ZodBoolean = /*@__PURE__*/ $constructor("ZodBoolean", (inst, def) => {
	$ZodBoolean.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => booleanProcessor(inst, ctx, json, params);
});
function boolean(params) {
	return /* @__PURE__ */ _boolean(ZodBoolean, params);
}
const ZodUnknown = /*@__PURE__*/ $constructor("ZodUnknown", (inst, def) => {
	$ZodUnknown.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => void 0;
});
function unknown() {
	return /* @__PURE__ */ _unknown(ZodUnknown);
}
const ZodNever = /*@__PURE__*/ $constructor("ZodNever", (inst, def) => {
	$ZodNever.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => neverProcessor(inst, ctx, json, params);
});
function never(params) {
	return /* @__PURE__ */ _never(ZodNever, params);
}
const ZodArray = /*@__PURE__*/ $constructor("ZodArray", (inst, def) => {
	_ensureDefaultMemoizer();
	$ZodArray.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => arrayProcessor(inst, ctx, json, params);
	inst.element = def.element;
}, {
	min(n, params) {
		return this.check(/* @__PURE__ */ _minLength(n, params));
	},
	nonempty(params) {
		return this.check(/* @__PURE__ */ _minLength(1, params));
	},
	max(n, params) {
		return this.check(/* @__PURE__ */ _maxLength(n, params));
	},
	length(n, params) {
		return this.check(/* @__PURE__ */ _length(n, params));
	},
	unwrap() {
		return this.element;
	}
});
function array(element, params) {
	return /* @__PURE__ */ _array(ZodArray, element, params);
}
const ZodObject = /*@__PURE__*/ $constructor("ZodObject", (inst, def) => {
	_ensureDefaultMemoizer();
	$ZodObjectJIT.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => objectProcessor(inst, ctx, json, params);
	installLazyProp(inst, "shape", (self) => self._zod.def.shape, false);
}, {
	keyof() {
		return _enum(Object.keys(this._zod.def.shape));
	},
	catchall(catchall) {
		return this.clone(mergeDefs(this._zod.def, { catchall }));
	},
	passthrough() {
		return this.clone(mergeDefs(this._zod.def, { catchall: unknown() }));
	},
	loose() {
		return this.clone(mergeDefs(this._zod.def, { catchall: unknown() }));
	},
	strict() {
		return this.clone(mergeDefs(this._zod.def, { catchall: never() }));
	},
	strip() {
		return this.clone(mergeDefs(this._zod.def, { catchall: void 0 }));
	},
	extend(incoming) {
		return extend(this, incoming);
	},
	safeExtend(incoming) {
		return safeExtend(this, incoming);
	},
	merge(other) {
		return merge(this, other);
	},
	pick(mask) {
		return pick(this, mask);
	},
	omit(mask) {
		return omit(this, mask);
	},
	partial(...args) {
		return partial(ZodOptional, this, args[0]);
	},
	exactPartial(...args) {
		return partial(ZodExactOptional, this, args[0], "exactPartial");
	},
	required(...args) {
		return required(ZodNonOptional, this, args[0]);
	}
});
function object(shape, params) {
	const def = {
		type: "object",
		shape: shape ?? {},
		...normalizeParams(params)
	};
	return new ZodObject(def);
}
const ZodUnion = /*@__PURE__*/ $constructor("ZodUnion", (inst, def) => {
	$ZodUnion.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => unionProcessor(inst, ctx, json, params);
	inst.options = def.options;
});
function union(options, params) {
	return new ZodUnion({
		type: "union",
		options,
		...normalizeParams(params)
	});
}
const ZodIntersection = /*@__PURE__*/ $constructor("ZodIntersection", (inst, def) => {
	$ZodIntersection.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => intersectionProcessor(inst, ctx, json, params);
});
function intersection(left, right) {
	return new ZodIntersection({
		type: "intersection",
		left,
		right
	});
}
const ZodEnum = /*@__PURE__*/ $constructor("ZodEnum", (inst, def) => {
	$ZodEnum.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => enumProcessor(inst, ctx, json, params);
	inst.enum = def.entries;
	inst.options = [...inst._zod.values];
	const keys = new Set(Object.keys(def.entries));
	inst.extract = (values, params) => {
		const newEntries = {};
		for (const value of values) if (keys.has(value)) newEntries[value] = def.entries[value];
		else throw new Error(`Key ${value} not found in enum`);
		return new ZodEnum({
			...def,
			checks: [],
			...normalizeParams(params),
			entries: newEntries
		});
	};
	inst.exclude = (values, params) => {
		const newEntries = { ...def.entries };
		for (const value of values) if (keys.has(value)) delete newEntries[value];
		else throw new Error(`Key ${value} not found in enum`);
		return new ZodEnum({
			...def,
			checks: [],
			...normalizeParams(params),
			entries: newEntries
		});
	};
});
function _enum(values, params) {
	const entries = Array.isArray(values) ? Object.fromEntries(values.map((v) => [v, v])) : values;
	return new ZodEnum({
		type: "enum",
		entries,
		...normalizeParams(params)
	});
}
const ZodLiteral = /*@__PURE__*/ $constructor("ZodLiteral", (inst, def) => {
	$ZodLiteral.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => literalProcessor(inst, ctx, json, params);
	inst.values = new Set(def.values);
	Object.defineProperty(inst, "value", { get() {
		if (def.values.length > 1) throw new Error("This schema contains multiple valid literal values. Use `.values` instead.");
		return def.values[0];
	} });
});
function literal(value, params) {
	return new ZodLiteral({
		type: "literal",
		values: Array.isArray(value) ? value : [value],
		...normalizeParams(params)
	});
}
const ZodTransform = /*@__PURE__*/ $constructor("ZodTransform", (inst, def) => {
	_ensureDefaultMemoizer();
	$ZodTransform.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => transformProcessor(inst, ctx, json, params);
	inst._zod.parse = (payload, _ctx) => {
		if (_ctx.direction === "backward") throw new $ZodEncodeError(inst.constructor.name);
		payload.addIssue = (issue$1) => {
			if (typeof issue$1 === "string") payload.issues.push(issue(issue$1, payload.value, def));
			else {
				const _issue = issue$1;
				if (_issue.fatal) _issue.continue = false;
				_issue.code ?? (_issue.code = "custom");
				if (!("input" in _issue)) _issue.input = payload.value;
				_issue.inst ?? (_issue.inst = inst);
				payload.issues.push(issue(_issue));
			}
		};
		const output = def.transform(payload.value, payload);
		if (output instanceof Promise) return output.then((output) => {
			payload.value = output;
			return payload;
		});
		payload.value = output;
		return payload;
	};
});
function transform(fn) {
	return new ZodTransform({
		type: "transform",
		transform: fn
	});
}
const ZodOptional = /*@__PURE__*/ $constructor("ZodOptional", (inst, def) => {
	$ZodOptional.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => optionalProcessor(inst, ctx, json, params);
	inst.unwrap = () => inst._zod.def.innerType;
});
function optional(innerType) {
	return new ZodOptional({
		type: "optional",
		innerType
	});
}
const ZodExactOptional = /*@__PURE__*/ $constructor("ZodExactOptional", (inst, def) => {
	$ZodExactOptional.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => optionalProcessor(inst, ctx, json, params);
	inst.unwrap = () => inst._zod.def.innerType;
});
function exactOptional(innerType) {
	return new ZodExactOptional({
		type: "optional",
		innerType
	});
}
const ZodNullable = /*@__PURE__*/ $constructor("ZodNullable", (inst, def) => {
	$ZodNullable.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => nullableProcessor(inst, ctx, json, params);
	inst.unwrap = () => inst._zod.def.innerType;
});
function nullable(innerType) {
	return new ZodNullable({
		type: "nullable",
		innerType
	});
}
const ZodDefault = /*@__PURE__*/ $constructor("ZodDefault", (inst, def) => {
	$ZodDefault.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => defaultProcessor(inst, ctx, json, params);
	inst.unwrap = () => inst._zod.def.innerType;
	inst.removeDefault = inst.unwrap;
});
function _default(innerType, defaultValue) {
	return new ZodDefault({
		type: "default",
		innerType,
		get defaultValue() {
			return typeof defaultValue === "function" ? defaultValue() : shallowClone(defaultValue);
		}
	});
}
const ZodPrefault = /*@__PURE__*/ $constructor("ZodPrefault", (inst, def) => {
	$ZodPrefault.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => prefaultProcessor(inst, ctx, json, params);
	inst.unwrap = () => inst._zod.def.innerType;
});
function prefault(innerType, defaultValue) {
	return new ZodPrefault({
		type: "prefault",
		innerType,
		get defaultValue() {
			return typeof defaultValue === "function" ? defaultValue() : shallowClone(defaultValue);
		}
	});
}
const ZodNonOptional = /*@__PURE__*/ $constructor("ZodNonOptional", (inst, def) => {
	$ZodNonOptional.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => nonoptionalProcessor(inst, ctx, json, params);
	inst.unwrap = () => inst._zod.def.innerType;
});
function nonoptional(innerType, params) {
	return new ZodNonOptional({
		type: "nonoptional",
		innerType,
		...normalizeParams(params)
	});
}
const ZodCatch = /*@__PURE__*/ $constructor("ZodCatch", (inst, def) => {
	$ZodCatch.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => catchProcessor(inst, ctx, json, params);
	inst.unwrap = () => inst._zod.def.innerType;
	inst.removeCatch = inst.unwrap;
});
function _catch(innerType, catchValue) {
	return new ZodCatch({
		type: "catch",
		innerType,
		catchValue: typeof catchValue === "function" ? catchValue : constantCatch(catchValue)
	});
}
const ZodPipe = /*@__PURE__*/ $constructor("ZodPipe", (inst, def) => {
	$ZodPipe.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => pipeProcessor(inst, ctx, json, params);
	inst.in = def.in;
	inst.out = def.out;
});
function pipe(in_, out) {
	return new ZodPipe({
		type: "pipe",
		in: in_,
		out
	});
}
const ZodReadonly = /*@__PURE__*/ $constructor("ZodReadonly", (inst, def) => {
	$ZodReadonly.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => readonlyProcessor(inst, ctx, json, params);
	inst.unwrap = () => inst._zod.def.innerType;
});
function readonly(innerType) {
	return new ZodReadonly({
		type: "readonly",
		innerType
	});
}
const ZodCustom = /*@__PURE__*/ $constructor("ZodCustom", (inst, def) => {
	$ZodCustom.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => customProcessor(inst, ctx, json, params);
});
function refine(fn, _params = {}) {
	return /* @__PURE__ */ _refine(ZodCustom, fn, _params);
}
function superRefine(fn, params) {
	return /* @__PURE__ */ _superRefine(fn, params);
}
// src/core/capability.ts
/**
* The capability-assertion stage: beyond "booted and exited", prove one NAMED
* capability of the installed plugin is registered, invoked, and its effect
* OBSERVED — the omdsh-INTAKE principle that a clean boot is only a smoke
* test. The stage runs one headless task that asks the agent to call a tool
* (or run a command), then analyzes the durable session log for the paired
* `tool/call` → `tool/result` events (or the command invocation and reply) and
* matches a caller-supplied expectation against the observed output.
*
* Everything here is pure and tolerant: the analyzer never throws on hostile
* or truncated log lines (it skips them), so the capability stage itself can
* only fail through its own process outcome, never through log parsing.
*
* @module dsh-test-drive/capability
*/
/** The capability kinds the stage can assert. */
const CapabilityKindSchema = union([literal("tool"), literal("command")]);
/** Outcome of the capability stage (registered + invoked + observed, in order). */
const CapabilityStatusSchema = union([
	literal("observed"),
	literal("invoked"),
	literal("not-registered"),
	literal("skipped"),
	literal("failed")
]);
/** The exact reply the task text demands; also the run-completion marker. */
const CAPABILITY_DONE_MARKER = "capability-check-done";
/** Maximum length of the `args` payload handed to the capability task. */
const MAX_CAPABILITY_ARGS_LENGTH = 4e3;
/** Maximum length of the `expect` literal matched against the observed output. */
const MAX_CAPABILITY_EXPECT_LENGTH = 2e3;
/** Allowed characters for an asserted tool or command name. */
const CAPABILITY_NAME_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9._/-]*$/;
/** Regex-escape a literal for embedding in a pattern. */
function escapeRegex$1(source) {
	return source.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
}
/**
* Compile the headless task text that makes the agent exercise the capability.
*
* @param spec - the capability to exercise.
* @returns the task text; never empty.
*/
function buildCapabilityTask(spec) {
	if (spec.kind === "tool") return [
		`Call the tool "${spec.name}" with exactly these arguments:`,
		spec.args === "" ? "(no arguments)" : spec.args,
		`After the tool returns, reply with exactly: ${CAPABILITY_DONE_MARKER}`
	].join("\n");
	return [`Run the command /${spec.name}${spec.args === "" ? "" : ` ${spec.args}`}.`, `Then reply with exactly: ${CAPABILITY_DONE_MARKER}`].join("\n");
}
/** Parse one JSONL line into `{ type, data }` or undefined for unparseable lines. */
function parseLine(line) {
	try {
		const value = JSON.parse(line);
		if (typeof value.type !== "string" || value.data === void 0) return void 0;
		return {
			type: value.type,
			data: value.data
		};
	} catch {
		return;
	}
}
/** Lowercased serialization of one event payload for expectation matching. */
function haystack(data) {
	return JSON.stringify(data).toLowerCase();
}
/** Whether the serialized payload contains the expectation (case-insensitive). */
function matchesExpect(data, expect) {
	return expect !== "" && haystack(data).includes(expect.toLowerCase());
}
/**
* Analyze a durable session log against one capability spec. Tolerant: every
* unparseable or unrelated line is skipped, and missing evidence degrades to
* the highest status actually reached (`not-registered` when the invocation
* never appears, `invoked` when it ran but the expectation never appeared,
* `observed` only when both hold).
*
* @param log - the raw JSONL session text (as persisted by the harness).
* @param spec - the asserted capability.
* @returns the settled analysis; never throws.
*/
function analyzeSessionLog(log, spec) {
	const lines = [];
	for (const line of log.split("\n")) {
		const parsed = parseLine(line);
		if (parsed !== void 0) lines.push(parsed);
	}
	if (spec.kind === "tool") {
		const callIds = [];
		for (const line of lines) {
			if (line.type !== "tool/call") continue;
			const data = line.data;
			if (data.name === spec.name && typeof data.callId === "string") callIds.push(data.callId);
		}
		if (callIds.length === 0) return {
			status: "not-registered",
			detail: `no tool/call event names "${spec.name}" — the tool was never registered or the agent never invoked it`,
			expectMatched: false
		};
		for (const line of lines) {
			if (line.type !== "tool/result") continue;
			const serialized = JSON.stringify(line.data);
			if (!callIds.some((callId) => serialized.includes(callId))) continue;
			if (matchesExpect(line.data, spec.expect)) return {
				status: "observed",
				detail: `tool "${spec.name}" called and its result contains the expectation`,
				expectMatched: true
			};
		}
		return {
			status: "invoked",
			detail: `tool "${spec.name}" was called (${callIds.length} call(s)) but no paired result contains the expectation`,
			expectMatched: false
		};
	}
	const commandPattern = new RegExp(`/${escapeRegex$1(spec.name)}(?:\\s|$)`, "u");
	let invokedAt = -1;
	for (let i = 0; i < lines.length; i += 1) {
		const line = lines[i];
		if (line === void 0) continue;
		if (line.type !== "user/message") continue;
		if (commandPattern.test(JSON.stringify(line.data))) {
			invokedAt = i;
			break;
		}
	}
	if (invokedAt === -1) return {
		status: "not-registered",
		detail: `no user message invoking /${spec.name} — the agent never ran the command`,
		expectMatched: false
	};
	for (let i = invokedAt + 1; i < lines.length; i += 1) {
		const line = lines[i];
		if (line === void 0) continue;
		if (line.type === "assistant/message" && matchesExpect(line.data, spec.expect)) return {
			status: "observed",
			detail: `command /${spec.name} ran and a reply contains the expectation`,
			expectMatched: true
		};
	}
	return {
		status: "invoked",
		detail: `command /${spec.name} was invoked but no reply contains the expectation (unknown command or empty output)`,
		expectMatched: false
	};
}
/** Maximum length of the user-supplied headless task. */
const MAX_HEADLESS_TASK_LENGTH = 2e3;
/** Bounds shared by every stage timeout. */
const MIN_STAGE_TIMEOUT_MS = 1e3;
const MAX_STAGE_TIMEOUT_MS = 36e5;
const MAX_OUTPUT_TAIL_BYTES = 256e3;
/** Default: a forwarded environment-name list is empty, so child profiles never see host credentials. */
const DEFAULT_FORWARD_ENV = [];
/** Throw the standard fail-loud config error for one invalid field. */
function invalid(field, detail) {
	throw new Error(`dsh-test-drive: config.${field} ${detail}`);
}
/**
* Resolve raw config to the runtime policy, re-validating defaults and bounds.
*
* @param config - raw loader config; `undefined` for a bare row.
* @returns the frozen resolved config.
*/
function resolveConfig(config) {
	const profileName = config?.profileName ?? "headless";
	if (profileName.length === 0) invalid("profileName", "must be a non-empty profile template name");
	if (!/^[a-zA-Z0-9._-]+$/.test(profileName)) invalid("profileName", `contains unsupported characters (got ${JSON.stringify(profileName)})`);
	const dshBin = config?.dshBin ?? "";
	if (typeof dshBin !== "string") invalid("dshBin", "must be a string path or empty");
	const headlessTask = config?.headlessTask ?? "Reply with exactly: ok";
	if (typeof headlessTask !== "string" || headlessTask.length > 2e3) invalid("headlessTask", `must be a string of at most ${MAX_HEADLESS_TASK_LENGTH} characters (empty skips the smoke stage)`);
	const forwardEnv = [...config?.forwardEnv ?? DEFAULT_FORWARD_ENV];
	for (const name of forwardEnv) if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(name)) invalid("forwardEnv", `entry ${JSON.stringify(name)} is not a valid environment variable name`);
	const allowBuilds = config?.allowBuilds ?? true;
	if (typeof allowBuilds !== "boolean") invalid("allowBuilds", "must be a boolean");
	const installTimeoutMs = config?.installTimeoutMs ?? 6e5;
	if (!Number.isFinite(installTimeoutMs) || installTimeoutMs < 1e3 || installTimeoutMs > 36e5) invalid("installTimeoutMs", `must be a finite number between ${MIN_STAGE_TIMEOUT_MS} and ${MAX_STAGE_TIMEOUT_MS}`);
	const configTimeoutMs = config?.configTimeoutMs ?? 6e4;
	if (!Number.isFinite(configTimeoutMs) || configTimeoutMs < 1e3 || configTimeoutMs > 36e5) invalid("configTimeoutMs", `must be a finite number between ${MIN_STAGE_TIMEOUT_MS} and ${MAX_STAGE_TIMEOUT_MS}`);
	const smokeTimeoutMs = config?.smokeTimeoutMs ?? 3e5;
	if (!Number.isFinite(smokeTimeoutMs) || smokeTimeoutMs < 1e3 || smokeTimeoutMs > 36e5) invalid("smokeTimeoutMs", `must be a finite number between ${MIN_STAGE_TIMEOUT_MS} and ${MAX_STAGE_TIMEOUT_MS}`);
	const capabilityTimeoutMs = config?.capabilityTimeoutMs ?? 3e5;
	if (!Number.isFinite(capabilityTimeoutMs) || capabilityTimeoutMs < 1e3 || capabilityTimeoutMs > 36e5) invalid("capabilityTimeoutMs", `must be a finite number between ${MIN_STAGE_TIMEOUT_MS} and ${MAX_STAGE_TIMEOUT_MS}`);
	const capabilityEnabled = config?.capability?.enabled ?? false;
	if (typeof capabilityEnabled !== "boolean") invalid("capability.enabled", "must be a boolean");
	const capabilityKind = config?.capability?.kind ?? "tool";
	if (capabilityKind !== "tool" && capabilityKind !== "command") invalid("capability.kind", `must be 'tool' or 'command' (got ${JSON.stringify(capabilityKind)})`);
	const capabilityName = config?.capability?.name ?? "";
	const capabilityArgs = config?.capability?.args ?? "";
	const capabilityExpect = config?.capability?.expect ?? "";
	if (capabilityEnabled) {
		if (capabilityName.length === 0) invalid("capability.name", "is required when capability.enabled is true");
		if (capabilityName.length > 200 || !CAPABILITY_NAME_PATTERN.test(capabilityName)) invalid("capability.name", `must be at most 200 characters of [a-zA-Z0-9._/-] starting alphanumerically`);
		if (capabilityArgs.length > 4e3) invalid("capability.args", `must be at most ${MAX_CAPABILITY_ARGS_LENGTH} characters`);
		if (capabilityExpect.length > 2e3) invalid("capability.expect", `must be at most ${MAX_CAPABILITY_EXPECT_LENGTH} characters`);
	}
	const uninstallTimeoutMs = config?.uninstallTimeoutMs ?? 12e4;
	if (!Number.isFinite(uninstallTimeoutMs) || uninstallTimeoutMs < 1e3 || uninstallTimeoutMs > 36e5) invalid("uninstallTimeoutMs", `must be a finite number between ${MIN_STAGE_TIMEOUT_MS} and ${MAX_STAGE_TIMEOUT_MS}`);
	const outputTailBytes = config?.outputTailBytes ?? 8e3;
	if (!Number.isInteger(outputTailBytes) || outputTailBytes < 256 || outputTailBytes > 256e3) invalid("outputTailBytes", `must be an integer between 256 and ${MAX_OUTPUT_TAIL_BYTES}`);
	const keepTempDirs = config?.keepTempDirs ?? false;
	if (typeof keepTempDirs !== "boolean") invalid("keepTempDirs", "must be a boolean");
	const maxBatchTargets = config?.maxBatchTargets ?? 20;
	if (!Number.isInteger(maxBatchTargets) || maxBatchTargets < 1 || maxBatchTargets > 200) invalid("maxBatchTargets", `must be an integer between 1 and 200`);
	const batchConcurrency = config?.batchConcurrency ?? 1;
	if (!Number.isInteger(batchConcurrency) || batchConcurrency < 1 || batchConcurrency > 4) invalid("batchConcurrency", `must be an integer between 1 and 4`);
	return Object.freeze({
		profileName,
		dshBin,
		headlessTask,
		forwardEnv: Object.freeze(forwardEnv),
		allowBuilds,
		installTimeoutMs,
		configTimeoutMs,
		smokeTimeoutMs,
		capabilityTimeoutMs,
		capability: Object.freeze({
			enabled: capabilityEnabled,
			kind: capabilityKind,
			name: capabilityName,
			args: capabilityArgs,
			expect: capabilityExpect
		}),
		uninstallTimeoutMs,
		outputTailBytes,
		keepTempDirs,
		maxBatchTargets,
		batchConcurrency
	});
}
// src/core/session-log.ts
/**
* Session-store discovery and multi-frame Zstandard decoding for the
* capability stage.
*
* The harness stores one artifact per session at
* `$DSH_HOME/sessions/<projectKey>/<sessionId>/session[.vN].jsonl[.zstd]`
* (host `packages/session/session-persistence-jsonl/src/format.ts:253-303`
* on the `0.1.5-alpha.1` baseline), and writes the compressed form as a
* CONCATENATED Zstandard container — one frame per durable batch — so Node's
* whole-file `zstdDecompressSync` silently returns only the first frame
* (`header`). Reading a real log therefore requires both the two-level
* drill-down and per-frame decoding.
*
* Everything here is tolerant by contract: discovery degrades to `undefined`
* and reading to `''`, never throwing into the drive pipeline.
*
* @module dsh-test-drive/session-log
*/
/**
* Canonical generation log basename: `session.jsonl` (generation 0) or
* `session.vN.jsonl` with N >= 1, optionally carrying the `.zstd` compression
* suffix. Temporary, uppercase, leading-zero, and `.v0` names are not
* canonical (host `session-format/src/filename.ts:5-17` plus the compression
* suffix of `session-persistence-jsonl/src/format.ts:41-47`).
*/
const GENERATION_LOG_NAME = /^session(?:\.v([1-9][0-9]*))?\.jsonl(\.zstd)?$/u;
/** Zstandard frame magic, little-endian. */
const ZSTD_MAGIC = 4247762216;
/**
* Locate complete frames without decompressing their blocks. Invalid complete
* structure rejects; EOF inside the final frame returns its start so a crashed
* write still yields every earlier frame.
*
* Mirrored from DeepSeek Harness
* `packages/session/session-persistence-jsonl/src/zstd.ts:48-104` (MIT, host
* baseline `dsh-v0.1.5-alpha.1`, commit `19d2e38480`) because that helper is
* not part of the published package surface; the license notice lives in
* THIRD_PARTY_NOTICES.md.
*
* @param buffer - complete bytes currently present in the session artifact.
* @param maxFrames - optional complete-frame limit for metadata-only readers.
* @returns complete frame ranges and an optional incomplete-final-frame start.
*/
function scanZstdFrames(buffer, maxFrames = Number.POSITIVE_INFINITY) {
	const frames = [];
	let offset = 0;
	while (offset < buffer.length) {
		const start = offset;
		if (buffer.length - offset < 4) return {
			frames,
			tornStart: start
		};
		if (buffer.readUInt32LE(offset) !== ZSTD_MAGIC) throw new Error(`corrupt Zstandard session log: invalid frame magic at byte ${offset}`);
		offset += 4;
		if (offset === buffer.length) return {
			frames,
			tornStart: start
		};
		const descriptor = buffer.readUInt8(offset);
		offset += 1;
		if ((descriptor & 24) !== 0) throw new Error(`corrupt Zstandard session log: reserved frame-header bit at byte ${offset - 1}`);
		const contentSizeFlag = descriptor >>> 6;
		const singleSegment = (descriptor & 32) !== 0;
		const checksum = (descriptor & 4) !== 0;
		const dictionaryFlag = descriptor & 3;
		const dictionaryBytes = dictionaryFlag === 3 ? 4 : dictionaryFlag;
		const contentSizeBytes = contentSizeFlag === 0 ? singleSegment ? 1 : 0 : 1 << contentSizeFlag;
		const remainingHeaderBytes = (singleSegment ? 0 : 1) + dictionaryBytes + contentSizeBytes;
		if (buffer.length - offset < remainingHeaderBytes) return {
			frames,
			tornStart: start
		};
		offset += remainingHeaderBytes;
		for (;;) {
			if (buffer.length - offset < 3) return {
				frames,
				tornStart: start
			};
			const blockHeader = buffer.readUIntLE(offset, 3);
			offset += 3;
			const lastBlock = (blockHeader & 1) !== 0;
			const blockType = blockHeader >>> 1 & 3;
			const blockSize = blockHeader >>> 3;
			if (blockType === 3) throw new Error(`corrupt Zstandard session log: reserved block type at byte ${offset - 3}`);
			const payloadBytes = blockType === 1 ? 1 : blockSize;
			if (buffer.length - offset < payloadBytes) return {
				frames,
				tornStart: start
			};
			offset += payloadBytes;
			if (lastBlock) break;
		}
		if (checksum) {
			if (buffer.length - offset < 4) return {
				frames,
				tornStart: start
			};
			offset += 4;
		}
		frames.push({
			start,
			end: offset
		});
		if (frames.length === maxFrames) return { frames };
	}
	return { frames };
}
/**
* Decode a concatenated Zstandard container frame by frame. A torn final
* frame contributes nothing, while every complete frame before it still
* decodes — Node's own whole-file API would silently return only the first.
*
* @param buffer - the artifact bytes.
* @returns the concatenated plaintext of every complete frame.
* @throws when a structurally complete frame fails validation (the caller
*   applies the tolerant `''` contract).
*/
function decodeZstdFrames(buffer) {
	const { frames } = scanZstdFrames(buffer);
	let text = "";
	for (const { start, end } of frames) text += zstdDecompressSync(buffer.subarray(start, end)).toString("utf8");
	return text;
}
/**
* Newest canonical artifact inside one session directory: the highest
* generation wins regardless of mtime, with mtime only breaking a tie between
* two artifacts of the same generation (host
* `resolveGenerationInDirectory`, `session-persistence-jsonl/src/index.ts:1369-1405`).
*/
async function newestGenerationIn(sessionDir) {
	let entries;
	try {
		entries = await readdir(sessionDir, { withFileTypes: true });
	} catch {
		return;
	}
	let best;
	for (const entry of entries) {
		const match = GENERATION_LOG_NAME.exec(entry.name);
		if (match === null) continue;
		const path = join(sessionDir, entry.name);
		try {
			const info = await stat(path);
			if (!info.isFile()) continue;
			const candidate = {
				path,
				zstd: match[2] === ".zstd",
				generation: match[1] === void 0 ? 0 : Number(match[1]),
				mtimeMs: info.mtimeMs
			};
			if (best === void 0 || candidate.generation > best.generation || candidate.generation === best.generation && candidate.mtimeMs > best.mtimeMs) best = candidate;
		} catch {}
	}
	return best;
}
/**
* Find the newest canonical session artifact under `$DSH_HOME/sessions`.
* The store is two levels deep (`<projectKey>/<sessionId>/`), so a flat scan
* only ever sees project directories; `_no-cwd` is an ordinary project key.
* A non-directory entry (root-level stray file, symlink) is skipped, matching
* the host's `listProjectDirs`/`listSessionDirs` directory-only rule.
*
* @param home - the throwaway DSH_HOME.
* @returns the newest artifact, or undefined when the store is missing/empty.
*/
async function findNewestSessionLog(home) {
	const root = join(home, "sessions");
	let projects;
	try {
		projects = await readdir(root, { withFileTypes: true });
	} catch {
		return;
	}
	let newest;
	for (const project of projects) {
		if (!project.isDirectory()) continue;
		const projectDir = join(root, project.name);
		let sessions;
		try {
			sessions = await readdir(projectDir, { withFileTypes: true });
		} catch {
			continue;
		}
		for (const session of sessions) {
			if (!session.isDirectory()) continue;
			const candidate = await newestGenerationIn(join(projectDir, session.name));
			if (candidate !== void 0 && (newest === void 0 || candidate.mtimeMs > newest.mtimeMs)) newest = candidate;
		}
	}
	return newest;
}
/**
* Read the newest session log text, decoding every Zstandard frame.
*
* Tolerant by contract: a missing store, an unreadable artifact, or a corrupt
* container yields `''` so the capability stage degrades instead of throwing.
*
* @param home - the throwaway DSH_HOME.
* @param maxBytes - cap on the returned text (tail end kept).
* @returns the newest session file's text, or '' when none exists.
*/
async function readNewestSessionLog(home, maxBytes) {
	const newest = await findNewestSessionLog(home);
	if (newest === void 0) return "";
	try {
		const text = newest.zstd ? decodeZstdFrames(await readFile(newest.path)) : await readFile(newest.path, "utf8");
		return text.length <= maxBytes ? text : text.slice(text.length - maxBytes);
	} catch {
		return "";
	}
}
// src/core/driver.ts
/**
* The `dsh` CLI driver: locates a spawnable dsh executable (config override,
* PATH lookup, or npm shim parsing on Windows), runs each stage as a managed
* subprocess with a throwaway DSH_HOME, and interprets the outputs the stages
* produce (the pnpm allowBuilds gate, the config-dump layer list, and boot
* failure markers). No shell is ever involved — argv is passed directly — so
* hostile target specs cannot inject commands.
*
* @module dsh-test-drive/driver
*/
/** Cap on collected output per stream (in-memory tail). */
const COLLECT_MAX_BYTES = 65536;
/** Cap on the complete spill file per stream. */
const SPILL_MAX_BYTES = 1048576;
/** Grace between SIGTERM and SIGKILL for a stage process. */
const STAGE_GRACE_MS = 5e3;
/** Bootstrap bundles the `dsh plugin` template may add; the installed plugin is any OTHER bundle. */
const TEMPLATE_BUNDLES = [
	"@deepseek-ai/dsh-base",
	"@deepseek-ai/dsh-headless",
	"@deepseek-ai/dsh-web-app"
];
/** Loader-failure markers that make a boot smoke fail regardless of exit code. */
const BOOT_FAILURE_MARKERS = [
	/plugin\(s\) failed to load/iu,
	/did not activate/iu,
	/\bFAILED\b/u,
	/could not be resolved/iu,
	/fiber state/iu,
	/cannot find module/iu,
	/cannot find package/iu,
	/ERR_MODULE_NOT_FOUND/u,
	/\bMODULE_NOT_FOUND\b/u
];
/** Parse the JS target out of an npm-generated `.cmd`/`.bat` shim. */
function parseNpmShim(shimPath, shimText) {
	const rel = /"%dp0%\\(?<rel>node_modules\\[^"]+\.(?:js|cjs|mjs))"/u.exec(shimText)?.groups?.rel;
	if (rel === void 0) {
		if (/ELECTRON_RUN_AS_NODE|DSH Desktop/iu.test(shimText)) throw new Error(`dsh-test-drive: ${shimPath} is the DSH Desktop launcher, whose CLI policy rejects a second headless DSH boot; set config.dshBin to an npm/pnpm-installed dsh CLI (or a plain Node + dsh JS entry) instead`);
		throw new Error(`dsh-test-drive: cannot parse npm shim ${shimPath} (no dp0-relative JS target found)`);
	}
	return join(dirname(shimPath), rel);
}
/** Regex escape for layer/row matching against package names. */
function escapeRegex(source) {
	return source.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
}
/** Whether a target spec names a git-hosted source (subject to pnpm's prepare gate). */
function isGitLike(target) {
	return /^git\+|^github:|^git@|\.git(?:#|$)/u.test(target);
}
/**
* Classify a sanitized target spec by how `dsh plugin add` addresses it.
* Pure: no filesystem or network access.
*
* @param spec - the sanitized target.
* @returns the address kind.
*/
function classifyTarget(spec) {
	if (spec.startsWith("npm:")) return "npm";
	if (spec.endsWith(".tgz")) return "tarball";
	if (spec.startsWith("file:")) return spec.endsWith(".tgz") ? "tarball" : "path";
	if (spec.startsWith("git+") || spec.startsWith("github:") || spec.startsWith("git@") || /\.git(?:#|$)/u.test(spec)) return "repo";
	if (isAbsolute(spec) || spec.startsWith(".")) return "path";
	if (/^(@[a-z0-9-~][a-z0-9-._~]*\/)?[a-z0-9-~][a-z0-9-._~]*(@.+)?$/u.test(spec)) return "npm";
	return "repo";
}
/**
* Extract the allowBuilds key pnpm reports as blocked.
*
* Two shapes are supported:
* - the classic `Ignored build scripts: <name>.` line (one package name);
* - pnpm's git-prepare gate (`ERR_PNPM_GIT_DEP_PREPARE_NOT_ALLOWED`), whose
*   help block prints the EXACT allowBuilds key — for a git target that key is
*   a tarball URL spec (`name@https://…/tar.gz/<sha>`), not a bare name.
*/
function parseIgnoredBuildScript(output) {
	const ignored = /ignored build scripts:?\s*([a-z0-9][a-z0-9@/._-]*?)\s*\./iu.exec(output)?.[1];
	if (ignored !== void 0) return ignored;
	const lines = output.split(/\r?\n/u);
	const start = lines.findIndex((line) => /allowBuilds:\s*$/u.test(line));
	if (start === -1) return void 0;
	let key = "";
	for (let index = start + 1; index < lines.length; index += 1) {
		const line = lines[index];
		if (line === void 0) break;
		const trimmed = line.trim();
		if (trimmed === "") continue;
		const terminated = /^(.*?):\s*(?:true|false)\s*$/u.exec(trimmed);
		if (terminated !== null) {
			key += terminated[1] ?? "";
			break;
		}
		if (!/^\s{2,}/u.test(line)) break;
		key += trimmed;
	}
	return key === "" ? void 0 : key;
}
/** Extract `# == <label>` layer labels from a `--dump-config` output. */
function parseDumpLayers(dump) {
	const layers = [];
	for (const match of dump.matchAll(/^# == (.+)$/gmu)) {
		const label = match[1];
		if (label !== void 0) layers.push(label.trim());
	}
	return layers;
}
/**
* Whether the dump proves the installed package's patch took effect: a layer
* label mentions it, or a row names it.
*/
function dumpMentionsPackage(dump, packageName) {
	const namePattern = new RegExp(`(^|[^a-z0-9@/._-])${escapeRegex(packageName)}([^a-z0-9@/._-]|$)`, "iu");
	const rowPattern = new RegExp(`^\\s*name:\\s*["']?${escapeRegex(packageName)}["']?\\s*$`, "mu");
	const layers = parseDumpLayers(dump).filter((label) => namePattern.test(label));
	return {
		mentioned: layers.length > 0 || rowPattern.test(dump),
		layers
	};
}
/** Whether the text contains any loader-failure marker. */
function hasBootFailure(text) {
	return BOOT_FAILURE_MARKERS.some((marker) => marker.test(text));
}
/**
* Locate and run the `dsh` CLI. The located argv prefix is cached per driver
* instance, so every stage reuses one resolution.
*/
var DshDriver = class {
	deps;
	located;
	constructor(deps) {
		this.deps = deps;
	}
	/** Resolve the spawn argv prefix `[program, ...args]` for the dsh CLI. */
	locate() {
		this.located ??= this.resolveLocation();
		return this.located;
	}
	/** The one subprocess seam, resolved from the explicit adapter or `ctx`. */
	service() {
		const service = this.deps.subprocess ?? this.deps.ctx?.subprocess;
		if (service === void 0) throw new Error("dsh-test-drive: driver needs either deps.subprocess or deps.ctx.subprocess");
		return service;
	}
	async resolveLocation() {
		const { config, log } = this.deps;
		if (this.deps.dshArgv !== void 0 && this.deps.dshArgv.length > 0) {
			log(`test-drive: using explicit dsh argv ${this.deps.dshArgv[0] ?? ""}`);
			return [...this.deps.dshArgv];
		}
		if (config.dshBin !== "") {
			if (!isAbsolute(config.dshBin)) throw new Error(`dsh-test-drive: config.dshBin must be an absolute path (got ${JSON.stringify(config.dshBin)})`);
			if (/\.(?:[cm]?js)$/u.test(config.dshBin)) return [process.execPath, config.dshBin];
			log(`test-drive: using config.dshBin ${config.dshBin}`);
			return [config.dshBin];
		}
		const found = await this.service().resolveExecutable("dsh");
		if (process.platform === "win32" && /\.(?:cmd|bat)$/iu.test(found)) {
			const target = parseNpmShim(found, await readFile(found, "utf8"));
			await access(target);
			log(`test-drive: dsh resolved to ${target} (via npm shim ${found})`);
			return [process.execPath, target];
		}
		if (/\.ps1$/iu.test(found)) throw new Error(`dsh-test-drive: dsh resolved to the PowerShell shim ${found}; set config.dshBin to the JS entry (or the .cmd shim)`);
		log(`test-drive: dsh resolved to ${found}`);
		return [found];
	}
	/** Compile the child environment: throwaway home, redirected store, deliberate forwards only. */
	buildEnv(home, storeDir) {
		const env = {
			DSH_HOME: home,
			npm_config_store_dir: storeDir
		};
		for (const name of this.deps.config.forwardEnv) {
			const value = process.env[name];
			if (value !== void 0) env[name] = value;
		}
		return env;
	}
	/**
	* Run one dsh CLI invocation as a managed subprocess.
	*
	* @param args - dsh arguments (argv entries, never shell-interpreted).
	* @param options - isolation facts and the stage deadline.
	* @returns the collected outcome.
	*/
	async run(args, options) {
		const started = Date.now();
		const outer = options.signal;
		const deadline = AbortSignal.timeout(options.timeoutMs);
		const signal = outer === void 0 ? deadline : AbortSignal.any([outer, deadline]);
		let handle;
		try {
			const [program, ...prefix] = await this.locate();
			if (program === void 0) throw new Error("dsh location resolved to an empty argv");
			const spec = {
				argv: [
					program,
					...prefix,
					...args
				],
				cwd: options.cwd,
				stdio: {
					stdin: "ignore",
					stdout: {
						maxBytes: COLLECT_MAX_BYTES,
						spill: { maxBytes: SPILL_MAX_BYTES }
					},
					stderr: {
						maxBytes: COLLECT_MAX_BYTES,
						spill: { maxBytes: SPILL_MAX_BYTES }
					}
				},
				graceMs: STAGE_GRACE_MS,
				signal,
				env: this.buildEnv(options.home, options.storeDir)
			};
			handle = this.service().spawn(spec);
		} catch (error) {
			return {
				exitCode: null,
				stdout: "",
				stderr: `spawn failed: ${String(error)}`,
				truncated: false,
				durationMs: Date.now() - started,
				timedOut: false
			};
		}
		let outcome;
		try {
			outcome = await handle.done;
		} catch (error) {
			return {
				exitCode: null,
				stdout: "",
				stderr: `spawn failed: ${String(error)}`,
				truncated: false,
				durationMs: Date.now() - started,
				timedOut: false
			};
		}
		const stdoutRead = handle.collected.stdout?.readFrom(0);
		const stderrRead = handle.collected.stderr?.readFrom(0);
		const stdout = stdoutRead?.text ?? "";
		const stderr = stderrRead?.text ?? "";
		const truncated = (stdoutRead?.lossy ?? false) || (stderrRead?.lossy ?? false);
		return {
			exitCode: outcome.exitCode,
			stdout,
			stderr,
			truncated,
			durationMs: Date.now() - started,
			timedOut: deadline.aborted && (outer === void 0 || !outer.aborted)
		};
	}
	/** Write the profile's pnpm-workspace.yaml allowBuilds entry for one package. */
	async writeAllowBuilds(profileDir, packageName) {
		await mkdir(profileDir, { recursive: true });
		const key = packageName.replace(/'/gu, "''");
		await writeFile(join(profileDir, "pnpm-workspace.yaml"), `allowBuilds:\n  '${key}': true\n`, "utf8");
		this.deps.log(`test-drive: allowlisted prepare build for ${packageName} in ${join(profileDir, "pnpm-workspace.yaml")}`);
	}
	/**
	* Run the install stage: `dsh plugin --profile <name> add <target>`, with the
	* documented allowBuilds retry for git-hosted sources.
	*/
	async add(target, options) {
		const { config } = this.deps;
		const args = [
			"plugin",
			"--profile",
			config.profileName,
			"add",
			target
		];
		const first = await this.run(args, options);
		const combined = `${first.stdout}\n${first.stderr}`;
		const blocked = config.allowBuilds ? parseIgnoredBuildScript(combined) : void 0;
		if (first.exitCode === 0 || blocked === void 0) return {
			run: first,
			attempts: 1,
			allowBuildsNeeded: false
		};
		await this.writeAllowBuilds(join(options.home, "profiles", config.profileName), blocked);
		return {
			run: await this.run(args, options),
			attempts: 2,
			allowBuildsNeeded: true
		};
	}
	/** Run the config stage: `dsh --profile <name> --dump-config`. */
	async dumpConfig(options) {
		return this.run([
			"--profile",
			this.deps.config.profileName,
			"--dump-config"
		], options);
	}
	/** Run the boot-smoke stage: `dsh --profile <name> <task>`. */
	async smokeTask(task, options) {
		return this.run([
			"--profile",
			this.deps.config.profileName,
			task
		], options);
	}
	/**
	* Read the newest durable session log from a throwaway home's session store.
	* Used by the capability stage to observe what the headless task actually
	* did (tool calls, command replies). The harness layout is
	* `sessions/<projectKey>/<sessionId>/session[.vN].jsonl[.zstd]`, so the
	* lookup drills two levels down, prefers the highest canonical generation,
	* and decodes every Zstandard frame (the artifact is a concatenated-frame
	* container; Node's whole-file API silently returns only the first frame).
	* Tolerant by contract: a missing or empty store yields '' so the stage
	* degrades instead of throwing.
	*
	* @param home - the throwaway DSH_HOME.
	* @param maxBytes - cap on the returned text (tail end kept).
	* @returns the newest session file's text, or '' when none exists.
	*/
	async readNewestSession(home, maxBytes) {
		return readNewestSessionLog(home, maxBytes);
	}
	/** Run the uninstall stage: `dsh plugin --profile <name> remove <pkg>`. */
	async remove(packageName, options) {
		return this.run([
			"plugin",
			"--profile",
			this.deps.config.profileName,
			"remove",
			packageName
		], options);
	}
	/** Ask the CLI for its version (cached per driver instance). */
	async version(options) {
		return (await this.run(["--version"], options)).stdout.trim().split("\n").at(-1)?.trim() ?? "";
	}
	/**
	* Read the installed plugin's own manifest from the profile's node_modules.
	*
	* @param profileDir - the profile directory `dsh plugin` manages.
	* @returns the package facts, or undefined when no out-of-tree bundle is installed.
	*/
	async readInstalledPackage(profileDir) {
		let manifestPath;
		let text;
		try {
			manifestPath = join(profileDir, "package.json");
			text = await readFile(manifestPath, "utf8");
		} catch {
			return;
		}
		const installed = (JSON.parse(text).dsh?.profile?.bundles ?? []).filter((name) => !TEMPLATE_BUNDLES.includes(name));
		if (installed.length === 0) return void 0;
		const name = installed[installed.length - 1];
		if (name === void 0) return void 0;
		const segments = name.split("/");
		try {
			const pkgPath = join(profileDir, "node_modules", ...segments, "package.json");
			const pkg = JSON.parse(await readFile(pkgPath, "utf8"));
			return {
				packageName: name,
				packageVersion: typeof pkg.version === "string" ? pkg.version : "unknown",
				hasBundleManifest: typeof pkg.dsh?.bundle?.patch === "string"
			};
		} catch {
			return {
				packageName: name,
				packageVersion: "unknown",
				hasBundleManifest: false
			};
		}
	}
};
/** Resolve a relative local path target against the session workspace, falling back to the host's invoking directory. */
function anchorLocalTarget(target, cwd) {
	return resolve(cwd ?? process.cwd(), target);
}
// src/core/result.ts
/**
* The structured test-drive result: one record per driven target, plus the
* batch matrix that aggregates them. This is the machine-readable output
* contract that downstream consumers (dsh-score and other scoring pipelines)
* read from the `test-drive` storage domain — every field a scorer needs
* (install/smoke status, durations, failure summaries) is a first-class
* field, never prose to be parsed.
*
* The zod schemas are the single source of truth for both the domain record
* types (validated at the durable boundary by `dsh-storage-domain`) and the
* TypeScript record types (`z.infer`), so the written records and the typed
* runtime can never drift.
*
* @module dsh-test-drive/result
*/
/** Schema discriminator of every record this plugin writes (version 1). */
const RESULT_SCHEMA = "dsh-test-drive/v1";
/** How the target was addressed. */
const TargetKindSchema = union([
	literal("repo"),
	literal("npm"),
	literal("path"),
	literal("tarball")
]);
/** Outcome of an ordinary stage: it ran and passed, ran and failed, or was skipped by config. */
const StageStatusSchema = union([
	literal("pass"),
	literal("fail"),
	literal("skipped")
]);
/** Boot-smoke outcome: clean boot plus completed task, failed boot, clean boot with an inconclusive task, or skipped. */
const SmokeStatusSchema = union([
	literal("pass"),
	literal("fail"),
	literal("boot-ok"),
	literal("skipped")
]);
/** Overall verdict of one drive run. */
const DriveVerdictSchema = union([
	literal("pass"),
	literal("fail"),
	literal("partial"),
	literal("unknown")
]);
/** Shared stage facts: exit, duration, attempts, and sanitized summary/tail. */
const StageResultSchema = object({
	/** How the stage ended. */
	status: StageStatusSchema,
	/** Process exit code; null when the stage never produced a process outcome (timeout or spawn failure). */
	exitCode: number().int().nullable(),
	/** Wall-clock duration of the stage in milliseconds. */
	durationMs: number().finite(),
	/** Spawn attempts (the allowBuilds retry is attempt 2). */
	attempts: number().int().min(0),
	/** One-line sanitized verdict, e.g. `exit 0 after allowBuilds allowance`. */
	summary: string(),
	/** Sanitized output tail (secrets and temp paths redacted). */
	outputTail: string()
});
/** Install stage extras: whether the pnpm allowBuilds gate was hit and allowed. */
const InstallStageResultSchema = StageResultSchema.extend({ 
/** True when pnpm blocked a git prepare build and the retry allowlisted it. */
allowBuildsNeeded: boolean() });
/** Config-dump stage extras: whether the bundle patch provably took effect. */
const ConfigStageResultSchema = StageResultSchema.extend({
	/** True when the dump contains the installed package as a layer or a row. */
	patchEffective: boolean(),
	/** Sanitized layer labels in the dump that mention the package. */
	layers: array(string())
});
/** Boot-smoke stage: loader-failure facts plus the optional task completion. */
const SmokeStageResultSchema = StageResultSchema.extend({
	/** `pass`/`fail`/`boot-ok`/`skipped`, see {@link SmokeStatus}. */
	status: SmokeStatusSchema,
	/** True when loader-failure markers (FAILED / failed to load / did not activate) appeared. */
	bootFailed: boolean(),
	/** True when the headless one-shot task reported completion (exit 0). */
	taskCompleted: boolean()
});
/** Uninstall stage result. */
const UninstallStageResultSchema = StageResultSchema;
/** Capability-assertion stage: one named tool or command, registered → invoked → observed. */
const CapabilityStageResultSchema = StageResultSchema.extend({
	/** `observed`/`invoked`/`not-registered`/`skipped`/`failed`. */
	status: CapabilityStatusSchema,
	/** What was asserted (tool or command); null when the stage never ran. */
	capabilityKind: CapabilityKindSchema.nullable(),
	/** The asserted tool or command name; '' when the stage never ran. */
	name: string(),
	/** Whether the expectation literal was found in the observed output. */
	expectMatched: boolean(),
	/** One-line sanitized explanation of the reached status. */
	detail: string()
});
/** Cleanup stage: quarantine/removal facts for the temp directory this run owned. */
const CleanupStageResultSchema = object({
	/** `pass` when the owned temp root was removed; `skipped` when keepTempDirs was set. */
	status: union([
		literal("pass"),
		literal("fail"),
		literal("skipped")
	]),
	/** True when the root was renamed into the owned quarantine directory first. */
	quarantined: boolean(),
	/** True when the quarantined root was fully removed from disk. */
	removed: boolean(),
	/** One-line sanitized summary (dry-run plan on failure). */
	summary: string()
});
/** Facts about the runner that produced the record. */
const RunMetaSchema = object({
	/** Unique id of this drive run (also the `runs` table key). */
	runId: string().min(1),
	/** ISO-8601 start timestamp. */
	startedAt: string().min(1),
	/** ISO-8601 finish timestamp. */
	finishedAt: string().min(1),
	/** Total wall-clock duration in milliseconds. */
	durationMs: number().finite(),
	/** `dsh --version` of the CLI that ran the stages ('' when unknown). */
	harnessVersion: string(),
	/** dsh-test-drive's own version. */
	pluginVersion: string().min(1),
	/** Runner platform (`process.platform`). */
	platform: string().min(1),
	/** Runner Node version (`process.version`). */
	node: string().min(1)
});
/** What was driven, and what the install revealed about it. */
const DriveTargetSchema = object({
	/** Address kind, see {@link TargetKind}. */
	kind: TargetKindSchema,
	/** Sanitized target spec exactly as passed to `dsh plugin add`. */
	spec: string().min(1),
	/** Install-revealed package facts; absent when the install never materialized the package. */
	resolved: object({
		/** Installed package name (authoritative: read from the profile manifest). */
		packageName: string().min(1),
		/** Installed package version. */
		packageVersion: string().min(1),
		/** Whether the package declares `dsh.bundle.patch` (a bundle layer exists). */
		hasBundleManifest: boolean()
	}).optional()
});
/** Isolation facts asserted by construction: every path the child touched was inside the owned temp root. */
const IsolationFactsSchema = object({
	/** The child processes used a throwaway DSH_HOME inside the owned temp root. */
	tempDshHome: boolean(),
	/** The child cwd was a throwaway workspace inside the owned temp root. */
	tempWorkspace: boolean(),
	/** The pnpm store was redirected inside the owned temp root. */
	tempStore: boolean(),
	/** Host home untouched — always true: no code path reads or writes the real profile home. */
	hostHomeTouched: literal(false)
});
/** One drive run: install → dump-config → boot smoke → uninstall → cleanup. */
const DriveResultSchema = object({
	/** Discriminator {@link RESULT_SCHEMA}. */
	schema: literal(RESULT_SCHEMA),
	/** Runner facts. */
	run: RunMetaSchema,
	/** Target facts. */
	target: DriveTargetSchema,
	/** Isolation facts. */
	isolation: IsolationFactsSchema,
	/** Stage outcomes in execution order. */
	stages: object({
		install: InstallStageResultSchema,
		config: ConfigStageResultSchema,
		smoke: SmokeStageResultSchema,
		/**
		* Optional capability-assertion stage (added after v1 records existed;
		* optional so pre-capability records still validate at the durable
		* boundary — no domain-version bump for a backward-compatible addition).
		*/
		capability: CapabilityStageResultSchema.optional(),
		uninstall: UninstallStageResultSchema,
		cleanup: CleanupStageResultSchema
	}),
	/** Overall verdict derived from the stages by {@link verdictOf}. */
	verdict: DriveVerdictSchema,
	/** One-line sanitized explanation of the verdict. */
	verdictReason: string().min(1)
});
/** One row of a batch matrix: the per-target verdict plus the fields a matrix table needs. */
const MatrixRowSchema = object({
	/** Sanitized target spec. */
	target: string().min(1),
	/** Address kind. */
	kind: TargetKindSchema,
	/** Per-target verdict. */
	verdict: DriveVerdictSchema,
	/** Install stage status. */
	install: StageStatusSchema,
	/** Smoke stage status. */
	smoke: SmokeStatusSchema,
	/** Per-target wall-clock duration in milliseconds. */
	durationMs: number().finite(),
	/** One-line sanitized summary (the target's verdict reason). */
	summary: string()
});
/** Aggregated batch record keyed by the batch id. */
const MatrixRecordSchema = object({
	/** Discriminator {@link RESULT_SCHEMA}. */
	schema: literal(RESULT_SCHEMA),
	/** Matrix id — named by the producing batch job's final output line. */
	id: string().min(1),
	/** ISO-8601 creation timestamp. */
	createdAt: string().min(1),
	/** Total wall-clock duration of the batch in milliseconds. */
	durationMs: number().finite(),
	/** Per-target rows in drive order. */
	rows: array(MatrixRowSchema),
	/** Verdict tallies over `rows`. */
	totals: object({
		total: number().int().min(0),
		pass: number().int().min(0),
		fail: number().int().min(0),
		partial: number().int().min(0),
		unknown: number().int().min(0)
	})
});
/** Compile the tallies for one matrix record. */
function totalsOf(rows) {
	const totals = {
		total: rows.length,
		pass: 0,
		fail: 0,
		partial: 0,
		unknown: 0
	};
	for (const row of rows) switch (row.verdict) {
		case "pass":
			totals.pass += 1;
			break;
		case "fail":
			totals.fail += 1;
			break;
		case "partial":
			totals.partial += 1;
			break;
		default: totals.unknown += 1;
	}
	return totals;
}
/**
* Derive the overall verdict of one drive run from its stage outcomes.
*
* Rules, in order:
* 1. A failed install, a failed boot (`smoke.fail`), or a capability stage
*    that reached `not-registered`/`failed` is a hard `fail`.
* 2. Without a passing install there is no basis for a verdict: `unknown`.
* 3. A verified install must also show the patch layer and a successful
*    uninstall; misses are `partial`.
* 4. `pass` requires a REAL successful boot: `smoke.status === 'pass'` with
*    exit code 0. A non-zero smoke exit without loader markers (`boot-ok`) is
*    `partial`, never `pass` — an unsuccessful process is not a verified boot.
* 5. An explicitly skipped smoke (empty `headless-task`) keeps the install /
*    patch / uninstall facts and is `pass`; skipping is a configured choice,
*    not a failed boot.
*
* @param result - the complete drive result.
* @returns `[verdict, reason]`.
*/
function verdictOf(result) {
	const { install, config, smoke, uninstall, capability } = result.stages;
	const capabilityNote = capability !== void 0 && capability.status === "observed" ? `; capability "${capability.name}" registered, invoked, and observed` : "";
	if (install.status === "fail") return ["fail", `install failed: ${install.summary}`];
	if (smoke.status === "fail") return ["fail", `boot smoke failed: ${smoke.summary}`];
	if (capability !== void 0 && (capability.status === "not-registered" || capability.status === "failed")) return ["fail", `capability assertion failed (${capability.name}): ${capability.detail}`];
	if (install.status !== "pass") return ["unknown", "install never ran to completion"];
	if (config.status !== "pass" || !config.patchEffective) return ["partial", `install passed but the bundle patch was not verified (${config.summary})`];
	if (uninstall.status !== "pass") return ["partial", `install and smoke passed but uninstall failed (${uninstall.summary})`];
	if (smoke.status === "pass") {
		if (smoke.exitCode !== 0) return ["partial", `smoke reported pass but exited ${String(smoke.exitCode)}; a successful boot is not proven`];
		return ["pass", `install, patch, boot, task, and uninstall all verified${capabilityNote}`];
	}
	if (smoke.status === "skipped") {
		if (smoke.summary.includes("disabled by config")) return ["pass", `install, patch, and uninstall verified${capabilityNote}; boot smoke skipped by config (empty headless task)`];
		return ["partial", `smoke did not run to a verified boot (${smoke.summary})`];
	}
	if (smoke.status === "boot-ok") return ["partial", `install, patch, and uninstall verified${capabilityNote}; boot smoke exited ${String(smoke.exitCode)} without loader-failure markers, so a successful boot is not proven (see smoke.summary)`];
	return ["unknown", "stage combination not covered by the verdict rules"];
}
// src/core/sanitize.ts
/**
* Pure sanitizers for every string that reaches a report, a log, or the model.
* Nothing here reads the environment or the clock: report content is the only
* caller, and the sanitizers must stay testable with extreme inputs (token
* literals, credential-bearing URLs, hostile repo specs, temp-root paths).
*
* @module dsh-test-drive/sanitize
*/
/** GitHub personal access tokens (`ghp_` prefix, ≥20 body chars). */
const GITHUB_TOKEN = /ghp_[A-Za-z0-9]{20,}/gu;
/** npm access tokens (`npm_` prefix, ≥20 body chars). */
const NPM_TOKEN = /npm_[A-Za-z0-9]{20,}/gu;
/** OpenAI-style keys (`sk-` prefix, ≥16 body chars) and common jwt/aws/twilio shapes. */
const API_KEY = /(?:sk-[A-Za-z0-9_-]{16,}|AKIA[0-9A-Z]{16}|xox[baprs]-[A-Za-z0-9-]{10,})/gu;
/** `scheme://user:pass@host` — keeps the scheme and host, drops the credentials. */
const URL_CREDENTIALS = /(\b[a-z][a-z0-9+.-]*:\/\/)[^/@\s:]+(?::[^/@\s]*)?@/giu;
/** `Authorization: Bearer <token>`-style header lines. */
const BEARER = /\b(Bearer\s+)[A-Za-z0-9._~+/=-]{8,}/giu;
/** Control characters that must never survive into a one-line report field. */
const CONTROL_CHARS = /[\u0000-\u001f\u007f]/gu;
/** Maximum length of a sanitized target spec recorded in a report. */
const MAX_TARGET_SPEC_LENGTH = 1e3;
/** Marker substituted for every redacted secret. */
const REDACTED = "***REDACTED***";
/**
* Replace credential-shaped substrings with {@link REDACTED}.
*
* @param text - any output or user-supplied string.
* @returns the same text with secrets redacted.
*/
function redactSecrets(text) {
	return text.replace(GITHUB_TOKEN, REDACTED).replace(NPM_TOKEN, REDACTED).replace(API_KEY, REDACTED).replace(URL_CREDENTIALS, "$1***@").replace(BEARER, `$1${REDACTED}`);
}
/**
* Sanitize one user-supplied target spec for recording and display: strip
* control characters, redact embedded credentials, cap the length, and keep
* surrounding whitespace off the recorded value.
*
* @param spec - the raw target as the user supplied it.
* @returns the sanitized spec; never throws.
*/
function sanitizeTarget(spec) {
	return redactSecrets(spec.replace(CONTROL_CHARS, " ").trim()).slice(0, MAX_TARGET_SPEC_LENGTH);
}
/**
* Bound a multi-line output stream to a short tail for one-line summaries.
* The tail keeps the END of the text (errors and final results cluster there).
*
* @param text - collected output.
* @param maxChars - retained character count.
* @returns the tail, prefixed with a truncation marker when shortened.
*/
function tailText(text, maxChars) {
	const clean = text.replace(/\s+$/u, "");
	if (clean.length <= maxChars) return clean;
	return `…<truncated, showing last ${maxChars} chars>…${clean.slice(-maxChars)}`;
}
/**
* Replace every occurrence of one run's temp root with a stable placeholder,
* so recorded output never leaks machine-local absolute paths. Both
* separator styles are matched (Windows backslashes vs forward slashes).
*
* @param text - output to scrub.
* @param tempRoot - the exact temp root this run owns.
* @returns the scrubbed text.
*/
function redactTempPath(text, tempRoot) {
	if (tempRoot.length === 0) return text;
	const forward = tempRoot.replace(/\\/gu, "/");
	const backward = tempRoot.replace(/\//gu, "\\");
	return text.split(forward).join("<testdrive-temp>").split(backward).join("<testdrive-temp>");
}
/**
* Scrub one stage's collected output for a report field: redact the temp
* root, redact secrets, then keep only the bounded tail.
*
* @param text - raw collected output.
* @param tempRoot - this run's temp root ('' for none).
* @param maxChars - retained tail length.
* @returns the report-safe tail.
*/
function sanitizeOutput(text, tempRoot, maxChars) {
	return tailText(redactSecrets(redactTempPath(text, tempRoot)), maxChars);
}
// src/core/version.ts
/**
* Producer version, kept in lockstep with `package.json` by
* `scripts/release.mjs`; `tests/version.spec.ts` trips when they drift.
* The structured report records it as `run.pluginVersion`.
* @module dsh-test-drive/version
*/
const VERSION = "0.3.25";
// src/core/drive.ts
/**
* The single-target drive pipeline: create an owned temp workspace, run
* install → dump-config → boot smoke → uninstall through the {@link DshDriver},
* and ALWAYS finish with the quarantine cleanup ladder — also on abort and
* unexpected pipeline errors (the `try/finally` discipline of §0.2). The
* resulting {@link DriveResult} is the structured record downstream consumers
* read.
*
* @module dsh-test-drive/drive
*/
/** Cap on the session-log text the capability stage reads back. */
const SESSION_READ_MAX_BYTES = 1048576;
/** id prefix of a single drive run. */
const RUN_ID_PREFIX = "tdr_";
/** Fresh unique id with one of the plugin's prefixes. */
function freshId(prefix) {
	return `${prefix}${randomBytes(12).toString("hex")}`;
}
/** Map one stage's process outcome to a plain stage record. */
function stageOf(run, tempRoot, outputTailBytes, okSummary) {
	const outputTail = sanitizeOutput(`${run.stdout}\n${run.stderr}`, tempRoot, outputTailBytes);
	if (run.timedOut) return {
		status: "fail",
		exitCode: run.exitCode,
		durationMs: run.durationMs,
		attempts: 1,
		summary: `timed out after ${run.durationMs} ms`,
		outputTail
	};
	if (run.exitCode === 0) return {
		status: "pass",
		exitCode: 0,
		durationMs: run.durationMs,
		attempts: 1,
		summary: okSummary,
		outputTail
	};
	const firstLine = tailText(run.stderr || run.stdout, 160).split("\n")[0] ?? "";
	return {
		status: "fail",
		exitCode: run.exitCode,
		durationMs: run.durationMs,
		attempts: 1,
		summary: `exit ${String(run.exitCode)}: ${firstLine || "no output"}`,
		outputTail
	};
}
/** Map the install stage, including the allowBuilds facts. */
function installStageOf(outcome, tempRoot, outputTailBytes) {
	return {
		...stageOf(outcome.run, tempRoot, outputTailBytes, outcome.allowBuildsNeeded ? "install ok after allowBuilds allowance" : "install ok (exit 0)"),
		attempts: outcome.attempts,
		allowBuildsNeeded: outcome.allowBuildsNeeded
	};
}
/** The not-reached record for every stage skipped after a pipeline error. */
const UNREACHED = {
	status: "skipped",
	exitCode: null,
	durationMs: 0,
	attempts: 0,
	outputTail: "",
	summary: "not reached: earlier stage errored"
};
/** A failed stage record for an unexpected pipeline error (no process facts). */
function erroredStage(summary) {
	return {
		status: "fail",
		exitCode: null,
		durationMs: 0,
		attempts: 1,
		summary: tailText(summary, 160),
		outputTail: ""
	};
}
/**
* Drive one target through the complete install-smoke pipeline.
*
* @param target - raw target spec (repo, npm name, local path, tarball).
* @param options - per-drive overrides.
* @returns the structured result; never throws for expected stage failures.
*/
var DriveRunner = class {
	deps;
	harnessVersion;
	constructor(deps) {
		this.deps = deps;
	}
	/** Ask the CLI once per runner lifetime for its version. */
	version(options) {
		this.harnessVersion ??= this.deps.driver.version({
			...options,
			timeoutMs: this.deps.config.configTimeoutMs
		}).catch(() => "");
		return this.harnessVersion;
	}
	/** Persist one settled result; a failing medium is logged, never thrown. */
	async record(result) {
		try {
			await (await this.deps.domain()).table("runs").put(result.run.runId, result);
		} catch (error) {
			this.deps.log(`test-drive: failed to persist run ${result.run.runId}: ${String(error)}`);
		}
	}
	async drive(target, options = {}) {
		const { config, driver, temp, log } = this.deps;
		const startedAt = /* @__PURE__ */ new Date();
		const startedMs = Date.now();
		const runId = freshId(RUN_ID_PREFIX);
		const spec = sanitizeTarget(target);
		if (spec.length === 0) throw new Error("dsh-test-drive: target must be a non-empty string");
		const kind = classifyTarget(spec);
		const registrySpec = kind === "npm" && spec.startsWith("npm:") ? spec.slice(4) : spec;
		const addSpec = kind === "path" ? anchorLocalTarget(registrySpec, options.cwd) : registrySpec;
		const workspace = await temp.create(config.profileName);
		const base = {
			home: workspace.home,
			cwd: workspace.workspace,
			storeDir: workspace.store,
			signal: options.signal
		};
		let install = {
			...UNREACHED,
			allowBuildsNeeded: false
		};
		let configStage = {
			...UNREACHED,
			patchEffective: false,
			layers: []
		};
		let smoke = {
			...UNREACHED,
			bootFailed: false,
			taskCompleted: false
		};
		let capability = {
			status: "skipped",
			exitCode: null,
			durationMs: 0,
			attempts: 0,
			outputTail: "",
			summary: "not reached: earlier stage errored",
			capabilityKind: null,
			name: "",
			expectMatched: false,
			detail: "not reached: earlier stage errored"
		};
		let uninstall = { ...UNREACHED };
		let resolved;
		let cleanup = {
			status: "fail",
			quarantined: false,
			removed: false,
			summary: "cleanup not executed"
		};
		let harnessVersion = "";
		try {
			install = installStageOf(await driver.add(addSpec, {
				...base,
				timeoutMs: config.installTimeoutMs
			}), workspace.root, config.outputTailBytes);
			if (install.status === "pass") resolved = await driver.readInstalledPackage(workspace.profileDir).catch(() => void 0);
			if (install.status === "pass" && !(options.signal?.aborted ?? false)) {
				const dump = await driver.dumpConfig({
					...base,
					timeoutMs: config.configTimeoutMs
				});
				const stage = stageOf(dump, workspace.root, config.outputTailBytes, "dump ok (exit 0)");
				const pkgName = resolved?.packageName ?? "";
				const mention = pkgName === "" ? {
					mentioned: false,
					layers: []
				} : dumpMentionsPackage(`${dump.stdout}\n${dump.stderr}`, pkgName);
				configStage = {
					...stage,
					patchEffective: mention.mentioned,
					layers: mention.layers
				};
			} else if (options.signal?.aborted ?? false) configStage = {
				...configStage,
				summary: "run aborted before this stage"
			};
			else configStage = {
				...configStage,
				summary: "install did not pass"
			};
			const task = options.headlessTask ?? config.headlessTask;
			if (task === "") smoke = {
				...smoke,
				summary: "boot smoke disabled by config (headlessTask is empty)"
			};
			else if (install.status !== "pass") smoke = {
				...smoke,
				summary: "install did not pass"
			};
			else if (options.signal?.aborted ?? false) smoke = {
				...smoke,
				summary: "run aborted before this stage"
			};
			else {
				const run = await driver.smokeTask(task, {
					...base,
					timeoutMs: config.smokeTimeoutMs
				});
				const outputTail = sanitizeOutput(`${run.stdout}\n${run.stderr}`, workspace.root, config.outputTailBytes);
				const bootFailed = hasBootFailure(`${run.stdout}\n${run.stderr}`);
				if (run.timedOut) smoke = {
					status: "fail",
					exitCode: run.exitCode,
					durationMs: run.durationMs,
					attempts: 1,
					summary: `timed out after ${run.durationMs} ms`,
					outputTail,
					bootFailed: false,
					taskCompleted: false
				};
				else if (bootFailed) smoke = {
					status: "fail",
					exitCode: run.exitCode,
					durationMs: run.durationMs,
					attempts: 1,
					summary: "boot failure markers found (FAILED / failed to load / did not activate)",
					outputTail,
					bootFailed: true,
					taskCompleted: false
				};
				else if (run.exitCode === 0) smoke = {
					status: "pass",
					exitCode: 0,
					durationMs: run.durationMs,
					attempts: 1,
					summary: "booted cleanly and the headless task completed",
					outputTail,
					bootFailed: false,
					taskCompleted: true
				};
				else smoke = {
					status: "boot-ok",
					exitCode: run.exitCode,
					durationMs: run.durationMs,
					attempts: 1,
					summary: "booted without loader failures; headless task did not complete (credentials/model unreachable)",
					outputTail,
					bootFailed: false,
					taskCompleted: false
				};
			}
			const capSpec = options.capability ?? (config.capability.enabled ? {
				kind: config.capability.kind,
				name: config.capability.name,
				args: config.capability.args,
				expect: config.capability.expect
			} : void 0);
			if (capSpec === void 0) capability = {
				...capability,
				status: "skipped",
				summary: "capability assertion disabled (config.capability.enabled is false and no per-drive capability given)",
				detail: "capability assertion disabled by config"
			};
			else if (install.status !== "pass") capability = {
				...capability,
				summary: "install did not pass",
				detail: "install did not pass"
			};
			else if (smoke.status === "fail") capability = {
				...capability,
				summary: "boot smoke failed",
				detail: "boot smoke failed before the capability stage"
			};
			else if (options.signal?.aborted ?? false) capability = {
				...capability,
				summary: "run aborted before this stage",
				detail: "run aborted before this stage"
			};
			else if (process.env.DEEPSEEK_API_KEY === void 0 && !config.forwardEnv.includes("DEEPSEEK_API_KEY")) capability = {
				...capability,
				status: "skipped",
				summary: "DEEPSEEK_API_KEY not available — the capability task needs a model (set it on the host or list it in forwardEnv)",
				capabilityKind: capSpec.kind,
				name: capSpec.name,
				detail: "no model credential available for the capability task"
			};
			else {
				const run = await driver.smokeTask(buildCapabilityTask(capSpec), {
					...base,
					timeoutMs: config.capabilityTimeoutMs
				});
				const outputTail = sanitizeOutput(`${run.stdout}\n${run.stderr}`, workspace.root, config.outputTailBytes);
				if (run.timedOut) capability = {
					status: "failed",
					exitCode: run.exitCode,
					durationMs: run.durationMs,
					attempts: 1,
					summary: `timed out after ${run.durationMs} ms`,
					outputTail,
					capabilityKind: capSpec.kind,
					name: capSpec.name,
					expectMatched: false,
					detail: "capability task timed out"
				};
				else if (run.exitCode !== 0) {
					const firstLine = tailText(run.stderr || run.stdout, 160).split("\n")[0] ?? "";
					capability = {
						status: "failed",
						exitCode: run.exitCode,
						durationMs: run.durationMs,
						attempts: 1,
						summary: `exit ${String(run.exitCode)}: ${firstLine || "no output"}`,
						outputTail,
						capabilityKind: capSpec.kind,
						name: capSpec.name,
						expectMatched: false,
						detail: "capability task did not complete (model/credential failure)"
					};
				} else {
					const analysis = analyzeSessionLog(await driver.readNewestSession(workspace.home, SESSION_READ_MAX_BYTES), capSpec);
					capability = {
						status: analysis.status,
						exitCode: 0,
						durationMs: run.durationMs,
						attempts: 1,
						summary: analysis.detail,
						outputTail,
						capabilityKind: capSpec.kind,
						name: capSpec.name,
						expectMatched: analysis.expectMatched,
						detail: analysis.detail
					};
				}
			}
			if (resolved?.packageName === void 0) uninstall = {
				...uninstall,
				summary: "no installed package to remove"
			};
			else uninstall = stageOf(await driver.remove(resolved.packageName, {
				...base,
				timeoutMs: config.uninstallTimeoutMs
			}), workspace.root, config.outputTailBytes, "remove ok (exit 0)");
			harnessVersion = await this.version(base).catch(() => "");
		} catch (error) {
			const summary = `pipeline error: ${tailText(String(error), 160)}`;
			if (install.status === "skipped") install = {
				...erroredStage(summary),
				allowBuildsNeeded: false
			};
			else if (configStage.status === "skipped") configStage = {
				...erroredStage(summary),
				patchEffective: false,
				layers: []
			};
			else if (smoke.status === "skipped") smoke = {
				...erroredStage(summary),
				bootFailed: false,
				taskCompleted: false
			};
			else if (capability.status === "skipped") capability = {
				...erroredStage(summary),
				status: "failed",
				capabilityKind: null,
				name: "",
				expectMatched: false,
				detail: summary
			};
			else uninstall = { ...erroredStage(summary) };
			log(`test-drive: pipeline error for ${spec}: ${String(error)}`);
		} finally {
			try {
				cleanup = config.keepTempDirs ? temp.keep(workspace.root) : await temp.quarantineAndRemove(workspace.root);
			} catch (error) {
				log(`test-drive: cleanup ladder failed for ${workspace.root}: ${String(error)}`);
				cleanup = {
					status: "fail",
					quarantined: false,
					removed: false,
					summary: `cleanup refused: ${tailText(String(error), 120)}`
				};
			}
		}
		const finishedAt = /* @__PURE__ */ new Date();
		const result = {
			schema: RESULT_SCHEMA,
			run: {
				runId,
				startedAt: startedAt.toISOString(),
				finishedAt: finishedAt.toISOString(),
				durationMs: Date.now() - startedMs,
				harnessVersion,
				pluginVersion: this.deps.producerVersion ?? "0.3.25",
				platform: process.platform,
				node: process.version
			},
			target: {
				kind,
				spec: addSpec,
				...resolved === void 0 ? {} : { resolved }
			},
			isolation: {
				tempDshHome: true,
				tempWorkspace: true,
				tempStore: true,
				hostHomeTouched: false
			},
			stages: {
				install,
				config: configStage,
				smoke,
				capability,
				uninstall,
				cleanup
			},
			verdict: "unknown",
			verdictReason: ""
		};
		const [verdict, reason] = verdictOf(result);
		result.verdict = verdict;
		result.verdictReason = reason;
		await this.record(result);
		return result;
	}
};
// src/core/report.ts
/** Emoji/symbol mark for a stage or verdict status. */
function statusMark(status) {
	switch (status) {
		case "pass": return "✅";
		case "fail": return "❌";
		case "boot-ok": return "🟡";
		case "partial": return "🟠";
		case "skipped": return "⏭️";
		case "observed": return "✅";
		case "invoked": return "🟡";
		case "not-registered": return "❌";
		default: return "❓";
	}
}
/** Human-duration rendering for one number of milliseconds. */
function formatDuration(ms) {
	if (ms < 1e3) return `${ms} ms`;
	return `${(ms / 1e3).toFixed(1)} s`;
}
/** Render one drive result as a Markdown report block. */
function renderDriveResult(result) {
	const { run, target, stages, verdict, verdictReason } = result;
	const lines = [
		`# Test drive ${run.runId}`,
		"",
		`- Target: \`${target.spec}\` (${target.kind})`,
		`- Verdict: ${statusMark(verdict)} ${verdict} — ${verdictReason}`,
		`- Duration: ${formatDuration(run.durationMs)} (harness ${run.harnessVersion || "unknown"}, plugin ${run.pluginVersion})`,
		...target.resolved != null ? [`- Installed: ${target.resolved.packageName}@${target.resolved.packageVersion}${target.resolved.hasBundleManifest ? "" : " (no dsh.bundle manifest)"}`] : [],
		`- Isolation: throwaway DSH_HOME + workspace + pnpm store; host profile untouched`,
		"",
		"| Stage | Result | Exit | Duration | Summary |",
		"|---|---|---|---|---|",
		`| install | ${statusMark(stages.install.status)} ${stages.install.status} | ${String(stages.install.exitCode)} | ${formatDuration(stages.install.durationMs)} | ${stages.install.summary} |`,
		`| config (--dump-config) | ${statusMark(stages.config.status)} ${stages.config.status} | ${String(stages.config.exitCode)} | ${formatDuration(stages.config.durationMs)} | ${stages.config.patchEffective ? `patch effective: ${stages.config.layers.join(", ")}` : stages.config.summary} |`,
		`| smoke (headless boot) | ${statusMark(stages.smoke.status)} ${stages.smoke.status} | ${String(stages.smoke.exitCode)} | ${formatDuration(stages.smoke.durationMs)} | ${stages.smoke.summary} |`,
		`| capability | ${stages.capability === void 0 ? "—" : `${statusMark(stages.capability.status)} ${stages.capability.status}`} | ${stages.capability === void 0 ? "—" : String(stages.capability.exitCode)} | ${stages.capability === void 0 ? "—" : formatDuration(stages.capability.durationMs)} | ${stages.capability?.summary ?? "not asserted"} |`,
		`| uninstall | ${statusMark(stages.uninstall.status)} ${stages.uninstall.status} | ${String(stages.uninstall.exitCode)} | ${formatDuration(stages.uninstall.durationMs)} | ${stages.uninstall.summary} |`,
		`| cleanup | ${statusMark(stages.cleanup.status)} ${stages.cleanup.status} | — | — | ${stages.cleanup.summary} |`,
		""
	];
	if (stages.install.status === "fail" && stages.install.outputTail !== "") lines.push("## Install output (tail, sanitized)", "", "```", stages.install.outputTail, "```", "");
	if ((stages.smoke.status === "fail" || stages.smoke.status === "boot-ok") && stages.smoke.outputTail !== "") lines.push("## Smoke output (tail, sanitized)", "", "```", stages.smoke.outputTail, "```", "");
	return lines.join("\n");
}
/** Render one batch matrix as a Markdown report. */
function renderMatrix(matrix) {
	const lines = [
		`# Test drive matrix ${matrix.id}`,
		"",
		`- Created: ${matrix.createdAt}`,
		`- Duration: ${formatDuration(matrix.durationMs)}`,
		`- Totals: ${matrix.totals.pass} pass, ${matrix.totals.fail} fail, ${matrix.totals.partial} partial, ${matrix.totals.unknown} unknown (of ${matrix.totals.total})`,
		"",
		"| # | Target | Install | Smoke | Verdict | Duration | Summary |",
		"|---|---|---|---|---|---|---|"
	];
	matrix.rows.forEach((row, index) => {
		lines.push(`| ${index + 1} | \`${row.target}\` | ${statusMark(row.install)} ${row.install} | ${statusMark(row.smoke)} ${row.smoke} | ${statusMark(row.verdict)} ${row.verdict} | ${formatDuration(row.durationMs)} | ${row.summary} |`);
	});
	const attention = matrix.rows.filter((row) => row.verdict !== "pass");
	if (attention.length > 0 || matrix.rows.length === 0) {
		lines.push("", "## Attention", "");
		if (matrix.rows.length === 0) lines.push("- ⚠️ matrix has no rows — nothing was verified (verdict: unknown)");
		for (const row of attention) lines.push(`- ${statusMark(row.verdict)} \`${row.target}\`: ${row.summary}`);
	}
	return lines.join("\n");
}
/** Escape text for safe embedding in a JUnit XML attribute or element body. */
function escapeXml(text) {
	return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}
/** Seconds with three decimals, for JUnit `time` attributes. */
function seconds(ms) {
	return (ms / 1e3).toFixed(3);
}
/** Whether a stage/row verdict counts as a JUnit failure. `unknown` is a failure too: an unproven result must never look green. */
function isFailure(status) {
	return status === "fail" || status === "partial" || status === "unknown" || status === "not-registered" || status === "failed";
}
/**
* Render one drive result as a JUnit XML `<testsuite>` (one `<testcase>` per
* stage), consumable by GitHub Actions test reporters.
* @param result - the complete drive result.
* @returns the JUnit XML document.
*/
function renderDriveJUnitXml(result) {
	const stages = [
		[
			"install",
			result.stages.install.status,
			result.stages.install.durationMs,
			result.stages.install.summary
		],
		[
			"config",
			result.stages.config.status,
			result.stages.config.durationMs,
			result.stages.config.summary
		],
		[
			"smoke",
			result.stages.smoke.status,
			result.stages.smoke.durationMs,
			result.stages.smoke.summary
		],
		[
			"uninstall",
			result.stages.uninstall.status,
			result.stages.uninstall.durationMs,
			result.stages.uninstall.summary
		]
	];
	if (result.stages.capability !== void 0) stages.push([
		"capability",
		result.stages.capability.status,
		result.stages.capability.durationMs,
		result.stages.capability.detail
	]);
	const stageFailures = stages.filter(([, status]) => isFailure(status)).length;
	const overallFailure = result.verdict !== "pass";
	const cases = stages.map(([name, status, durationMs, summary]) => {
		const body = isFailure(status) ? `<failure message="${escapeXml(summary)}" type="${escapeXml(status)}"></failure>` : "";
		return `    <testcase classname="dsh-test-drive" name="${escapeXml(name)}" time="${seconds(durationMs)}">${body}</testcase>`;
	});
	cases.push(`    <testcase classname="dsh-test-drive" name="verdict" time="${seconds(result.run.durationMs)}">${overallFailure ? `<failure message="${escapeXml(result.verdictReason)}" type="${escapeXml(result.verdict)}"></failure>` : ""}</testcase>`);
	const failures = stageFailures + (overallFailure ? 1 : 0);
	return [
		"<?xml version=\"1.0\" encoding=\"UTF-8\"?>",
		`<testsuite name="dsh-test-drive ${escapeXml(result.target.spec)}" tests="${cases.length}" failures="${failures}" errors="0" time="${seconds(result.run.durationMs)}">`,
		cases.join("\n"),
		"</testsuite>",
		""
	].join("\n");
}
/**
* Render one batch matrix as a JUnit XML `<testsuite>` (one `<testcase>` per
* target), consumable by GitHub Actions test reporters.
* @param matrix - the aggregated batch matrix.
* @returns the JUnit XML document.
*/
function renderMatrixJUnitXml(matrix) {
	const cases = matrix.rows.map((row) => {
		const body = isFailure(row.verdict) ? `<failure message="${escapeXml(row.summary)}" type="${escapeXml(row.verdict)}"></failure>` : "";
		return `    <testcase classname="dsh-test-drive" name="${escapeXml(row.target)}" time="${seconds(row.durationMs)}">${body}</testcase>`;
	});
	const empty = matrix.rows.length === 0;
	if (empty) cases.push("    <testcase classname=\"dsh-test-drive\" name=\"empty-matrix\" time=\"0.000\"><failure message=\"matrix has no rows; nothing was verified\" type=\"unknown\"></failure></testcase>");
	const failures = matrix.rows.filter((row) => isFailure(row.verdict)).length + (empty ? 1 : 0);
	return [
		"<?xml version=\"1.0\" encoding=\"UTF-8\"?>",
		`<testsuite name="dsh-test-drive matrix ${escapeXml(matrix.id)}" tests="${cases.length}" failures="${failures}" errors="0" time="${seconds(matrix.durationMs)}">`,
		cases.join("\n"),
		"</testsuite>",
		""
	].join("\n");
}
// src/core/workspace.ts
/**
* Temporary-directory ownership for test drives. Every directory this plugin
* ever touches under the OS temp dir is created here with {@link mkdtemp},
* tracked in a live registry, and removed only through the
* dry-run → quarantine-rename → delete ladder. Nothing in this module scans
* the temp dir, guesses at foreign prefixes, or touches the real home:
* ownership is a registry lookup plus a prefix and direct-child check, and a
* path that fails any check is refused loudly.
*
* @module dsh-test-drive/workspace
*/
/** Prefix of every owned temp root (`mkdtemp` appends the random suffix). */
const OWNED_PREFIX = "dsh-test-drive-";
/** Prefix of quarantine directories an owned root is renamed into before removal. */
const QUARANTINE_PREFIX = "dsh-test-drive-quarantine-";
/** Compare two absolute paths with the platform's case semantics. */
function samePath(a, b) {
	const left = resolve(a);
	const right = resolve(b);
	return process.platform === "win32" ? left.toLowerCase() === right.toLowerCase() : left === right;
}
/**
* The registry of temp roots this plugin instance owns. All mutations are
* synchronous so the ownership set can never observe a half-registered root.
*/
var TempWorkspaceRegistry = class {
	log;
	now;
	owned = /* @__PURE__ */ new Set();
	quarantined = /* @__PURE__ */ new Set();
	sequence = 0;
	/**
	* @param log - operator log sink (the plugin logger); receives the dry-run plan lines.
	* @param now - clock (test hook for deterministic quarantine names).
	*/
	constructor(log, now = Date.now) {
		this.log = log;
		this.now = now;
	}
	/** Owned roots currently registered (for tests and diagnostics). */
	get size() {
		return this.owned.size;
	}
	/** Create one owned temp root with the standard layout. */
	async create(profileName) {
		const root = await mkdtemp(join(tmpdir(), OWNED_PREFIX));
		const home = join(root, "home");
		const workspace = join(root, "workspace");
		const store = join(root, "pnpm-store");
		const profileDir = join(home, "profiles", profileName);
		this.owned.add(root);
		await mkdir(home, { recursive: true });
		await mkdir(workspace, { recursive: true });
		await mkdir(store, { recursive: true });
		this.log(`test-drive: created temp workspace ${root} (home=${home})`);
		return {
			root,
			home,
			workspace,
			store,
			profileDir
		};
	}
	/**
	* Assert that `path` is a directory this instance created and still owns.
	* Fails loud — never falls back to cwd, a parent, or a different prefix.
	*/
	assertOwned(path, what) {
		const normalized = resolve(path);
		if (!samePath(dirname(normalized), tmpdir())) throw new Error(`refusing temp cleanup: ${what} ${normalized} is not a direct child of the OS temp dir`);
		const name = basename(normalized);
		const prefix = what === "root" ? OWNED_PREFIX : QUARANTINE_PREFIX;
		if (!name.startsWith(prefix)) throw new Error(`refusing temp cleanup: ${what} ${normalized} does not carry the owned prefix ${prefix}`);
		if (![...what === "root" ? this.owned : this.quarantined].some((candidate) => samePath(candidate, normalized))) throw new Error(`refusing temp cleanup: ${what} ${normalized} is not registered with this plugin instance`);
	}
	/**
	* Compile and LOG the dry-run plan for one root before any mutation happens.
	* The returned quarantine path is the exact path the execution ladder uses,
	* so the logged plan always matches the performed operations.
	*/
	plan(root) {
		this.assertOwned(root, "root");
		const quarantine = join(tmpdir(), `${QUARANTINE_PREFIX}${this.now()}-${this.sequence += 1}`);
		this.log(`test-drive: cleanup dry-run — quarantine-rename: ${root} -> ${quarantine}`);
		this.log(`test-drive: cleanup dry-run — remove: ${quarantine} (owned quarantine dir, prefix ${QUARANTINE_PREFIX})`);
		return quarantine;
	}
	/**
	* Remove one owned root via the quarantine ladder: assert ownership, log the
	* dry-run plan, rename into an owned quarantine directory, then remove it.
	* A root that fails removal stays registered as quarantine and is retried
	* on the next teardown.
	*
	* @param root - the owned root to remove.
	* @returns the sanitized outcome.
	*/
	async quarantineAndRemove(root) {
		const normalized = resolve(root);
		const quarantine = this.plan(normalized);
		try {
			await rename(normalized, quarantine);
		} catch (error) {
			return {
				status: "fail",
				quarantined: false,
				removed: false,
				summary: `quarantine rename failed: ${String(error)}`
			};
		}
		this.owned.delete(normalized);
		this.quarantined.add(quarantine);
		try {
			await removeWithRetries(quarantine, 3, 100);
		} catch (error) {
			this.log(`test-drive: quarantine removal failed, left for retry: ${quarantine} (${String(error)})`);
			return {
				status: "fail",
				quarantined: true,
				removed: false,
				summary: "quarantined but removal failed; path left under the OS temp dir (see host log)"
			};
		}
		this.quarantined.delete(quarantine);
		this.log(`test-drive: removed ${quarantine}`);
		return {
			status: "pass",
			quarantined: true,
			removed: true,
			summary: "owned temp root quarantined and removed"
		};
	}
	/**
	* Keep a root for forensics (config `keepTempDirs`): drop ownership without
	* touching the directory. The caller owns later manual cleanup.
	*/
	keep(root) {
		const normalized = resolve(root);
		this.assertOwned(normalized, "root");
		this.owned.delete(normalized);
		this.log(`test-drive: keeping temp workspace for forensics (ownership dropped): ${normalized}`);
		return {
			status: "skipped",
			quarantined: false,
			removed: false,
			summary: `kept for forensics: ${basename(normalized)}`
		};
	}
	/** Best-effort teardown of every still-registered root and quarantine dir. */
	async disposeAll() {
		const roots = [...this.owned];
		for (const root of roots) try {
			await this.quarantineAndRemove(root);
		} catch (error) {
			this.log(`test-drive: teardown cleanup failed for ${root}: ${String(error)}`);
		}
		const quarantines = [...this.quarantined];
		for (const quarantine of quarantines) try {
			await removeWithRetries(quarantine, 3, 100);
			this.quarantined.delete(quarantine);
		} catch (error) {
			this.log(`test-drive: teardown quarantine retry failed for ${quarantine}: ${String(error)}`);
		}
	}
};
/** Remove a directory tree with bounded retries (Windows file-lock tolerance). */
async function removeWithRetries(path, maxRetries, retryDelayMs) {
	let attempt = 0;
	for (;;) try {
		await rm(path, {
			recursive: true,
			force: true,
			maxRetries: 1
		});
		return;
	} catch (error) {
		attempt += 1;
		if (attempt >= maxRetries) throw error;
		await new Promise((resolveDelay) => setTimeout(resolveDelay, retryDelayMs));
	}
}
// src/subprocess.ts
/**
* Local subprocess adapter for the standalone `dsh-test-kit` CLI.
*
* The drive engine was written against the DSH `ctx.subprocess` service. This
* module implements the same structural seam with `node:child_process`, so the
* CLI can run **outside** DSH with no `@deepseek-ai/*` runtime dependency. It is
* the only file in the kit that spawns processes directly; the engine and the
* plugin keep their argv-only, no-shell contract.
*
* Semantics mirrored from `@deepseek-ai/dsh-subprocess-local`:
* - the child env is the parent env minus credential-shaped names and all
*   `DSH_*` names, with the explicit spec env merged afterwards;
* - collected output keeps the tail, reports lossiness, and never blocks;
* - abort starts a graceful terminate and escalates to SIGKILL after the
*   requested grace period (on Windows the whole process tree is killed with
*   `taskkill /T`).
*
* @module dsh-test-kit/subprocess
*/
/** Environment names that are never forwarded to a child unless named explicitly. */
const SENSITIVE_ENV_PATTERN = /KEY|PASSWORD|SECRET|TOKEN/iu;
/** Default grace period before SIGKILL when a stage is aborted. */
const DEFAULT_TERMINATE_GRACE_MS = 5e3;
/**
* The ambient parent environment minus credential-shaped names and `DSH_*`.
* Explicit `spec.env` entries merge after this scrub, so a deliberately
* forwarded credential survives while an inherited one does not.
*
* @param env - parent environment (defaults to `process.env`).
* @returns a fresh, scrubbed environment object.
*/
function scrubbedParentEnv(env = process.env) {
	const out = {};
	for (const [name, value] of Object.entries(env)) {
		if (value === void 0) continue;
		if (SENSITIVE_ENV_PATTERN.test(name)) continue;
		if (name.toUpperCase().startsWith("DSH_")) continue;
		out[name] = value;
	}
	return out;
}
/** Whether a path is an existing regular file. */
function isFile(path) {
	try {
		return statSync(path).isFile();
	} catch {
		return false;
	}
}
/**
* Pure PATH/PATHEXT candidate expansion, shared by the real resolver and the
* cross-platform unit tests. A command that already carries a separator is
* returned as-is (the caller decides whether that is legal).
*
* @param command - bare name or path.
* @param env - environment whose PATH/PATHEXT is consulted.
* @param platform - target platform (`process.platform` by default).
* @returns candidate absolute paths, in lookup order.
*/
function executableCandidates(command, env = process.env, platform = process.platform) {
	const win = platform === "win32";
	const pathApi = win ? win32 : posix;
	const hasSeparator = command.includes("/") || command.includes("\\");
	if (isAbsolute(command) || hasSeparator) return [command];
	const searchPath = env.PATH ?? env.Path ?? "";
	const extensions = win ? (env.PATHEXT ?? ".COM;.EXE;.BAT;.CMD").split(";").filter((ext) => ext.length > 0) : [""];
	const directories = searchPath.split(win ? ";" : ":").filter((dir) => dir.length > 0);
	const candidates = [];
	for (const directory of directories) for (const extension of extensions) candidates.push(pathApi.join(directory, `${command}${extension}`));
	return candidates;
}
/**
* Resolve a bare command name against PATH (PATHEXT on Windows), or verify an
* absolute/relative path. Mirrors the DSH service contract: relative paths with
* separators are rejected because the resolution base would be ambiguous.
*
* @param command - absolute path or bare executable name.
* @param env - environment whose PATH/PATHEXT is consulted.
* @returns the resolved absolute path.
*/
async function resolveExecutable(command, env = process.env) {
	if (command.length === 0) throw new Error("dsh-test-kit: empty executable name");
	const hasSeparator = command.includes("/") || command.includes("\\");
	if (isAbsolute(command)) {
		if (!isFile(command)) throw new Error(`dsh-test-kit: executable not found at ${command}`);
		return command;
	}
	if (hasSeparator) throw new Error(`dsh-test-kit: relative executable paths are not supported (got ${JSON.stringify(command)}); use an absolute path or a bare PATH name`);
	for (const candidate of executableCandidates(command, env, process.platform)) {
		if (!isFile(candidate)) continue;
		try {
			accessSync(candidate, process.platform === "win32" ? constants.F_OK : constants.X_OK);
		} catch {
			continue;
		}
		return candidate;
	}
	throw new Error(`dsh-test-kit: executable "${command}" was not found on PATH`);
}
/** Tail-bounded collector with offset reads (only offset 0 is used by the engine). */
var TailCollector = class {
	maxBytes;
	chunks = [];
	bytes = 0;
	dropped = 0;
	constructor(maxBytes) {
		this.maxBytes = maxBytes;
	}
	push(chunk) {
		this.chunks.push(chunk);
		this.bytes += chunk.length;
		while (this.bytes > this.maxBytes && this.chunks.length > 1) {
			const head = this.chunks.shift();
			if (head === void 0) break;
			this.bytes -= head.length;
			this.dropped += head.length;
		}
		if (this.bytes > this.maxBytes) {
			const only = this.chunks[0];
			if (only !== void 0 && only.length > this.maxBytes) {
				this.dropped += only.length - this.maxBytes;
				this.chunks[0] = only.subarray(only.length - this.maxBytes);
				this.bytes = this.maxBytes;
			}
		}
	}
	read() {
		return {
			text: Buffer.concat(this.chunks).toString("utf8"),
			lossy: this.dropped > 0
		};
	}
};
/** Kill a child tree. POSIX uses the process group; Windows uses taskkill /T. */
function terminateTree(child, signal) {
	const pid = child.pid;
	if (pid === void 0) return;
	if (process.platform === "win32") {
		spawn("taskkill", [
			"/pid",
			String(pid),
			"/T",
			"/F"
		], {
			stdio: "ignore",
			windowsHide: true
		});
		return;
	}
	try {
		process.kill(-pid, signal);
	} catch {
		try {
			child.kill(signal);
		} catch {}
	}
}
/** One live child with the collected readers the engine expects. */
var NodeSubprocessHandle = class {
	done;
	collected;
	constructor(child, stdoutMax, stderrMax) {
		const stdout = new TailCollector(stdoutMax);
		const stderr = new TailCollector(stderrMax);
		child.stdout?.on("data", (chunk) => stdout.push(chunk));
		child.stderr?.on("data", (chunk) => stderr.push(chunk));
		this.collected = {
			stdout: { readFrom: () => stdout.read() },
			stderr: { readFrom: () => stderr.read() }
		};
		this.done = new Promise((resolveDone, rejectDone) => {
			child.once("error", rejectDone);
			child.once("close", (code) => resolveDone({ exitCode: code }));
		});
	}
};
/** The local subprocess service handed to the engine by the CLI. */
var NodeSubprocessService = class {
	baseEnv;
	constructor(baseEnv = process.env) {
		this.baseEnv = baseEnv;
	}
	resolveExecutable(command) {
		return resolveExecutable(command, this.baseEnv);
	}
	spawn(spec) {
		const [program, ...args] = spec.argv;
		if (program === void 0) throw new Error("dsh-test-kit: empty argv");
		if (process.platform === "win32" && /\.(?:cmd|bat|ps1)$/iu.test(program)) throw new Error(`dsh-test-kit: cannot spawn the Windows shim ${program} without a shell; pass the JS entry (node <path>) or install the CLI so a .exe/JS entry is resolved`);
		const env = {
			...scrubbedParentEnv(this.baseEnv),
			...spec.env
		};
		const child = spawn(program, args, {
			cwd: spec.cwd,
			env,
			stdio: [
				"ignore",
				"pipe",
				"pipe"
			],
			windowsHide: true,
			detached: process.platform !== "win32"
		});
		const handle = new NodeSubprocessHandle(child, spec.stdio.stdout.maxBytes, spec.stdio.stderr.maxBytes);
		const grace = spec.graceMs > 0 ? spec.graceMs : DEFAULT_TERMINATE_GRACE_MS;
		let killTimer;
		const onAbort = () => {
			terminateTree(child, "SIGTERM");
			killTimer = setTimeout(() => terminateTree(child, "SIGKILL"), grace);
			killTimer.unref();
		};
		if (spec.signal !== void 0) {
			if (spec.signal.aborted) onAbort();
			else spec.signal.addEventListener("abort", onAbort, { once: true });
		}
		handle.done.finally(() => {
			if (killTimer !== void 0) clearTimeout(killTimer);
			spec.signal?.removeEventListener("abort", onAbort);
		}).catch(() => {});
		return handle;
	}
};
/** Create the adapter used by the CLI. */
function createNodeSubprocessService() {
	return new NodeSubprocessService();
}
/**
* Build an `npm exec` argv prefix for a package spec that provides a `dsh`
* bin (e.g. `npm:@deepseek-ai/dsh@0.2.2-rc.3`). Resolving npm's JS entry keeps
* the spawn shell-free on Windows, where `.cmd` shims cannot be spawned
* directly.
*
* @param packageSpec - the npm package spec that owns the `dsh` bin.
* @returns the argv prefix to spawn.
*/
function npmExecArgv(packageSpec) {
	const npm = [
		process.env.npm_execpath,
		join(dirname(process.execPath), "node_modules", "npm", "bin", "npm-cli.js"),
		join(dirname(process.execPath), "..", "lib", "node_modules", "npm", "bin", "npm-cli.js"),
		process.platform === "win32" ? join(process.env.APPDATA ?? "", "npm", "node_modules", "npm", "bin", "npm-cli.js") : "/usr/lib/node_modules/npm/bin/npm-cli.js"
	].filter((candidate) => candidate !== void 0 && candidate !== "" && isFile(candidate))[0];
	if (npm === void 0) {
		if (process.platform === "win32") throw new Error("dsh-test-kit: cannot locate npm-cli.js for --dsh npm:<spec>; pass an absolute dsh path instead");
		return [
			"npm",
			"exec",
			"--yes",
			"--package",
			packageSpec,
			"--",
			"dsh"
		];
	}
	return [
		process.execPath,
		npm,
		"exec",
		"--yes",
		"--package",
		packageSpec,
		"--",
		"dsh"
	];
}
/**
* Wait until a configured absolute path exists (used by `--dsh <path>`).
* Kept separate from resolution so the CLI can fail with a usage error before
* any temp workspace is created.
*
* @param path - candidate executable path.
* @returns true when it is an existing file.
*/
function executableExists(path) {
	return isFile(path);
}
// src/cli.ts
/**
* `dsh-test-kit` — standalone install-and-smoke test drives for DeepSeek
* Harness plugins, usable from any CI without a running DSH instance.
*
* Two commands:
*   run <target>   drive one target through install → patch check → boot smoke
*                  → uninstall → cleanup in a throwaway DSH_HOME and write the
*                  frozen `dsh-test-drive/v1` JSON record.
*   render         validate a settled record and emit the Markdown + JUnit pair.
*
* The engine is the extracted `dsh-test-drive` pipeline; the only DSH-shaped
* seam is the local subprocess adapter (`./subprocess.ts`), so this CLI starts
* with plain Node and never imports `@deepseek-ai/*` at runtime.
*
* @module dsh-test-kit/cli
*/
/** The kit's own package version (recorded as `run.pluginVersion`). */
const KIT_VERSION = (() => {
	try {
		const manifest = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
		return typeof manifest.version === "string" ? manifest.version : "0.0.0";
	} catch {
		return "0.0.0";
	}
})();
/** Exit codes: verdict-mapped for `run`, sysexits-style for failures. */
const EXIT = {
	pass: 0,
	fail: 1,
	partial: 2,
	unknown: 3,
	usage: 64,
	badInput: 65,
	software: 70
};
/** A user-facing usage error (exit 64). */
var UsageError = class extends Error {};
/** A malformed result file (exit 65). */
var InputError = class extends Error {};
/** Write one line to stderr (never cargo-cults stdout for diagnostics). */
function note(line) {
	process.stderr.write(`${line}\n`);
}
/** The verdict-to-exit mapping shared by `run`. */
function exitCodeFor(verdict, noFail) {
	if (noFail) return 0;
	return EXIT[verdict];
}
/** Split `--key=value` / `--key value` arguments. */
function argValue(argv, index, name) {
	const token = argv[index];
	if (token === void 0) throw new UsageError(`missing value for ${name}`);
	if (token.startsWith(`${name}=`)) return {
		value: token.slice(name.length + 1),
		next: index + 1
	};
	const value = argv[index + 1];
	if (value === void 0 || value.startsWith("--")) throw new UsageError(`missing value for ${name}`);
	return {
		value,
		next: index + 2
	};
}
/** Parse `run` arguments. */
function parseRun(argv) {
	let target;
	let headlessTask;
	let dsh;
	let json = join(process.cwd(), "dsh-test-kit-result.json");
	let profileName;
	let timeout;
	let installTimeout;
	let configTimeout;
	let smokeTimeout;
	let uninstallTimeout;
	const forwardEnv = [];
	let keepTempDirs = false;
	let noSmoke = false;
	let noFail = false;
	let capKind;
	let capName = "";
	let capArgs = "";
	let capExpect = "";
	const number = (raw, name) => {
		const value = Number(raw);
		if (!Number.isFinite(value) || !Number.isInteger(value) || value <= 0) throw new UsageError(`${name} must be a positive integer (got ${JSON.stringify(raw)})`);
		return value;
	};
	for (let i = 0; i < argv.length;) {
		const token = argv[i];
		if (token === void 0) break;
		if (!token.startsWith("--")) {
			if (target !== void 0) throw new UsageError(`unexpected extra target ${JSON.stringify(token)} (v0.1 drives one target per invocation)`);
			target = token;
			i += 1;
			continue;
		}
		const name = token.includes("=") ? token.slice(0, token.indexOf("=")) : token;
		switch (name) {
			case "--headless-task": {
				const parsed = argValue(argv, i, name);
				headlessTask = parsed.value;
				i = parsed.next;
				break;
			}
			case "--dsh": {
				const parsed = argValue(argv, i, name);
				dsh = parsed.value;
				i = parsed.next;
				break;
			}
			case "--json": {
				const parsed = argValue(argv, i, name);
				json = parsed.value;
				i = parsed.next;
				break;
			}
			case "--profile": {
				const parsed = argValue(argv, i, name);
				profileName = parsed.value;
				i = parsed.next;
				break;
			}
			case "--timeout": {
				const parsed = argValue(argv, i, name);
				timeout = number(parsed.value, name);
				i = parsed.next;
				break;
			}
			case "--install-timeout": {
				const parsed = argValue(argv, i, name);
				installTimeout = number(parsed.value, name);
				i = parsed.next;
				break;
			}
			case "--config-timeout": {
				const parsed = argValue(argv, i, name);
				configTimeout = number(parsed.value, name);
				i = parsed.next;
				break;
			}
			case "--smoke-timeout": {
				const parsed = argValue(argv, i, name);
				smokeTimeout = number(parsed.value, name);
				i = parsed.next;
				break;
			}
			case "--uninstall-timeout": {
				const parsed = argValue(argv, i, name);
				uninstallTimeout = number(parsed.value, name);
				i = parsed.next;
				break;
			}
			case "--forward-env": {
				const parsed = argValue(argv, i, name);
				forwardEnv.push(parsed.value);
				i = parsed.next;
				break;
			}
			case "--capability-kind": {
				const parsed = argValue(argv, i, name);
				if (parsed.value !== "tool" && parsed.value !== "command") throw new UsageError("--capability-kind must be tool or command");
				capKind = parsed.value;
				i = parsed.next;
				break;
			}
			case "--capability-name": {
				const parsed = argValue(argv, i, name);
				capName = parsed.value;
				i = parsed.next;
				break;
			}
			case "--capability-args": {
				const parsed = argValue(argv, i, name);
				capArgs = parsed.value;
				i = parsed.next;
				break;
			}
			case "--capability-expect": {
				const parsed = argValue(argv, i, name);
				capExpect = parsed.value;
				i = parsed.next;
				break;
			}
			case "--keep-temp":
				keepTempDirs = true;
				i += 1;
				break;
			case "--no-smoke":
				noSmoke = true;
				i += 1;
				break;
			case "--no-fail":
				noFail = true;
				i += 1;
				break;
			default: throw new UsageError(`unknown option ${JSON.stringify(name)} (see dsh-test-kit run --help)`);
		}
	}
	if (target === void 0 || target.length === 0) throw new UsageError("run needs a target: github:owner/repo#sha, git+https://..., npm:name, a local path, or a .tgz");
	return {
		target,
		headlessTask,
		noSmoke,
		dsh,
		json,
		profileName,
		timeout,
		installTimeout,
		configTimeout,
		smokeTimeout,
		uninstallTimeout,
		forwardEnv,
		keepTempDirs,
		noFail,
		capability: capKind === void 0 && capName === "" ? void 0 : {
			kind: capKind ?? "tool",
			name: capName,
			args: capArgs,
			expect: capExpect
		}
	};
}
/** Resolve `--dsh` into a driver location: path, argv prefix, or PATH name. */
async function resolveDsh(value) {
	const raw = value !== void 0 && value !== "" ? value : process.env.DSH_BIN ?? "";
	if (raw === "" || raw === "dsh") return {};
	if (raw.startsWith("npm:")) return { dshArgv: npmExecArgv(raw.slice(4)) };
	if (!raw.includes("/") && !raw.includes("\\") && /^(@[^/]+\/)?[^@/]+@[^@/]+$/u.test(raw)) return { dshArgv: npmExecArgv(raw) };
	const absolute = isAbsolute(raw) ? raw : resolve(raw);
	if (!executableExists(absolute)) throw new UsageError(`--dsh ${JSON.stringify(raw)} does not resolve to a file (${absolute})`);
	if (process.platform === "win32" && /\.(?:cmd|bat)$/iu.test(absolute)) {
		const shim = parseNpmShim(absolute, readFileSync(absolute, "utf8"));
		if (!executableExists(shim)) throw new UsageError(`--dsh shim ${absolute} points at a missing JS entry (${shim})`);
		return { dshArgv: [process.execPath, shim] };
	}
	if (process.platform === "win32" && /\.ps1$/iu.test(absolute)) throw new UsageError(`--dsh ${absolute} is a PowerShell shim; pass the .cmd shim or the JS entry`);
	return { dshBin: absolute };
}
/** Build the resolved engine config from run options. */
function buildConfig(options, dsh) {
	const input = {};
	if (dsh.dshBin !== void 0) input.dshBin = dsh.dshBin;
	if (options.profileName !== void 0) input.profileName = options.profileName;
	if (options.noSmoke) input.headlessTask = "";
	else if (options.headlessTask !== void 0) input.headlessTask = options.headlessTask;
	if (options.forwardEnv.length > 0) input.forwardEnv = options.forwardEnv;
	if (options.keepTempDirs) input.keepTempDirs = true;
	if (options.timeout !== void 0) {
		input.installTimeoutMs = options.timeout;
		input.configTimeoutMs = options.timeout;
		input.smokeTimeoutMs = options.timeout;
		input.uninstallTimeoutMs = options.timeout;
	}
	if (options.installTimeout !== void 0) input.installTimeoutMs = options.installTimeout;
	if (options.configTimeout !== void 0) input.configTimeoutMs = options.configTimeout;
	if (options.smokeTimeout !== void 0) input.smokeTimeoutMs = options.smokeTimeout;
	if (options.uninstallTimeout !== void 0) input.uninstallTimeoutMs = options.uninstallTimeout;
	if (options.capability !== void 0) input.capability = {
		enabled: true,
		kind: options.capability.kind,
		name: options.capability.name,
		args: options.capability.args,
		expect: options.capability.expect
	};
	return resolveConfig(input);
}
/** Human summary of one settled drive (stderr only). */
function printSummary(result, jsonPath) {
	const { stages } = result;
	const stage = (name, status) => `${name}=${status}`;
	note(`dsh-test-kit: ${result.target.spec} (${result.target.kind})`);
	note(`  verdict: ${result.verdict} — ${result.verdictReason}`);
	note(`  stages: ${[
		stage("install", stages.install.status),
		stage("config", stages.config.status),
		stage("smoke", stages.smoke.status),
		stage("uninstall", stages.uninstall.status),
		stage("cleanup", stages.cleanup.status)
	].join(" ")}`);
	if (jsonPath !== "-") note(`  result: ${jsonPath}`);
}
/** `run` implementation. */
async function commandRun(argv) {
	const options = parseRun(argv);
	const dsh = await resolveDsh(options.dsh);
	const config = buildConfig(options, dsh);
	const log = (line) => note(`[dsh-test-kit] ${line}`);
	const controller = new AbortController();
	const onSignal = () => controller.abort();
	process.once("SIGINT", onSignal);
	process.once("SIGTERM", onSignal);
	const temp = new TempWorkspaceRegistry(log);
	const runner = new DriveRunner({
		config,
		driver: new DshDriver({
			subprocess: createNodeSubprocessService(),
			...dsh.dshArgv === void 0 ? {} : { dshArgv: dsh.dshArgv },
			config,
			log
		}),
		temp,
		log,
		domain: async () => ({ table: () => ({ put: async () => {} }) }),
		producerVersion: KIT_VERSION
	});
	try {
		const result = await runner.drive(options.target, {
			signal: controller.signal,
			...options.headlessTask === void 0 ? {} : { headlessTask: options.headlessTask },
			...options.noSmoke ? { headlessTask: "" } : {},
			cwd: process.cwd()
		});
		const validated = DriveResultSchema.parse(result);
		if (options.json === "-") {
			process.stdout.write(`${JSON.stringify(validated, null, 2)}\n`);
			printSummary(validated, "-");
		} else {
			const jsonPath = isAbsolute(options.json) ? options.json : resolve(process.cwd(), options.json);
			mkdirSync(dirname(jsonPath), { recursive: true });
			writeFileSync(jsonPath, `${JSON.stringify(validated, null, 2)}\n`, "utf8");
			process.stdout.write(`${JSON.stringify({
				schema: RESULT_SCHEMA,
				runId: validated.run.runId,
				target: validated.target.spec,
				kind: validated.target.kind,
				verdict: validated.verdict,
				verdictReason: validated.verdictReason,
				json: jsonPath
			})}\n`);
			printSummary(validated, jsonPath);
		}
		return exitCodeFor(validated.verdict, options.noFail);
	} finally {
		process.removeListener("SIGINT", onSignal);
		process.removeListener("SIGTERM", onSignal);
		await temp.disposeAll().catch(() => {});
	}
}
/** Parse `render` arguments. */
function parseRender(argv) {
	let input;
	let outDir = "reports";
	for (let i = 0; i < argv.length;) {
		const token = argv[i];
		if (token === void 0) break;
		if (token === "--input" || token.startsWith("--input=")) {
			const parsed = argValue(argv, i, "--input");
			input = parsed.value;
			i = parsed.next;
		} else if (token === "--out-dir" || token.startsWith("--out-dir=")) {
			const parsed = argValue(argv, i, "--out-dir");
			outDir = parsed.value;
			i = parsed.next;
		} else if (token.startsWith("--")) throw new UsageError(`unknown option ${JSON.stringify(token)} (see dsh-test-kit render --help)`);
		else {
			if (input !== void 0) throw new UsageError("render accepts exactly one --input");
			input = token;
			i += 1;
		}
	}
	if (input === void 0 || input.length === 0) throw new UsageError("render needs --input <result.json>");
	return {
		input,
		outDir
	};
}
/** `render` implementation: validate then serialize the report pair. */
async function commandRender(argv) {
	const options = parseRender(argv);
	const inputPath = isAbsolute(options.input) ? options.input : resolve(process.cwd(), options.input);
	let raw;
	try {
		raw = JSON.parse(readFileSync(inputPath, "utf8"));
	} catch (error) {
		throw new InputError(`cannot read ${inputPath}: ${String(error)}`);
	}
	let markdown;
	let junit;
	let verdict;
	let kind;
	let exitCode = EXIT.pass;
	const drive = DriveResultSchema.safeParse(raw);
	if (drive.success) {
		kind = "drive";
		const failed = failedStageNames(drive.data);
		const [stageVerdict, stageReason] = verdictOf(drive.data);
		let settled = drive.data;
		if (drive.data.verdict === "pass" && (failed.length > 0 || stageVerdict !== "pass")) {
			const effectiveVerdict = stageVerdict === "pass" ? "fail" : stageVerdict;
			settled = {
				...drive.data,
				verdict: effectiveVerdict,
				verdictReason: `record claimed pass, but the stages say ${effectiveVerdict}` + (failed.length > 0 ? ` (failed stage${failed.length === 1 ? "" : "s"}: ${failed.join(", ")})` : "") + `: ${stageReason}`
			};
			exitCode = failed.length > 0 ? EXIT.fail : exitCodeFor(stageVerdict, false);
			note(`dsh-test-kit: record verdict "pass" contradicts its stages (${failed.join(", ") || stageReason}); rendering ${effectiveVerdict} and exiting ${exitCode}`);
		}
		markdown = renderDriveResult(settled);
		junit = renderDriveJUnitXml(settled);
		verdict = settled.verdict;
	} else {
		const matrix = MatrixRecordSchema.safeParse(raw);
		if (!matrix.success) throw new InputError(`not a ${RESULT_SCHEMA} record: expected a drive result or a batch matrix; refusing to render placeholder JSON\n  drive: ${drive.error.issues.map((issue) => `${issue.path.join(".") || "<root>"}: ${issue.message}`).slice(0, 4).join("; ")}\n  matrix: ${matrix.error.issues.map((issue) => `${issue.path.join(".") || "<root>"}: ${issue.message}`).slice(0, 4).join("; ")}`);
		kind = "matrix";
		const totals = totalsOf(matrix.data.rows);
		markdown = renderMatrix(matrix.data);
		junit = renderMatrixJUnitXml(matrix.data);
		verdict = matrix.data.rows.length === 0 ? "unknown" : totals.fail > 0 ? "fail" : totals.partial > 0 ? "partial" : totals.unknown > 0 ? totals.pass > 0 ? "partial" : "unknown" : "pass";
	}
	const outDir = isAbsolute(options.outDir) ? options.outDir : resolve(process.cwd(), options.outDir);
	mkdirSync(outDir, { recursive: true });
	const stem = basename(inputPath).replace(/\.json$/iu, "").replace(/[^\w.-]+/gu, "-") || "report";
	const markdownPath = join(outDir, `${stem}.md`);
	const junitPath = join(outDir, `${stem}.junit.xml`);
	writeFileSync(markdownPath, markdown, "utf8");
	writeFileSync(junitPath, junit, "utf8");
	process.stdout.write(`${JSON.stringify({
		schema: RESULT_SCHEMA,
		kind,
		verdict,
		markdown: markdownPath,
		junit: junitPath
	})}\n`);
	note(`dsh-test-kit: rendered ${kind} (${verdict}) → ${markdownPath} + ${junitPath}`);
	return exitCode;
}
/** Stage names whose own outcome is a hard `fail` (used to reject a green render). */
function failedStageNames(result) {
	const { install, config, smoke, uninstall, cleanup, capability } = result.stages;
	const failed = [];
	if (install.status === "fail") failed.push("install");
	if (config.status === "fail") failed.push("config");
	if (smoke.status === "fail") failed.push("smoke");
	if (capability !== void 0 && (capability.status === "failed" || capability.status === "not-registered")) failed.push("capability");
	if (uninstall.status === "fail") failed.push("uninstall");
	if (cleanup.status === "fail") failed.push("cleanup");
	return failed;
}
/** Help text. */
const HELP = `dsh-test-kit ${KIT_VERSION} (engine ${VERSION})

Run an isolated install-and-smoke test drive for a DeepSeek Harness plugin
target and emit a frozen-schema JSON record plus Markdown/JUnit CI reports.
The drive uses a throwaway DSH_HOME; the host profile is never read or written.

USAGE
  dsh-test-kit run <target> [options]
  dsh-test-kit render --input <result.json> [--out-dir <dir>]
  dsh-test-kit --version

TARGETS
  github:owner/repo#<sha>       GitHub source (pnpm/dsh resolves the ref)
  git+https://host/repo.git#ref git source
  npm:<name>[@<version>]        registry package
  ./path or /abs/path           local plugin checkout
  ./plugin.tgz                  packed tarball

RUN OPTIONS
  --headless-task <text>        one-shot boot-smoke task (empty string = skip)
  --no-smoke                    skip the boot-smoke stage
  --dsh <spec>                  dsh executable path, bare command, or npm:pkg@ver
                                (default: DSH_BIN or "dsh" on PATH)
  --json <path|->               record path (default ./dsh-test-kit-result.json;
                                "-" writes the full record to stdout)
  --profile <name>              throwaway profile template (default headless)
  --timeout <ms>                set every stage timeout
  --install-timeout <ms>        install stage timeout
  --config-timeout <ms>         --dump-config stage timeout
  --smoke-timeout <ms>          boot-smoke stage timeout
  --uninstall-timeout <ms>      uninstall stage timeout
  --forward-env <NAME>          forward one env var into the throwaway profile
                                (repeatable; nothing is forwarded by default)
  --capability-kind <tool|command>
  --capability-name <name>      prove a named capability is registered + invoked
  --capability-args <text>
  --capability-expect <text>
  --keep-temp                   keep the temp workspace on failure
  --no-fail                     exit 0 even when the verdict is fail/partial/unknown

EXIT CODES
  run:    0 pass · 1 fail · 2 partial · 3 unknown · 64 usage · 70 internal
  render: 0 reports written from a consistent record · 1 pass claim contradicted by a failed stage · 2/3 other contradictions · 64 usage · 65 input is not a dsh-test-drive/v1 record

The JSON schema is frozen: schema "dsh-test-drive/v1". Output is sanitized
(tokens, URL credentials, bearer headers, temp paths) before it reaches a report.
`;
/** Entrypoint: dispatch and map errors to exit codes. */
async function main(argv = process.argv.slice(2)) {
	const [command, ...rest] = argv;
	if (command === void 0 || command === "--help" || command === "-h" || command === "help") {
		process.stdout.write(HELP);
		return command === void 0 ? EXIT.usage : EXIT.pass;
	}
	if (command === "--version" || command === "-v") {
		process.stdout.write(`${KIT_VERSION}\n`);
		return EXIT.pass;
	}
	try {
		if (command === "run") {
			if (rest.includes("--help") || rest.includes("-h")) {
				process.stdout.write(HELP);
				return EXIT.pass;
			}
			return await commandRun(rest);
		}
		if (command === "render") {
			if (rest.includes("--help") || rest.includes("-h")) {
				process.stdout.write(HELP);
				return EXIT.pass;
			}
			return await commandRender(rest);
		}
		throw new UsageError(`unknown command ${JSON.stringify(command)} (expected run or render)`);
	} catch (error) {
		if (error instanceof UsageError) {
			note(`dsh-test-kit: ${error.message}`);
			return EXIT.usage;
		}
		if (error instanceof InputError) {
			note(`dsh-test-kit: ${error.message}`);
			return EXIT.badInput;
		}
		note(`dsh-test-kit: ${error instanceof Error ? error.stack ?? error.message : String(error)}`);
		return EXIT.software;
	}
}
/** Whether this module is the process entrypoint (symlink-safe for npm bins). */
function invokedDirectly() {
	const entry = process.argv[1];
	if (entry === void 0) return false;
	try {
		return realpathSync(entry) === realpathSync(fileURLToPath(import.meta.url));
	} catch {
		return resolve(entry) === fileURLToPath(import.meta.url);
	}
}
if (invokedDirectly()) {
	const code = await main();
	process.exitCode = code;
}
export { DriveResultSchema, EXIT, KIT_VERSION, MatrixRecordSchema, classifyTarget, exitCodeFor, formatDuration, isGitLike, main, redactSecrets, renderDriveJUnitXml, renderDriveResult, renderMatrix, renderMatrixJUnitXml, sanitizeOutput, sanitizeTarget, statusMark, totalsOf, verdictOf };
