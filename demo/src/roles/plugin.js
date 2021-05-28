"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.plugin = void 0;
const generic_1 = __importDefault(require("./generic"));
// Ported from https://github.com/executablebooks/markdown-it-py/blob/master/markdown_it/extensions/myst_role/index.py
// MIT License: https://github.com/executablebooks/markdown-it-py/blob/master/LICENSE
// e.g. {role}`text`
let x;
try {
    x = new RegExp('^\\{([a-zA-Z_\\-+:]{1,36})\\}(`+)(?!`)(.+?)(?<!`)\\2(?!`)');
}
catch (error) {
    // Safari does not support negative look-behinds
    // This is a slightly down-graded, as it does not require a space.
    x = /^\{([a-zA-Z_\-+:]{1,36})\}(`+)(?!`)(.+?)\2(?!`)/;
}
const ROLE_PATTERN = x;
const getRoleAttrs = (roles) => (name, content) => {
    var _a, _b;
    const roleF = (_a = roles[name]) !== null && _a !== void 0 ? _a : generic_1.default.myst_role;
    if (roleF.getAttrs) {
        const { attrs, content: modified } = roleF.getAttrs(content);
        return { token: roleF.token, attrs: attrs !== null && attrs !== void 0 ? attrs : {}, content: modified !== null && modified !== void 0 ? modified : content };
    }
    return { token: roleF.token, attrs: (_b = roleF.attrs) !== null && _b !== void 0 ? _b : {}, content };
};
const addRenderers = (roles) => (md) => {
    const { renderer } = md;
    Object.entries(roles).forEach(([, { token, renderer: tokenRenderer }]) => {
        // Early return if the role is already defined
        // e.g. math_inline might be better handled by another plugin
        if (md.renderer.rules[token])
            return;
        renderer.rules[token] = tokenRenderer;
    });
};
const mystRole = (roles) => (state, silent) => {
    // Check if the role is escaped
    if (state.src.charCodeAt(state.pos - 1) === 0x5c) {
        /* \ */
        // TODO: this could be improved in the case of edge case '\\{'
        return false;
    }
    const match = ROLE_PATTERN.exec(state.src.slice(state.pos));
    if (match == null)
        return false;
    const [str, name, , content] = match;
    // eslint-disable-next-line no-param-reassign
    state.pos += str.length;
    if (!silent) {
        const role = getRoleAttrs(roles)(name, content);
        const token = state.push(role.token, '', 0);
        Object.entries(role.attrs).map(([k, v]) => token.attrSet(k, v));
        token.meta = { name };
        token.content = role.content;
    }
    return true;
};
const plugin = (roles) => (md) => {
    md.inline.ruler.before('backticks', 'myst_role', mystRole(roles));
    addRenderers(roles)(md);
};
exports.plugin = plugin;
//# sourceMappingURL=plugin.js.map