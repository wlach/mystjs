import { MarkdownParseState } from './fromMarkdown';
import { AdmonitionKind } from './types';
import { visit } from 'unist-util-visit';
import { remove } from 'unist-util-remove';
import { u } from 'unist-builder';
import he from 'he';
import { admonitionKindToTitle, normalizeLabel, setTextAsChild, withoutTrailingNewline, } from './utils';
import { map } from 'unist-util-map';
import { findAfter } from 'unist-util-find-after';
import { selectAll } from 'unist-util-select';
const NUMBERED_CLASS = /^numbered$/;
const ALIGN_CLASS = /(?:(?:align-)|^)(left|right|center)/;
function getClassName(token, exclude) {
    var _a, _b, _c;
    const allClasses = new Set([
        // Grab the trimmed classes from the token
        ...((_a = token.attrGet('class')) !== null && _a !== void 0 ? _a : '')
            .split(' ')
            .map((c) => c.trim())
            .filter((c) => c),
        // Add any from the meta information (these are often repeated)
        ...((_c = (_b = token.meta) === null || _b === void 0 ? void 0 : _b.class) !== null && _c !== void 0 ? _c : []),
    ]);
    const className = [...allClasses].join(' ');
    if (!className)
        return undefined;
    return (className
        .split(' ')
        .map((c) => c.trim())
        .filter((c) => {
        if (!c)
            return false;
        if (!exclude)
            return true;
        return !exclude.reduce((doExclude, test) => doExclude || !!c.match(test), false);
    })
        .join(' ') || undefined);
}
function hasClassName(token, matcher) {
    const className = getClassName(token);
    if (!className)
        return false;
    const matches = className
        .split(' ')
        .map((c) => c.match(matcher))
        .filter((c) => c);
    if (matches.length === 0)
        return false;
    return matches[0];
}
function getLang(t) {
    return he.decode(t.info).trim().split(' ')[0].replace('\\', '');
}
function getColAlign(t) {
    var _a;
    if ((_a = t.attrs) === null || _a === void 0 ? void 0 : _a.length) {
        for (const attrPair of t.attrs) {
            if (attrPair[0] === 'style') {
                const match = attrPair[1].match(/text-align:(left|right|center)/);
                if (match) {
                    return match[1];
                }
            }
        }
    }
}
const defaultMdast = {
    heading: {
        type: 'heading',
        getAttrs(token) {
            return { depth: Number(token.tag[1]) };
        },
    },
    hr: {
        type: 'thematicBreak',
        noCloseToken: true,
        isLeaf: true,
    },
    paragraph: {
        type: 'paragraph',
    },
    blockquote: {
        type: 'blockquote',
    },
    ordered_list: {
        type: 'list',
        getAttrs(token, tokens, index) {
            var _a, _b;
            const info = (_a = tokens[index + 1]) === null || _a === void 0 ? void 0 : _a.info;
            const start = Number((_b = tokens[index + 1]) === null || _b === void 0 ? void 0 : _b.info);
            return {
                ordered: true,
                start: isNaN(start) || !info ? 1 : start,
                spread: false,
            };
        },
    },
    bullet_list: {
        type: 'list',
        attrs: {
            ordered: false,
            spread: false,
        },
    },
    list_item: {
        type: 'listItem',
        attrs: {
            spread: true,
        },
    },
    em: {
        type: 'emphasis',
    },
    strong: {
        type: 'strong',
    },
    fence: {
        type: 'code',
        isLeaf: true,
        getAttrs(t) {
            var _a, _b, _c, _d, _e, _f, _g, _h, _j;
            const name = ((_a = t.meta) === null || _a === void 0 ? void 0 : _a.name) || undefined;
            const showLineNumbers = !!(((_b = t.meta) === null || _b === void 0 ? void 0 : _b.linenos) ||
                ((_c = t.meta) === null || _c === void 0 ? void 0 : _c.linenos) === null || // Weird docutils implementation
                ((_d = t.meta) === null || _d === void 0 ? void 0 : _d['number-lines']));
            const lineno = (_f = (_e = t.meta) === null || _e === void 0 ? void 0 : _e['lineno-start']) !== null && _f !== void 0 ? _f : (_g = t.meta) === null || _g === void 0 ? void 0 : _g['number-lines'];
            const startingLineNumber = lineno && lineno !== 1 && !isNaN(Number(lineno)) ? Number(lineno) : undefined;
            const emphasizeLines = ((_h = t.meta) === null || _h === void 0 ? void 0 : _h['emphasize-lines'])
                ? (_j = t.meta) === null || _j === void 0 ? void 0 : _j['emphasize-lines'].split(',').map((n) => Number(n.trim())).filter((n) => !isNaN(n) && n > 0)
                : undefined;
            return Object.assign(Object.assign({ lang: getLang(t) }, normalizeLabel(name)), { class: getClassName(t), showLineNumbers: showLineNumbers || undefined, startingLineNumber: showLineNumbers ? startingLineNumber : undefined, // Only if showing line numbers!
                emphasizeLines, value: withoutTrailingNewline(t.content) });
        },
    },
    code_block: {
        type: 'code',
        isLeaf: true,
        getAttrs(t) {
            return { lang: getLang(t), value: withoutTrailingNewline(t.content) };
        },
    },
    code_inline: {
        type: 'inlineCode',
        noCloseToken: true,
        isText: true,
    },
    hardbreak: {
        type: 'break',
        noCloseToken: true,
        isLeaf: true,
    },
    link: {
        type: 'link',
        getAttrs(token) {
            var _a;
            return {
                url: token.attrGet('href'),
                title: (_a = token.attrGet('title')) !== null && _a !== void 0 ? _a : undefined,
            };
        },
    },
    image: {
        type: 'image',
        noCloseToken: true,
        isLeaf: true,
        getAttrs(token) {
            var _a;
            const alt = token.attrGet('alt') || ((_a = token.children) === null || _a === void 0 ? void 0 : _a.reduce((i, t) => i + (t === null || t === void 0 ? void 0 : t.content), ''));
            const alignMatch = hasClassName(token, ALIGN_CLASS);
            const align = alignMatch ? alignMatch[1] : undefined;
            return {
                url: token.attrGet('src'),
                alt: alt || undefined,
                title: token.attrGet('title') || undefined,
                class: getClassName(token, [ALIGN_CLASS]),
                width: token.attrGet('width') || undefined,
                align,
            };
        },
    },
    abbr: {
        type: 'abbreviation',
        getAttrs(token) {
            var _a, _b, _c;
            const value = (_b = (_a = token.children) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.content;
            return {
                title: (_c = token.attrGet('title')) !== null && _c !== void 0 ? _c : undefined,
                value,
            };
        },
    },
    sub: {
        type: 'subscript',
    },
    sup: {
        type: 'superscript',
    },
    dl: {
        type: 'definitionList',
    },
    dt: {
        type: 'definitionTerm',
    },
    dd: {
        type: 'definitionDescription',
    },
    admonition: {
        type: 'admonition',
        getAttrs(token) {
            var _a;
            const kind = ((_a = token.meta) === null || _a === void 0 ? void 0 : _a.kind) || undefined;
            return {
                kind,
                class: getClassName(token, [new RegExp(`admonition|${kind}`)]),
            };
        },
    },
    admonition_title: {
        type: 'admonitionTitle',
    },
    figure: {
        type: 'container',
        getAttrs(token) {
            var _a;
            const name = ((_a = token.meta) === null || _a === void 0 ? void 0 : _a.name) || undefined;
            return Object.assign(Object.assign({ kind: 'figure' }, normalizeLabel(name)), { numbered: name ? true : undefined, class: getClassName(token, [NUMBERED_CLASS]) });
        },
    },
    figure_caption: {
        type: 'caption',
    },
    table: {
        type: 'table',
        getAttrs(token) {
            var _a, _b;
            const name = ((_a = token.meta) === null || _a === void 0 ? void 0 : _a.name) || undefined;
            return Object.assign(Object.assign({ kind: undefined }, normalizeLabel(name)), { numbered: name ? true : undefined, class: getClassName(token, [NUMBERED_CLASS, ALIGN_CLASS]), align: ((_b = token.meta) === null || _b === void 0 ? void 0 : _b.align) || undefined });
        },
    },
    table_caption: {
        type: 'caption',
    },
    thead: {
        type: '_lift',
    },
    tbody: {
        type: '_lift',
    },
    tr: {
        type: 'tableRow',
    },
    th: {
        type: 'tableCell',
        getAttrs(t) {
            return { header: true, align: getColAlign(t) || undefined };
        },
    },
    td: {
        type: 'tableCell',
        getAttrs(t) {
            return { align: getColAlign(t) || undefined };
        },
    },
    math_inline: {
        type: 'inlineMath',
        noCloseToken: true,
        isText: true,
    },
    math_inline_double: {
        type: 'math',
        noCloseToken: true,
        isText: true,
    },
    math_block: {
        type: 'math',
        noCloseToken: true,
        isText: true,
        getAttrs(t) {
            const name = t.info || undefined;
            return Object.assign({}, normalizeLabel(name));
        },
    },
    math_block_label: {
        type: 'math',
        noCloseToken: true,
        isText: true,
        getAttrs(t) {
            const name = t.info || undefined;
            return Object.assign({}, normalizeLabel(name));
        },
    },
    amsmath: {
        type: 'math',
        noCloseToken: true,
        isText: true,
    },
    ref: {
        type: 'contentReference',
        isLeaf: true,
        getAttrs(t) {
            var _a, _b, _c;
            return Object.assign(Object.assign({ kind: (_a = t.meta) === null || _a === void 0 ? void 0 : _a.kind }, normalizeLabel((_b = t.meta) === null || _b === void 0 ? void 0 : _b.label)), { value: ((_c = t.meta) === null || _c === void 0 ? void 0 : _c.value) || undefined });
        },
    },
    footnote_ref: {
        type: 'footnoteReference',
        noCloseToken: true,
        isLeaf: true,
        getAttrs(t) {
            var _a;
            return Object.assign({}, normalizeLabel((_a = t === null || t === void 0 ? void 0 : t.meta) === null || _a === void 0 ? void 0 : _a.label));
        },
    },
    footnote_anchor: {
        type: '_remove',
        noCloseToken: true,
    },
    footnote_block: {
        // The footnote block is a view concern, not AST
        // Lift footnotes out of the tree
        type: '_lift',
    },
    footnote: {
        type: 'footnoteDefinition',
        getAttrs(t) {
            var _a;
            return Object.assign({}, normalizeLabel((_a = t === null || t === void 0 ? void 0 : t.meta) === null || _a === void 0 ? void 0 : _a.label));
        },
    },
    directive: {
        type: 'directive',
        noCloseToken: true,
        isLeaf: true,
        getAttrs(t) {
            var _a;
            return {
                kind: t.info,
                args: ((_a = t === null || t === void 0 ? void 0 : t.meta) === null || _a === void 0 ? void 0 : _a.arg) || undefined,
                value: t.content.trim(),
            };
        },
    },
    directive_error: {
        type: 'directiveError',
        noCloseToken: true,
    },
    role: {
        type: 'role',
        noCloseToken: true,
        isLeaf: true,
        getAttrs(t) {
            var _a;
            return {
                kind: (_a = t.meta) === null || _a === void 0 ? void 0 : _a.name,
                value: t.content,
            };
        },
    },
    role_error: {
        type: 'roleError',
        noCloseToken: true,
        isLeaf: true,
        getAttrs(t) {
            return {
                value: t.content,
            };
        },
    },
    myst_target: {
        type: '_headerTarget',
        noCloseToken: true,
        isLeaf: true,
        getAttrs(t) {
            return Object.assign({}, normalizeLabel(t.content));
        },
    },
    html_inline: {
        type: 'html',
        noCloseToken: true,
        isText: true,
    },
    html_block: {
        type: 'html',
        noCloseToken: true,
        isText: true,
    },
    myst_block_break: {
        type: 'block',
        noCloseToken: true,
        isLeaf: true,
        getAttrs(t) {
            return {
                meta: t.content || undefined,
            };
        },
    },
    myst_line_comment: {
        type: 'comment',
        noCloseToken: true,
        isLeaf: true,
        getAttrs(t) {
            return {
                value: t.content.trim() || undefined,
            };
        },
    },
};
function hoistSingleImagesOutofParagraphs(tree) {
    // Hoist up all paragraphs with a single image
    visit(tree, 'paragraph', (node) => {
        var _a, _b;
        if (!(((_a = node.children) === null || _a === void 0 ? void 0 : _a.length) === 1 && ((_b = node.children) === null || _b === void 0 ? void 0 : _b[0].type) === 'image'))
            return;
        const child = node.children[0];
        Object.keys(node).forEach((k) => {
            delete node[k];
        });
        Object.assign(node, child);
    });
}
const defaultOptions = {
    handlers: defaultMdast,
    hoistSingleImagesOutofParagraphs: true,
    nestBlocks: true,
};
export function tokensToMyst(tokens, options = defaultOptions) {
    var _a;
    const opts = Object.assign(Object.assign(Object.assign({}, defaultOptions), options), { handlers: Object.assign(Object.assign({}, defaultOptions.handlers), options === null || options === void 0 ? void 0 : options.handlers) });
    const state = new MarkdownParseState(opts.handlers);
    state.parseTokens(tokens);
    let tree;
    do {
        tree = state.closeNode();
    } while (state.stack.length);
    // Remove all redundant nodes marked for removal
    remove(tree, '_remove');
    // Lift up all nodes that are named "lift"
    tree = map(tree, (node) => {
        var _a, _b;
        const children = (_b = (_a = node.children) === null || _a === void 0 ? void 0 : _a.map((child) => {
            if (child.type === '_lift' && child.children)
                return child.children;
            return child;
        })) === null || _b === void 0 ? void 0 : _b.flat();
        node.children = children;
        return node;
    });
    // Remove unnecessary admonition titles from AST
    // These are up to the serializer to put in
    visit(tree, 'admonition', (node) => {
        var _a, _b;
        const { kind, children } = node;
        if (!kind || !children || kind === AdmonitionKind.admonition)
            return;
        const expectedTitle = admonitionKindToTitle(kind);
        const titleNode = children[0];
        if (titleNode.type === 'admonitionTitle' &&
            ((_b = (_a = titleNode.children) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.value) === expectedTitle)
            node.children = children.slice(1);
    });
    // Move contentReference text value to children
    visit(tree, 'contentReference', (node) => {
        delete node.children;
        if (node.value) {
            setTextAsChild(node, node.value);
            delete node.value;
        }
    });
    // Add target values as identifiers to subsequent node
    visit(tree, '_headerTarget', (node) => {
        const nextNode = findAfter(tree, node);
        if (nextNode) {
            nextNode.identifier = node.identifier;
            nextNode.label = node.label;
        }
    });
    remove(tree, '_headerTarget');
    // Nest block content inside of a block
    if (opts.nestBlocks) {
        const newTree = u('root', []);
        let lastBlock;
        const pushBlock = () => {
            var _a;
            if (!lastBlock)
                return;
            if (((_a = lastBlock.children) === null || _a === void 0 ? void 0 : _a.length) === 0) {
                delete lastBlock.children;
            }
            newTree.children.push(lastBlock);
        };
        (_a = tree.children) === null || _a === void 0 ? void 0 : _a.map((node) => {
            var _a, _b;
            if (node.type === 'block') {
                pushBlock();
                lastBlock = node;
                node.children = (_a = node.children) !== null && _a !== void 0 ? _a : [];
                return;
            }
            const stack = lastBlock ? lastBlock : newTree;
            (_b = stack.children) === null || _b === void 0 ? void 0 : _b.push(node);
        });
        pushBlock();
        tree = newTree;
    }
    // Ensure caption content is nested in a paragraph
    visit(tree, 'caption', (node) => {
        if (node.children && node.children[0].type !== 'paragraph') {
            node.children = [{ type: 'paragraph', children: node.children }];
        }
    });
    // Replace "table node with caption" with "figure node with table and caption"
    // TODO: Clean up when we update to typescript > 4.6.2 and we have access to
    //       parent in visitor function.
    //       i.e. visit(tree, 'table', (node, index parent) => {...})
    //       https://github.com/microsoft/TypeScript/issues/46900
    selectAll('table', tree).map((node) => {
        var _a, _b;
        const captionChildren = (_a = node.children) === null || _a === void 0 ? void 0 : _a.filter((n) => n.type === 'caption');
        if (captionChildren === null || captionChildren === void 0 ? void 0 : captionChildren.length) {
            const tableChildren = (_b = node.children) === null || _b === void 0 ? void 0 : _b.filter((n) => n.type !== 'caption');
            const newTableNode = {
                type: 'table',
                align: node.align,
                children: tableChildren,
            };
            node.type = 'container';
            node.kind = 'table';
            node.children = [...captionChildren, newTableNode];
            delete node.align;
        }
    });
    if (opts.hoistSingleImagesOutofParagraphs)
        hoistSingleImagesOutofParagraphs(tree);
    return tree;
}
//# sourceMappingURL=tokensToMyst.js.map