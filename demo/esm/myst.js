import MarkdownIt from 'markdown-it';
import { mathPlugin, convertFrontMatter, frontMatterPlugin, mystBlockPlugin, footnotePlugin, docutilsPlugin, deflistPlugin, tasklistPlugin, } from './plugins';
import { formatHtml, mystToHast, tokensToMyst, transform, State } from './mdast';
import { unified } from 'unified';
import rehypeStringify from 'rehype-stringify';
import { directivesDefault, rolesDefault } from 'markdown-it-docutils';
export { directivesDefault, Directive, directiveOptions, Role, rolesDefault, } from 'markdown-it-docutils';
export const defaultOptions = {
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
        roles: rolesDefault,
        directives: directivesDefault,
    },
    mdast: {},
    hast: {
        clobberPrefix: 'm-',
    },
    formatHtml: true,
    stringifyHtml: {},
};
export class MyST {
    constructor(opts = defaultOptions) {
        this.opts = this._parseOptions(opts);
        this.tokenizer = this._createTokenizer();
    }
    _parseOptions(user) {
        var _a, _b, _c, _d;
        const opts = {
            allowDangerousHtml: (_a = user.allowDangerousHtml) !== null && _a !== void 0 ? _a : defaultOptions.allowDangerousHtml,
            transform: Object.assign(Object.assign({}, defaultOptions.transform), user.transform),
            mdast: Object.assign(Object.assign({}, defaultOptions.mdast), user.mdast),
            hast: Object.assign(Object.assign({}, defaultOptions.hast), user.hast),
            docutils: Object.assign(Object.assign({}, defaultOptions.docutils), user.docutils),
            markdownit: Object.assign(Object.assign({}, defaultOptions.markdownit), user.markdownit),
            extensions: Object.assign(Object.assign({}, defaultOptions.extensions), user.extensions),
            formatHtml: (_b = user.formatHtml) !== null && _b !== void 0 ? _b : defaultOptions.formatHtml,
            stringifyHtml: Object.assign(Object.assign({}, defaultOptions.stringifyHtml), user.stringifyHtml),
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
        const tokenizer = MarkdownIt('commonmark', this.opts.markdownit);
        if (exts.tables)
            tokenizer.enable('table');
        if (exts.frontmatter)
            tokenizer.use(frontMatterPlugin, () => ({})).use(convertFrontMatter);
        if (exts.blocks)
            tokenizer.use(mystBlockPlugin);
        if (exts.footnotes)
            tokenizer.use(footnotePlugin).disable('footnote_inline'); // not yet implemented in myst-parser
        tokenizer.use(docutilsPlugin, this.opts.docutils);
        if (exts.math)
            tokenizer.use(mathPlugin, exts.math);
        if (exts.deflist)
            tokenizer.use(deflistPlugin);
        if (exts.tasklist)
            tokenizer.use(tasklistPlugin);
        return tokenizer;
    }
    parse(content) {
        return tokensToMyst(this.tokenizer.parse(content, {}), this.opts.mdast);
    }
    render(content) {
        const tree = this.parse(content);
        const html = this.renderMdast(tree);
        return html;
    }
    renderMdast(tree) {
        const state = new State();
        const pipe = unified()
            .use(transform, state, this.opts.transform)
            .use(mystToHast, this.opts.hast)
            .use(formatHtml, this.opts.formatHtml)
            .use(rehypeStringify, this.opts.stringifyHtml);
        const result = pipe.runSync(tree);
        const html = pipe.stringify(result);
        return html.trim();
    }
}
/**
 * MyST Parser as a Unified Plugin
 */
export const mystParser = function mystParser() {
    this.Parser = (content, opts) => {
        return new MyST(opts).parse(content);
    };
};
//# sourceMappingURL=myst.js.map