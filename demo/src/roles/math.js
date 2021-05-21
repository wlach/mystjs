"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../math/utils");
const roles = {
    math: {
        token: 'math_inline',
        renderer: (tokens, idx) => utils_1.renderMath(tokens[idx].content, false),
    },
};
exports.default = roles;
//# sourceMappingURL=math.js.map