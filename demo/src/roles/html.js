"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../utils");
const ABBR_PATTERN = /^(.+?)\(([^()]+)\)$/; // e.g. 'CSS (Cascading Style Sheets)'
const roles = {
    abbr: {
        token: 'abbr',
        getAttrs(content) {
            const match = ABBR_PATTERN.exec(content);
            if (match == null)
                return { attrs: { title: null }, content };
            const [, modified, title] = match;
            return { attrs: { title: title.trim() }, content: modified.trim() };
        },
        renderer: (tokens, idx) => {
            const token = tokens[idx];
            const [html] = utils_1.toHTML(['abbr', { title: token.attrGet('title'), children: token.content }], { inline: true });
            return html;
        },
    },
    sub: {
        token: 'sub',
        renderer: (tokens, idx) => {
            const [html] = utils_1.toHTML(['sub', { children: tokens[idx].content }], { inline: true });
            return html;
        },
    },
    sup: {
        token: 'sup',
        renderer: (tokens, idx) => {
            const [html] = utils_1.toHTML(['sup', { children: tokens[idx].content }], { inline: true });
            return html;
        },
    },
};
exports.default = roles;
//# sourceMappingURL=html.js.map