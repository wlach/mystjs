"use strict";
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.toHTML = exports.formatTag = void 0;
const utils_1 = require("markdown-it/lib/common/utils");
const HTML_EMPTY_ELEMENTS = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'keygen', 'link', 'meta', 'param', 'source', 'track', 'wbr']);
const formatAttr = (key, value) => {
    let v;
    if (value == null)
        return null;
    if (Array.isArray(value)) {
        v = value.join(' ');
    }
    else if (typeof value === 'number') {
        v = String(value);
    }
    else if (typeof value === 'boolean') {
        if (!value)
            return null;
        v = '';
    }
    else {
        v = value;
    }
    return `${key}="${utils_1.escapeHtml(v)}"`;
};
function formatTag(tag, attributes, inline) {
    const { children } = attributes, rest = __rest(attributes, ["children"]);
    const join = inline ? '' : '\n';
    const attrs = Object.entries(rest)
        .filter(([, value]) => value != null && value !== false)
        .map(([key, value]) => formatAttr(key, value))
        .filter((value) => value != null)
        .join(' ');
    const html = `<${utils_1.escapeHtml(tag)}${attrs ? ` ${attrs}` : ''}>`;
    if (children)
        return `${html}${join}${utils_1.escapeHtml(String(children))}`;
    return html;
}
exports.formatTag = formatTag;
function toHTMLRecurse(template, inline) {
    // Convert to an internal type which is actually an array
    const T = template;
    // Cannot have more than one hole in the template
    const atMostOneHole = T.flat(Infinity).filter((v) => v === 0).length <= 1;
    if (!atMostOneHole)
        throw new Error('There cannot be more than one hole in the template.');
    // Grab the tag and attributes if they exist!
    const tag = T[0];
    const hasAttrs = !Array.isArray(T === null || T === void 0 ? void 0 : T[1]) && typeof (T === null || T === void 0 ? void 0 : T[1]) === 'object';
    const attrs = hasAttrs ? T[1] : {};
    // These are the tag arrays before and after the hole.
    const before = [];
    const after = [];
    before.push(formatTag(tag, attrs, inline));
    let foundHole = false;
    T.slice(hasAttrs ? 2 : 1).forEach((value) => {
        const v = value;
        if (v === 0) {
            foundHole = true;
            return;
        }
        // Recurse, if a hole is found then split the return
        const [b, a] = toHTMLRecurse(v, inline);
        before.push(b);
        if (a) {
            foundHole = true;
            after.push(a);
        }
    });
    const join = inline ? '' : '\n';
    const closingTag = HTML_EMPTY_ELEMENTS.has(tag) ? '' : `</${tag}>`;
    if (!foundHole) {
        if (closingTag)
            before.push(closingTag);
        return [before.join(join), null];
    }
    if (closingTag)
        after.push(closingTag);
    return [before.join(join), after.join(join)];
}
/**
 * A helper function to create valid HTML with a "hole" (represented by zero) for content.
 *
 * The content is escaped and null/undefined attributes are not included.
 *
 * **A simple wrapper tag:**
 * ```
 * const attr = 'hello';
 * const html = toHTML(['tag', {attr}, 0]);
 * console.log(html);
 * > ['<tag attr="hello">', '</tag>']
 * ```
 *
 * **A nested wrapper tag:**
 * ```
 * const html = toHTML([
 *  'tag', {attr},
 *  ['img', {src}],
 *  ['caption', 0],
 * ]);
 * console.log(html);
 * > ['<tag attr="x"><img src="src"><caption>', '</caption></tag>']
 * ```
 *
 * You can include `children` in the `attrs` and that adds inline content for a tag.
 *
 * You can also send in a list of strings for `attrs`, which are joined with a space (`' '`).
 *
 * Types are based on prosemirror-model.
 *
 * @param spec The spec for the dom model.
 * @param opts Options dict, `inline` creates HTML that is on a single line.
 */
function toHTML(template, opts = { inline: false }) {
    const [before, after] = toHTMLRecurse(template, opts.inline);
    const join = opts.inline ? '' : '\n';
    return [`${before}${join}`, after ? `${after}${join}` : null];
}
exports.toHTML = toHTML;
//# sourceMappingURL=utils.js.map