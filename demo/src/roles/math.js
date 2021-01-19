"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const math_1 = require("../math");
const roles = {
    math: {
        token: 'math_inline',
        renderer: (tokens, idx) => math_1.renderMath(tokens[idx].content, false),
    },
};
exports.default = roles;
//# sourceMappingURL=math.js.map