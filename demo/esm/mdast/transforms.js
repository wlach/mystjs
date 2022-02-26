import { visit } from 'unist-util-visit';
import { select, selectAll } from 'unist-util-select';
import { AdmonitionKind } from './types';
import { admonitionKindToTitle } from './utils';
import { countState, referenceState } from './state';
const defaultOptions = {
    addAdmonitionHeaders: true,
    addContainerCaptionNumbers: true,
};
// Visit all admonitions and add headers if necessary
export function addAdmonitionHeaders(tree) {
    visit(tree, 'admonition', (node) => {
        var _a;
        if (!node.kind || node.kind === AdmonitionKind.admonition)
            return;
        node.children = [
            {
                type: 'admonitionTitle',
                children: [{ type: 'text', value: admonitionKindToTitle(node.kind) }],
            },
            ...((_a = node.children) !== null && _a !== void 0 ? _a : []),
        ];
    });
}
// Visit all containers and add captions
export function addContainerCaptionNumbers(tree, state) {
    selectAll('container[numbered=true]', tree).forEach((container) => {
        var _a, _b;
        const number = (_a = state.getTarget(container.identifier)) === null || _a === void 0 ? void 0 : _a.number;
        const para = select('caption > paragraph', container);
        if (number && para) {
            para.children = [
                { type: 'captionNumber', kind: container.kind, value: number },
                ...((_b = para === null || para === void 0 ? void 0 : para.children) !== null && _b !== void 0 ? _b : []),
            ];
        }
    });
}
export const transform = (state, o) => (tree) => {
    const opts = Object.assign(Object.assign({}, defaultOptions), o);
    countState(state, tree);
    referenceState(state, tree);
    if (opts.addAdmonitionHeaders)
        addAdmonitionHeaders(tree);
    if (opts.addContainerCaptionNumbers)
        addContainerCaptionNumbers(tree, state);
};
//# sourceMappingURL=transforms.js.map