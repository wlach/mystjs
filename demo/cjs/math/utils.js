"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderMath = void 0;
const utils_1 = require("../utils");
const renderMath = (math, block, target) => {
    const { id, number } = target !== null && target !== void 0 ? target : {};
    const [html] = (0, utils_1.toHTML)([
        block ? 'div' : 'span',
        {
            class: target ? ['math', 'numbered'] : 'math',
            id,
            number,
            children: block ? `\\[\n${math}\n\\]` : `\\(${math}\\)`,
        },
    ], { inline: true });
    return block ? `${html}\n` : html;
};
exports.renderMath = renderMath;
//# sourceMappingURL=utils.js.map