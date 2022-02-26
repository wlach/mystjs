"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mystParser = exports.MyST = exports.defaultOptions = exports.rolesDefault = exports.Role = exports.directiveOptions = exports.Directive = exports.directivesDefault = void 0;
const markdown_it_1 = __importDefault(require("markdown-it"));
const plugins_1 = require("./plugins");
const mdast_1 = require("./mdast");
const unified_1 = require("unified");
const rehype_stringify_1 = __importDefault(require("rehype-stringify"));
const markdown_it_docutils_1 = require("markdown-it-docutils");
var markdown_it_docutils_2 = require("markdown-it-docutils");
Object.defineProperty(exports, "directivesDefault", { enumerable: true, get: function () { return markdown_it_docutils_2.directivesDefault; } });
Object.defineProperty(exports, "Directive", { enumerable: true, get: function () { return markdown_it_docutils_2.Directive; } });
Object.defineProperty(exports, "directiveOptions", { enumerable: true, get: function () { return markdown_it_docutils_2.directiveOptions; } });
Object.defineProperty(exports, "Role", { enumerable: true, get: function () { return markdown_it_docutils_2.Role; } });
Object.defineProperty(exports, "rolesDefault", { enumerable: true, get: function () { return markdown_it_docutils_2.rolesDefault; } });
exports.defaultOptions = {
    allowDangerousHtml: false,
    markdownit: {},
    extensions: {
        frontmatter: true,
        math: true,
        footnotes: true,
        deflist: true,
        tasklist: true,
        tables: true,
        blocks: true,
    },
    transform: {},
    docutils: {
        roles: markdown_it_docutils_1.rolesDefault,
        directives: markdown_it_docutils_1.directivesDefault,
    },
    mdast: {},
    hast: {
        clobberPrefix: 'm-',
    },
    formatHtml: true,
    stringifyHtml: {},
};
class MyST {
    constructor(opts = exports.defaultOptions) {
        this.opts = this._parseOptions(opts);
        this.tokenizer = this._createTokenizer();
    }
    _parseOptions(user) {
        var _a, _b, _c, _d;
        const opts = {
            allowDangerousHtml: (_a = user.allowDangerousHtml) !== null && _a !== void 0 ? _a : exports.defaultOptions.allowDangerousHtml,
            transform: Object.assign(Object.assign({}, exports.defaultOptions.transform), user.transform),
            mdast: Object.assign(Object.assign({}, exports.defaultOptions.mdast), user.mdast),
            hast: Object.assign(Object.assign({}, exports.defaultOptions.hast), user.hast),
            docutils: Object.assign(Object.assign({}, exports.defaultOptions.docutils), user.docutils),
            markdownit: Object.assign(Object.assign({}, exports.defaultOptions.markdownit), user.markdownit),
            extensions: Object.assign(Object.assign({}, exports.defaultOptions.extensions), user.extensions),
            formatHtml: (_b = user.formatHtml) !== null && _b !== void 0 ? _b : exports.defaultOptions.formatHtml,
            stringifyHtml: Object.assign(Object.assign({}, exports.defaultOptions.stringifyHtml), user.stringifyHtml),
        };
        const rolesHandlers = {};
        const directivesHandlers = {};
        const mdastHandlers = {};
        const hastHandlers = {};
        Object.entries((_c = user.roles) !== null && _c !== void 0 ? _c : {}).map(([k, { myst, mdast, hast }]) => {
            rolesHandlers[k] = myst;
            mdastHandlers[k] = mdast;
            hastHandlers[mdast.type] = hast;
        });
        Object.entries((_d = user.directives) !== null && _d !== void 0 ? _d : {}).map(([k, { myst, mdast, hast }]) => {
            directivesHandlers[k] = myst;
            mdastHandlers[k] = mdast;
            hastHandlers[mdast.type] = hast;
        });
        opts.docutils.roles = Object.assign(Object.assign({}, opts.docutils.roles), rolesHandlers);
        opts.docutils.directives = Object.assign(Object.assign({}, opts.docutils.directives), directivesHandlers);
        opts.hast.handlers = Object.assign(Object.assign({}, opts.hast.handlers), hastHandlers);
        opts.mdast.handlers = Object.assign(Object.assign({}, opts.mdast.handlers), mdastHandlers);
        if (opts.allowDangerousHtml) {
            opts.markdownit.html = true;
            opts.hast.allowDangerousHtml = true;
            opts.hast.allowDangerousHtml = true;
            opts.stringifyHtml.allowDangerousHtml = true;
        }
        return opts;
    }
    _createTokenizer() {
        const exts = this.opts.extensions;
        const tokenizer = (0, markdown_it_1.default)('commonmark', this.opts.markdownit);
        if (exts.tables)
            tokenizer.enable('table');
        if (exts.frontmatter)
            tokenizer.use(plugins_1.frontMatterPlugin, () => ({})).use(plugins_1.convertFrontMatter);
        if (exts.blocks)
            tokenizer.use(plugins_1.mystBlockPlugin);
        if (exts.footnotes)
            tokenizer.use(plugins_1.footnotePlugin).disable('footnote_inline'); // not yet implemented in myst-parser
        tokenizer.use(plugins_1.docutilsPlugin, this.opts.docutils);
        if (exts.math)
            tokenizer.use(plugins_1.mathPlugin, exts.math);
        if (exts.deflist)
            tokenizer.use(plugins_1.deflistPlugin);
        if (exts.tasklist)
            tokenizer.use(plugins_1.tasklistPlugin);
        return tokenizer;
    }
    parse(content) {
        return (0, mdast_1.tokensToMyst)(this.tokenizer.parse(content, {}), this.opts.mdast);
    }
    render(content) {
        const tree = this.parse(content);
        const html = this.renderMdast(tree);
        return html;
    }
    renderMdast(tree) {
        const state = new mdast_1.State();
        const pipe = (0, unified_1.unified)()
            .use(mdast_1.transform, state, this.opts.transform)
            .use(mdast_1.mystToHast, this.opts.hast)
            .use(mdast_1.formatHtml, this.opts.formatHtml)
            .use(rehype_stringify_1.default, this.opts.stringifyHtml);
        const result = pipe.runSync(tree);
        const html = pipe.stringify(result);
        return html.trim();
    }
}
exports.MyST = MyST;
/**
 * MyST Parser as a Unified Plugin
 */
const mystParser = function mystParser() {
    this.Parser = (content, opts) => {
        return new MyST(opts).parse(content);
    };
};
exports.mystParser = mystParser;
//# sourceMappingURL=myst.js.map