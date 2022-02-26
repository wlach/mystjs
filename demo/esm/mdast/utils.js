export function admonitionKindToTitle(kind) {
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
export function withoutTrailingNewline(str) {
    return str[str.length - 1] == '\n' ? str.slice(0, str.length - 1) : str;
}
/**
 * https://github.com/syntax-tree/mdast#association
 * @param label A label field can be present.
 *        label is a string value: it works just like title on a link or a
 *        lang on code: character escapes and character references are parsed.
 * @returns { identifier, label }
 */
export function normalizeLabel(label) {
    if (!label)
        return undefined;
    const identifier = label
        .replace(/[\t\n\r ]+/g, ' ')
        .trim()
        .toLowerCase();
    return { identifier, label };
}
export function setTextAsChild(node, text) {
    node.children = [{ type: 'text', value: text }];
}
//# sourceMappingURL=utils.js.map