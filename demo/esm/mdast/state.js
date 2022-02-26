import { visit } from 'unist-util-visit';
import { select, selectAll } from 'unist-util-select';
import { findAndReplace } from 'mdast-util-find-and-replace';
import { normalizeLabel, setTextAsChild } from './utils';
export var TargetKind;
(function (TargetKind) {
    TargetKind["heading"] = "heading";
    TargetKind["math"] = "math";
    TargetKind["figure"] = "figure";
    TargetKind["table"] = "table";
    TargetKind["code"] = "code";
})(TargetKind || (TargetKind = {}));
export var ReferenceKind;
(function (ReferenceKind) {
    ReferenceKind["ref"] = "ref";
    ReferenceKind["numref"] = "numref";
    ReferenceKind["eq"] = "eq";
})(ReferenceKind || (ReferenceKind = {}));
/**
 * See https://www.sphinx-doc.org/en/master/usage/restructuredtext/roles.html#role-numref
 */
function fillReferenceNumbers(node, number) {
    const num = String(number);
    findAndReplace(node, { '%s': num, '{number}': num });
}
function copyNode(node) {
    return JSON.parse(JSON.stringify(node));
}
export class State {
    constructor(targetCounts, targets) {
        this.targetCounts = targetCounts || {};
        this.targets = targets || {};
    }
    addTarget(node) {
        const kind = node.type === 'container' ? node.kind : node.type;
        node = copyNode(node);
        if (kind && kind in TargetKind && node.identifier) {
            if (kind === TargetKind.heading) {
                this.targets[node.identifier] = { node, kind, number: '' };
            }
            else {
                this.targets[node.identifier] = {
                    node,
                    kind: kind,
                    number: String(this.incrementCount(kind)),
                };
            }
        }
    }
    incrementCount(kind) {
        if (kind in this.targetCounts) {
            this.targetCounts[kind] += 1;
        }
        else {
            this.targetCounts[kind] = 1;
        }
        return this.targetCounts[kind];
    }
    getTarget(identifier) {
        if (!identifier)
            return undefined;
        return this.targets[identifier];
    }
    resolveReferenceContent(node) {
        var _a;
        const target = this.getTarget(node.identifier);
        if (!target) {
            return;
        }
        const kinds = {
            ref: {
                eq: node.kind === ReferenceKind.eq,
                ref: node.kind === ReferenceKind.ref,
                numref: node.kind === ReferenceKind.numref,
            },
            target: {
                math: target.kind === TargetKind.math,
                figure: target.kind === TargetKind.figure,
                table: target.kind === TargetKind.table,
                heading: target.kind === TargetKind.heading,
            },
        };
        const noNodeChildren = !((_a = node.children) === null || _a === void 0 ? void 0 : _a.length);
        if (kinds.ref.eq && kinds.target.math) {
            if (noNodeChildren) {
                setTextAsChild(node, `(${target.number})`);
            }
            node.resolved = true;
        }
        else if (kinds.ref.ref && kinds.target.heading) {
            if (noNodeChildren) {
                node.children = copyNode(target.node).children;
            }
            node.resolved = true;
        }
        else if (kinds.ref.ref && (kinds.target.figure || kinds.target.table)) {
            if (noNodeChildren) {
                const caption = select('caption > paragraph', target.node);
                node.children = copyNode(caption).children;
            }
            node.resolved = true;
        }
        else if (kinds.ref.numref && kinds.target.figure) {
            if (noNodeChildren) {
                setTextAsChild(node, 'Figure %s');
            }
            fillReferenceNumbers(node, target.number);
            node.resolved = true;
        }
        else if (kinds.ref.numref && kinds.target.table) {
            if (noNodeChildren) {
                setTextAsChild(node, 'Table %s');
            }
            fillReferenceNumbers(node, target.number);
            node.resolved = true;
        }
    }
}
export const countState = (state, tree) => {
    visit(tree, 'container', (node) => state.addTarget(node));
    visit(tree, 'math', (node) => state.addTarget(node));
    visit(tree, 'heading', (node) => state.addTarget(node));
    return tree;
};
export const referenceState = (state, tree) => {
    selectAll('link', tree).map((node) => {
        const reference = normalizeLabel(node.url);
        if (reference && reference.identifier in state.targets) {
            node.type = 'contentReference';
            node.kind =
                state.targets[reference.identifier].kind === TargetKind.math ? 'eq' : 'ref';
            node.identifier = reference.identifier;
            node.label = reference.label;
            delete node.url;
        }
    });
    visit(tree, 'contentReference', (node) => {
        state.resolveReferenceContent(node);
    });
};
//# sourceMappingURL=state.js.map