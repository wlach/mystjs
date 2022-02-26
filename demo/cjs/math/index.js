"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.plugin = exports.addMathRenderers = void 0;
const markdown_it_dollarmath_1 = require("markdown-it-dollarmath");
const markdown_it_amsmath_1 = require("markdown-it-amsmath");
const utils_1 = require("./utils");
function addMathRenderers(md) {
    const { renderer } = md;
    renderer.rules.math_inline = (tokens, idx) => (0, utils_1.renderMath)(tokens[idx].content, false);
    // Note: this will actually create invalid HTML
    renderer.rules.math_inline_double = (tokens, idx) => (0, utils_1.renderMath)(tokens[idx].content, true);
    renderer.rules.math_block = (tokens, idx) => (0, utils_1.renderMath)(tokens[idx].content, true);
    renderer.rules.math_block_label = (tokens, idx) => { var _a; return (0, utils_1.renderMath)(tokens[idx].content, true, (_a = tokens[idx].meta) === null || _a === void 0 ? void 0 : _a.target); };
}
exports.addMathRenderers = addMathRenderers;
function plugin(md, options) {
    const opts = options === true ? { amsmath: true, dollarmath: true } : options;
    if (opts === null || opts === void 0 ? void 0 : opts.dollarmath)
        (0, markdown_it_dollarmath_1.dollarmathPlugin)(md);
    if (opts === null || opts === void 0 ? void 0 : opts.amsmath)
        (0, markdown_it_amsmath_1.amsmathPlugin)(md, {
            renderer: (content) => (0, utils_1.renderMath)(content, true),
        });
    // Note: numbering of equations for `math_block_label` happens in the directives rules
    addMathRenderers(md);
}
exports.plugin = plugin;
//# sourceMappingURL=index.js.map