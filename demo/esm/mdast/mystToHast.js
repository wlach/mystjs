import { defaultHandlers, toHast, all } from 'mdast-util-to-hast';
import { u } from 'unist-builder';
import classNames from 'classnames';
import { AdmonitionKind } from './types';
const abbreviation = (h, node) => h(node, 'abbr', { title: node.title }, all(h, node));
const subscript = (h, node) => h(node, 'sub', all(h, node));
const superscript = (h, node) => h(node, 'sup', all(h, node));
const image = (h, node) => h(node, 'img', {
    src: node.url,
    alt: node.alt,
    title: node.title,
    class: classNames(node.align ? `align-${node.align}` : '', node.class) || undefined,
    width: node.width,
});
const caption = (h, node) => h(node, 'figcaption', all(h, node));
const container = (h, node) => h(node, 'figure', {
    id: node.identifier || node.label || undefined,
    class: classNames({ numbered: node.numbered }, node.class) || undefined,
}, all(h, node));
const admonitionTitle = (h, node) => h(node, 'p', { class: 'admonition-title' }, all(h, node));
const admonition = (h, node) => h(node, 'aside', {
    class: classNames({
        [node.class]: node.class,
        admonition: true,
        [node.kind]: node.kind && node.kind !== AdmonitionKind.admonition,
    }),
}, all(h, node));
const captionNumber = (h, node) => {
    var _a, _b;
    const captionKind = ((_a = node.kind) === null || _a === void 0 ? void 0 : _a.charAt(0).toUpperCase()) + ((_b = node.kind) === null || _b === void 0 ? void 0 : _b.slice(1));
    return h(node, 'span', { class: 'caption-number' }, [
        u('text', `${captionKind} ${node.value}`),
    ]);
};
const math = (h, node) => {
    const attrs = { id: node.identifier || undefined, class: 'math block' };
    if (node.value.indexOf('\n') !== -1) {
        const math = h(node, 'div', attrs, [u('text', node.value)]);
        return h(node, 'pre', [math]);
    }
    return h(node, 'div', attrs, [u('text', node.value.replace(/\r?\n|\r/g, ' '))]);
};
const inlineMath = (h, node) => {
    return h(node, 'span', { class: 'math inline' }, [
        u('text', node.value.replace(/\r?\n|\r/g, ' ')),
    ]);
};
const definitionList = (h, node) => h(node, 'dl', all(h, node));
const definitionTerm = (h, node) => h(node, 'dt', all(h, node));
const definitionDescription = (h, node) => h(node, 'dd', all(h, node));
const role = (h, node) => {
    return h(node, 'span', { class: 'role unhandled' }, [
        h(node, 'code', { class: 'kind' }, [u('text', `{${node.kind}}`)]),
        h(node, 'code', {}, [u('text', node.value)]),
    ]);
};
const directive = (h, node) => {
    let directiveElements = [
        h(node, 'code', { class: 'kind' }, [u('text', `{${node.kind}}`)]),
    ];
    if (node.args) {
        directiveElements = directiveElements.concat([
            u('text', ' '),
            h(node, 'code', { class: 'args' }, [u('text', node.args)]),
        ]);
    }
    return h(node, 'div', { class: 'directive unhandled' }, [
        h(node, 'p', {}, directiveElements),
        h(node, 'pre', [h(node, 'code', [u('text', node.value)])]),
    ]);
};
const block = (h, node) => h(node, 'div', { class: 'block', 'data-block': node.meta }, all(h, node));
const comment = (h, node) => u('comment', node.value);
const heading = (h, node) => h(node, `h${node.depth}`, { id: node.identifier || undefined }, all(h, node));
const contentReference = (h, node) => {
    if (node.resolved) {
        return h(node, 'a', { href: `#${node.identifier}`, title: node.title || undefined }, all(h, node));
    }
    else {
        return h(node, 'span', { class: 'reference role unhandled' }, [
            h(node, 'code', { class: 'kind' }, [u('text', `{${node.kind}}`)]),
            h(node, 'code', {}, [u('text', node.identifier)]),
        ]);
    }
};
// TODO: The defaultHandler treats the first row (and only the first row)
//       header; the mdast `tableCell.header` property is not respected.
//       For that, we need to entirely rewrite this handler.
const table = (h, node) => {
    node.data = { hProperties: { align: node.align } };
    delete node.align;
    return defaultHandlers.table(h, node);
};
const code = (h, node) => {
    const value = node.value ? node.value + '\n' : '';
    const props = {};
    if (node.identifier) {
        props.id = node.identifier;
    }
    props.className =
        classNames({ ['language-' + node.lang]: node.lang }, node.class) || undefined;
    const code = h(node, 'code', props, [u('text', value)]);
    return h(node.position, 'pre', [code]);
};
export const mystToHast = (opts) => (tree) => {
    return toHast(tree, Object.assign(Object.assign({}, opts), { handlers: Object.assign({ admonition,
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
//# sourceMappingURL=mystToHast.js.map