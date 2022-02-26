"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mystToHast = void 0;
const mdast_util_to_hast_1 = require("mdast-util-to-hast");
const unist_builder_1 = require("unist-builder");
const classnames_1 = __importDefault(require("classnames"));
const types_1 = require("./types");
const abbreviation = (h, node) => h(node, 'abbr', { title: node.title }, (0, mdast_util_to_hast_1.all)(h, node));
const subscript = (h, node) => h(node, 'sub', (0, mdast_util_to_hast_1.all)(h, node));
const superscript = (h, node) => h(node, 'sup', (0, mdast_util_to_hast_1.all)(h, node));
const image = (h, node) => h(node, 'img', {
    src: node.url,
    alt: node.alt,
    title: node.title,
    class: (0, classnames_1.default)(node.align ? `align-${node.align}` : '', node.class) || undefined,
    width: node.width,
});
const caption = (h, node) => h(node, 'figcaption', (0, mdast_util_to_hast_1.all)(h, node));
const container = (h, node) => h(node, 'figure', {
    id: node.identifier || node.label || undefined,
    class: (0, classnames_1.default)({ numbered: node.numbered }, node.class) || undefined,
}, (0, mdast_util_to_hast_1.all)(h, node));
const admonitionTitle = (h, node) => h(node, 'p', { class: 'admonition-title' }, (0, mdast_util_to_hast_1.all)(h, node));
const admonition = (h, node) => h(node, 'aside', {
    class: (0, classnames_1.default)({
        [node.class]: node.class,
        admonition: true,
        [node.kind]: node.kind && node.kind !== types_1.AdmonitionKind.admonition,
    }),
}, (0, mdast_util_to_hast_1.all)(h, node));
const captionNumber = (h, node) => {
    var _a, _b;
    const captionKind = ((_a = node.kind) === null || _a === void 0 ? void 0 : _a.charAt(0).toUpperCase()) + ((_b = node.kind) === null || _b === void 0 ? void 0 : _b.slice(1));
    return h(node, 'span', { class: 'caption-number' }, [
        (0, unist_builder_1.u)('text', `${captionKind} ${node.value}`),
    ]);
};
const math = (h, node) => {
    const attrs = { id: node.identifier || undefined, class: 'math block' };
    if (node.value.indexOf('\n') !== -1) {
        const math = h(node, 'div', attrs, [(0, unist_builder_1.u)('text', node.value)]);
        return h(node, 'pre', [math]);
    }
    return h(node, 'div', attrs, [(0, unist_builder_1.u)('text', node.value.replace(/\r?\n|\r/g, ' '))]);
};
const inlineMath = (h, node) => {
    return h(node, 'span', { class: 'math inline' }, [
        (0, unist_builder_1.u)('text', node.value.replace(/\r?\n|\r/g, ' ')),
    ]);
};
const definitionList = (h, node) => h(node, 'dl', (0, mdast_util_to_hast_1.all)(h, node));
const definitionTerm = (h, node) => h(node, 'dt', (0, mdast_util_to_hast_1.all)(h, node));
const definitionDescription = (h, node) => h(node, 'dd', (0, mdast_util_to_hast_1.all)(h, node));
const role = (h, node) => {
    return h(node, 'span', { class: 'role unhandled' }, [
        h(node, 'code', { class: 'kind' }, [(0, unist_builder_1.u)('text', `{${node.kind}}`)]),
        h(node, 'code', {}, [(0, unist_builder_1.u)('text', node.value)]),
    ]);
};
const directive = (h, node) => {
    let directiveElements = [
        h(node, 'code', { class: 'kind' }, [(0, unist_builder_1.u)('text', `{${node.kind}}`)]),
    ];
    if (node.args) {
        directiveElements = directiveElements.concat([
            (0, unist_builder_1.u)('text', ' '),
            h(node, 'code', { class: 'args' }, [(0, unist_builder_1.u)('text', node.args)]),
        ]);
    }
    return h(node, 'div', { class: 'directive unhandled' }, [
        h(node, 'p', {}, directiveElements),
        h(node, 'pre', [h(node, 'code', [(0, unist_builder_1.u)('text', node.value)])]),
    ]);
};
const block = (h, node) => h(node, 'div', { class: 'block', 'data-block': node.meta }, (0, mdast_util_to_hast_1.all)(h, node));
const comment = (h, node) => (0, unist_builder_1.u)('comment', node.value);
const heading = (h, node) => h(node, `h${node.depth}`, { id: node.identifier || undefined }, (0, mdast_util_to_hast_1.all)(h, node));
const contentReference = (h, node) => {
    if (node.resolved) {
        return h(node, 'a', { href: `#${node.identifier}`, title: node.title || undefined }, (0, mdast_util_to_hast_1.all)(h, node));
    }
    else {
        return h(node, 'span', { class: 'reference role unhandled' }, [
            h(node, 'code', { class: 'kind' }, [(0, unist_builder_1.u)('text', `{${node.kind}}`)]),
            h(node, 'code', {}, [(0, unist_builder_1.u)('text', node.identifier)]),
        ]);
    }
};
// TODO: The defaultHandler treats the first row (and only the first row)
//       header; the mdast `tableCell.header` property is not respected.
//       For that, we need to entirely rewrite this handler.
const table = (h, node) => {
    node.data = { hProperties: { align: node.align } };
    delete node.align;
    return mdast_util_to_hast_1.defaultHandlers.table(h, node);
};
const code = (h, node) => {
    const value = node.value ? node.value + '\n' : '';
    const props = {};
    if (node.identifier) {
        props.id = node.identifier;
    }
    props.className =
        (0, classnames_1.default)({ ['language-' + node.lang]: node.lang }, node.class) || undefined;
    const code = h(node, 'code', props, [(0, unist_builder_1.u)('text', value)]);
    return h(node.position, 'pre', [code]);
};
const mystToHast = (opts) => (tree) => {
    return (0, mdast_util_to_hast_1.toHast)(tree, Object.assign(Object.assign({}, opts), { handlers: Object.assign({ admonition,
            admonitionTitle,
            container,
            image,
            caption,
            captionNumber,
            abbreviation,
            subscript,
            superscript,
            math,
            inlineMath,
            definitionList,
            definitionTerm,
            definitionDescription,
            role,
            directive,
            block,
            comment,
            heading,
            contentReference,
            code,
            table }, opts === null || opts === void 0 ? void 0 : opts.handlers) }));
};
exports.mystToHast = mystToHast;
//# sourceMappingURL=mystToHast.js.map