import { dollarmathPlugin } from 'markdown-it-dollarmath';
import { amsmathPlugin } from 'markdown-it-amsmath';
import { renderMath } from './utils';
export function addMathRenderers(md) {
    const { renderer } = md;
    renderer.rules.math_inline = (tokens, idx) => renderMath(tokens[idx].content, false);
    // Note: this will actually create invalid HTML
    renderer.rules.math_inline_double = (tokens, idx) => renderMath(tokens[idx].content, true);
    renderer.rules.math_block = (tokens, idx) => renderMath(tokens[idx].content, true);
    renderer.rules.math_block_label = (tokens, idx) => { var _a; return renderMath(tokens[idx].content, true, (_a = tokens[idx].meta) === null || _a === void 0 ? void 0 : _a.target); };
}
export function plugin(md, options) {
    const opts = options === true ? { amsmath: true, dollarmath: true } : options;
    if (opts === null || opts === void 0 ? void 0 : opts.dollarmath)
        dollarmathPlugin(md);
    if (opts === null || opts === void 0 ? void 0 : opts.amsmath)
        amsmathPlugin(md, {
            renderer: (content) => renderMath(content, true),
        });
    // Note: numbering of equations for `math_block_label` happens in the directives rules
    addMathRenderers(md);
}
//# sourceMappingURL=index.js.map