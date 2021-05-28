"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../utils");
const roles = {
    myst_role: {
        token: 'myst_role',
        renderer: (tokens, idx) => {
            var _a, _b;
            const token = tokens[idx];
            const name = (_b = (_a = token.meta) === null || _a === void 0 ? void 0 : _a.name) !== null && _b !== void 0 ? _b : 'unknown';
            const [html] = utils_1.toHTML(['code', { class: 'myst-role', children: `{${name}}\`${token.content}\`` }], { inline: true });
            return html;
        }
    }
};
exports.default = roles;
//# sourceMappingURL=generic.js.map