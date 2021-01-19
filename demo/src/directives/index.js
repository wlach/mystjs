"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.directivesPlugin = void 0;
const markdown_it_container_1 = __importDefault(require("markdown-it-container"));
const options_1 = __importDefault(require("./options"));
const types_1 = require("./types");
const state_1 = require("../state");
const utils_1 = require("../utils");
const DIRECTIVE_PATTERN = /^\{([a-z]*)\}\s*(.*)$/;
function getDirective(directives, kind) {
    if (!kind)
        return undefined;
    return directives[kind];
}
/**
 * Container that continues to render internally.
 *
 * For not rendering the internals (e.g. math), use `skipParsing`
 * and the directive will modify a `fence` renderer.
 *
 * @param directives The directives to use
 */
const directiveContainer = (directives) => ({
    marker: '`',
    validate(params) {
        const match = params.trim().match(DIRECTIVE_PATTERN);
        if (!match)
            return false;
        const kind = match[1];
        const directive = getDirective(directives, kind);
        return Boolean(directive) && !(directive === null || directive === void 0 ? void 0 : directive.skipParsing);
    },
    render(tokens, idx, options, env, self) {
        var _a;
        const token = tokens[idx];
        const kind = (_a = token.attrGet('kind')) !== null && _a !== void 0 ? _a : '';
        const directive = getDirective(directives, kind);
        const { args, opts, target } = token.meta;
        const htmlTemplate = directive.renderer(args, opts, target, tokens, idx, options, env, self);
        const [before, after] = utils_1.toHTML(htmlTemplate);
        return token.nesting === 1 ? before : after;
    },
});
/**
 * This overrides the `fence` when `skipParsing` is set to true on a directive.
 *
 * @param directives The directives to use
 */
const fenceRenderer = (directives) => (tokens, idx, options, env, self) => {
    var _a;
    const token = tokens[idx];
    const kind = (_a = token.attrGet('kind')) !== null && _a !== void 0 ? _a : '';
    const directive = getDirective(directives, kind);
    const { args, opts, target } = token.meta;
    const htmlTemplate = directive.renderer(args, opts, target, tokens, idx, options, env, self);
    const [before, after] = utils_1.toHTML(htmlTemplate);
    return `${before}${token.content}${after}`;
};
const setDirectiveKind = (directives) => (state) => {
    var _a, _b;
    const { tokens } = state;
    let kind = false;
    for (let index = 0; index < tokens.length; index += 1) {
        const token = tokens[index];
        if (token.type === types_1.DirectiveTokens.open) {
            const match = token.info.trim().match(DIRECTIVE_PATTERN);
            const directive = getDirective(directives, (_a = match === null || match === void 0 ? void 0 : match[1]) !== null && _a !== void 0 ? _a : '');
            if (!directive)
                throw new Error('Shoud not be able to get into here without having directive.');
            kind = directive.token;
            token.attrSet('kind', kind);
        }
        if (token.type === 'fence') {
            // Here we match the directives that `skipParsing`, and turn them into `directive_fences`
            // The options are then added as normal, the rendering is done in `fenceRenderer`
            const match = token.info.trim().match(DIRECTIVE_PATTERN);
            const directive = getDirective(directives, (_b = match === null || match === void 0 ? void 0 : match[1]) !== null && _b !== void 0 ? _b : '');
            if (directive && directive.skipParsing) {
                token.type = types_1.DirectiveTokens.fence;
                kind = directive.token;
                token.attrSet('kind', kind);
            }
        }
        if (token.type === types_1.DirectiveTokens.close) {
            // Set the kind on the closing container as well, as that will have to render the closing tags
            token.attrSet('kind', kind);
            kind = false;
        }
    }
    return true;
};
const parseArguments = (directives) => (state) => {
    var _a, _b, _c, _d;
    const { tokens } = state;
    let parent = false;
    // If there is a title on the first line when not required, bump it to the first inline
    let bumpArguments = '';
    for (let index = 0; index < tokens.length; index += 1) {
        const token = tokens[index];
        if (token.type === types_1.DirectiveTokens.open) {
            parent = token;
            const match = token.info.trim().match(DIRECTIVE_PATTERN);
            const directive = getDirective(directives, token.attrGet('kind'));
            if (!match || !directive)
                throw new Error('Shoud not be able to get into here without matching?');
            const info = match[2].trim();
            const { args, content: modified } = (_b = (_a = directive.getArguments) === null || _a === void 0 ? void 0 : _a.call(directive, info)) !== null && _b !== void 0 ? _b : {};
            token.meta = Object.assign(Object.assign({}, token.meta), { args });
            if (modified)
                bumpArguments = modified;
        }
        if (token.type === types_1.DirectiveTokens.fence) {
            const match = token.info.trim().match(DIRECTIVE_PATTERN);
            const directive = getDirective(directives, token.attrGet('kind'));
            if (!match || !directive)
                throw new Error('Shoud not be able to get into here without matching?');
            const info = match[2].trim();
            const { args, content: modified } = (_d = (_c = directive.getArguments) === null || _c === void 0 ? void 0 : _c.call(directive, info)) !== null && _d !== void 0 ? _d : {};
            token.meta = Object.assign(Object.assign({}, token.meta), { args });
            if (modified)
                token.content = modified + token.content;
        }
        if (parent && token.type === types_1.DirectiveTokens.close) {
            // TODO: https://github.com/executablebooks/MyST-Parser/issues/154
            // If the bumped title needs to be rendered - put it here somehow.
            bumpArguments = '';
            token.meta = parent.meta;
            parent = false;
        }
        if (parent && bumpArguments && token.type === 'inline') {
            token.content = `${bumpArguments} ${token.content}`;
            bumpArguments = '';
        }
    }
    return true;
};
const numbering = (directives) => (state) => {
    var _a;
    const { tokens } = state;
    for (let index = 0; index < tokens.length; index += 1) {
        const token = tokens[index];
        if (token.type === types_1.DirectiveTokens.open || token.type === types_1.DirectiveTokens.fence) {
            const directive = getDirective(directives, token.attrGet('kind'));
            const { name } = (_a = token.meta) === null || _a === void 0 ? void 0 : _a.opts;
            /* Only number things if:
             *    * the directive supports numbering
             *    * AND a name is provided
             *    * OR autoNumber for the directive is on
             */
            if ((directive === null || directive === void 0 ? void 0 : directive.numbered) && (name || (directive === null || directive === void 0 ? void 0 : directive.autoNumber))) {
                const target = state_1.newTarget(state, name, directive.numbered);
                token.meta.target = target;
            }
        }
        if (token.type === 'math_block_eqno') {
            // This is parsed using the markdownTexMath library, and the name comes on the info:
            const name = token.info;
            const target = state_1.newTarget(state, name, state_1.TargetKind.equation);
            token.meta = Object.assign(Object.assign({}, token.meta), { target });
        }
    }
    return true;
};
const directivesPlugin = (directives) => (md) => {
    const { renderer } = md;
    md.use(markdown_it_container_1.default, 'directives', directiveContainer(directives));
    md.core.ruler.after('block', 'directive_kind', setDirectiveKind(directives));
    md.core.ruler.after('directive_kind', 'parse_directive_opts', options_1.default(directives));
    md.core.ruler.after('parse_directive_opts', 'parse_directive_args', parseArguments(directives));
    md.core.ruler.after('parse_directive_args', 'numbering', numbering(directives));
    renderer.rules[types_1.DirectiveTokens.fence] = fenceRenderer(directives);
};
exports.directivesPlugin = directivesPlugin;
//# sourceMappingURL=index.js.map