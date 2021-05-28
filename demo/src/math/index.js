"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.plugin = exports.addMathRenderers = void 0;
const markdown_it_texmath_1 = __importDefault(require("markdown-it-texmath"));
const amsmath_1 = __importDefault(require("./amsmath"));
const utils_1 = require("./utils");
function addMathRenderers(md) {
    const { renderer } = md;
    renderer.rules.math_inline = (tokens, idx) => utils_1.renderMath(tokens[idx].content, false);
    // Note: this will actually create invalid HTML
    renderer.rules.math_inline_double = (tokens, idx) => utils_1.renderMath(tokens[idx].content, true);
    renderer.rules.math_block = (tokens, idx) => utils_1.renderMath(tokens[idx].content, true);
    renderer.rules.math_block_end = () => '';
    renderer.rules.math_block_eqno = (tokens, idx) => { var _a; return utils_1.renderMath(tokens[idx].content, true, (_a = tokens[idx].meta) === null || _a === void 0 ? void 0 : _a.target); };
    renderer.rules.math_block_eqno_end = () => '';
}
exports.addMathRenderers = addMathRenderers;
function plugin(md) {
    md.use(markdown_it_texmath_1.default, {
        engine: { renderToString: (s) => s },
        delimiters: 'dollars'
    });
    amsmath_1.default(md);
    // Note: numbering of equations for `math_block_eqno` happens in the directives rules
    addMathRenderers(md);
}
exports.plugin = plugin;
//# sourceMappingURL=index.js.map