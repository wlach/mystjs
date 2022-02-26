"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setTextAsChild = exports.normalizeLabel = exports.withoutTrailingNewline = exports.admonitionKindToTitle = void 0;
function admonitionKindToTitle(kind) {
    const transform = {
        attention: 'Attention',
        caution: 'Caution',
        danger: 'Danger',
        error: 'Error',
        important: 'Important',
        hint: 'Hint',
        note: 'Note',
        seealso: 'See Also',
        tip: 'Tip',
        warning: 'Warning',
    };
    return transform[kind] || `Unknown Admonition "${kind}"`;
}
exports.admonitionKindToTitle = admonitionKindToTitle;
function withoutTrailingNewline(str) {
    return str[str.length - 1] == '\n' ? str.slice(0, str.length - 1) : str;
}
exports.withoutTrailingNewline = withoutTrailingNewline;
/**
 * https://github.com/syntax-tree/mdast#association
 * @param label A label field can be present.
 *        label is a string value: it works just like title on a link or a
 *        lang on code: character escapes and character references are parsed.
 * @returns { identifier, label }
 */
function normalizeLabel(label) {
    if (!label)
        return undefined;
    const identifier = label
        .replace(/[\t\n\r ]+/g, ' ')
        .trim()
        .toLowerCase();
    return { identifier, label };
}
exports.normalizeLabel = normalizeLabel;
function setTextAsChild(node, text) {
    node.children = [{ type: 'text', value: text }];
}
exports.setTextAsChild = setTextAsChild;
//# sourceMappingURL=utils.js.map