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
const utils_1 = require("./utils");
const admonitionTitles = {
    attention: 'Attention', caution: 'Caution', danger: 'Danger', error: 'Error', important: 'Important', hint: 'Hint', note: 'Note', seealso: 'See Also', tip: 'Tip', warning: 'Warning',
};
const DEFAULT_ADMONITION_CLASS = 'note';
const createAdmonition = (kind) => {
    const className = kind === 'admonition' ? DEFAULT_ADMONITION_CLASS : kind;
    return {
        token: kind,
        getArguments: (info) => {
            const content = kind === 'admonition' ? '' : info;
            const title = kind === 'admonition' ? info : admonitionTitles[kind];
            const args = { title };
            return { args, content };
        },
        getOptions: (data) => {
            const { class: overrideClass } = data, rest = __rest(data, ["class"]);
            utils_1.unusedOptionsWarning(kind, rest);
            return { class: overrideClass };
        },
        renderer: (args, opts) => {
            const { title } = args;
            const { class: overrideClass } = opts;
            return [
                'aside', { class: ['callout', overrideClass || className] },
                ['header', { children: title }],
                0,
            ];
        },
    };
};
const admonitions = {
    admonition: createAdmonition('admonition'),
    callout: createAdmonition('admonition'),
    // All other admonitions
    attention: createAdmonition('attention'),
    caution: createAdmonition('caution'),
    danger: createAdmonition('danger'),
    error: createAdmonition('error'),
    important: createAdmonition('important'),
    hint: createAdmonition('hint'),
    note: createAdmonition('note'),
    seealso: createAdmonition('seealso'),
    tip: createAdmonition('tip'),
    warning: createAdmonition('warning'),
};
exports.default = admonitions;
//# sourceMappingURL=admonition.js.map