"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transform = exports.addContainerCaptionNumbers = exports.addAdmonitionHeaders = void 0;
const unist_util_visit_1 = require("unist-util-visit");
const unist_util_select_1 = require("unist-util-select");
const types_1 = require("./types");
const utils_1 = require("./utils");
const state_1 = require("./state");
const defaultOptions = {
    addAdmonitionHeaders: true,
    addContainerCaptionNumbers: true,
};
// Visit all admonitions and add headers if necessary
function addAdmonitionHeaders(tree) {
    (0, unist_util_visit_1.visit)(tree, 'admonition', (node) => {
        var _a;
        if (!node.kind || node.kind === types_1.AdmonitionKind.admonition)
            return;
        node.children = [
            {
                type: 'admonitionTitle',
                children: [{ type: 'text', value: (0, utils_1.admonitionKindToTitle)(node.kind) }],
            },
            ...((_a = node.children) !== null && _a !== void 0 ? _a : []),
        ];
    });
}
exports.addAdmonitionHeaders = addAdmonitionHeaders;
// Visit all containers and add captions
function addContainerCaptionNumbers(tree, state) {
    (0, unist_util_select_1.selectAll)('container[numbered=true]', tree).forEach((container) => {
        var _a, _b;
        const number = (_a = state.getTarget(container.identifier)) === null || _a === void 0 ? void 0 : _a.number;
        const para = (0, unist_util_select_1.select)('caption > paragraph', container);
        if (number && para) {
            para.children = [
                { type: 'captionNumber', kind: container.kind, value: number },
                ...((_b = para === null || para === void 0 ? void 0 : para.children) !== null && _b !== void 0 ? _b : []),
            ];
        }
    });
}
exports.addContainerCaptionNumbers = addContainerCaptionNumbers;
const transform = (state, o) => (tree) => {
    const opts = Object.assign(Object.assign({}, defaultOptions), o);
    (0, state_1.countState)(state, tree);
    (0, state_1.referenceState)(state, tree);
    if (opts.addAdmonitionHeaders)
        addAdmonitionHeaders(tree);
    if (opts.addContainerCaptionNumbers)
        addContainerCaptionNumbers(tree, state);
};
exports.transform = transform;
//# sourceMappingURL=transforms.js.map