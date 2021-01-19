"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const state_1 = require("../state");
const utils_1 = require("../utils");
const REF_PATTERN = /^(.+?)<([^<>]+)>$/; // e.g. 'Labeled Reference <ref>'
const renderReferenceError = (ref) => {
    const [html] = utils_1.toHTML([
        'span', {
            class: 'error',
            title: `The reference '${ref}' was not found.`,
            children: `Reference '${ref}' not found.`,
        },
    ], { inline: true });
    return html;
};
/**
 * Renders a reference as an anchor link.
 */
const renderReference = (opts) => (tokens, idx, options, env) => {
    var _a;
    const token = tokens[idx];
    const ref = (_a = token.attrGet('ref')) !== null && _a !== void 0 ? _a : '';
    const target = env.targets[ref];
    if (!target || (opts.kind && (target === null || target === void 0 ? void 0 : target.kind) !== opts.kind))
        return renderReferenceError(ref);
    const { id, title, defaultReference, number, } = target;
    let text = token.content || title || defaultReference;
    if (opts.numbered) {
        // See https://www.sphinx-doc.org/en/master/usage/restructuredtext/roles.html#role-numref
        text = text.replace(/%s/g, String(number)).replace(/\{number\}/g, String(number));
    }
    if (opts.brackets) {
        text = `${token.content}(${number})`;
    }
    const [html] = utils_1.toHTML([
        'a', {
            href: `#${id}`,
            title: title || defaultReference,
            children: text,
        },
    ], { inline: true });
    return html;
};
const getReferenceAttrs = (content) => {
    const match = REF_PATTERN.exec(content);
    if (match == null)
        return { attrs: { ref: content }, content: '' };
    const [, modified, ref] = match;
    return { attrs: { ref: ref.trim() }, content: modified.trim() };
};
const roles = {
    ref: {
        token: 'ref',
        getAttrs: getReferenceAttrs,
        renderer: renderReference({ numbered: false, brackets: false }),
    },
    numref: {
        token: 'numref',
        getAttrs: getReferenceAttrs,
        renderer: renderReference({ numbered: true, brackets: false }),
    },
    eq: {
        token: 'eq',
        getAttrs: getReferenceAttrs,
        renderer: renderReference({ numbered: true, brackets: true, kind: state_1.TargetKind.equation }),
    },
};
exports.default = roles;
//# sourceMappingURL=references.js.map