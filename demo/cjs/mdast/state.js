"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.referenceState = exports.countState = exports.State = exports.ReferenceKind = exports.TargetKind = void 0;
const unist_util_visit_1 = require("unist-util-visit");
const unist_util_select_1 = require("unist-util-select");
const mdast_util_find_and_replace_1 = require("mdast-util-find-and-replace");
const utils_1 = require("./utils");
var TargetKind;
(function (TargetKind) {
    TargetKind["heading"] = "heading";
    TargetKind["math"] = "math";
    TargetKind["figure"] = "figure";
    TargetKind["table"] = "table";
    TargetKind["code"] = "code";
})(TargetKind = exports.TargetKind || (exports.TargetKind = {}));
var ReferenceKind;
(function (ReferenceKind) {
    ReferenceKind["ref"] = "ref";
    ReferenceKind["numref"] = "numref";
    ReferenceKind["eq"] = "eq";
})(ReferenceKind = exports.ReferenceKind || (exports.ReferenceKind = {}));
/**
 * See https://www.sphinx-doc.org/en/master/usage/restructuredtext/roles.html#role-numref
 */
function fillReferenceNumbers(node, number) {
    const num = String(number);
    (0, mdast_util_find_and_replace_1.findAndReplace)(node, { '%s': num, '{number}': num });
}
function copyNode(node) {
    return JSON.parse(JSON.stringify(node));
}
class State {
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
                (0, utils_1.setTextAsChild)(node, `(${target.number})`);
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
                const caption = (0, unist_util_select_1.select)('caption > paragraph', target.node);
                node.children = copyNode(caption).children;
            }
            node.resolved = true;
        }
        else if (kinds.ref.numref && kinds.target.figure) {
            if (noNodeChildren) {
                (0, utils_1.setTextAsChild)(node, 'Figure %s');
            }
            fillReferenceNumbers(node, target.number);
            node.resolved = true;
        }
        else if (kinds.ref.numref && kinds.target.table) {
            if (noNodeChildren) {
                (0, utils_1.setTextAsChild)(node, 'Table %s');
            }
            fillReferenceNumbers(node, target.number);
            node.resolved = true;
        }
    }
}
exports.State = State;
const countState = (state, tree) => {
    (0, unist_util_visit_1.visit)(tree, 'container', (node) => state.addTarget(node));
    (0, unist_util_visit_1.visit)(tree, 'math', (node) => state.addTarget(node));
    (0, unist_util_visit_1.visit)(tree, 'heading', (node) => state.addTarget(node));
    return tree;
};
exports.countState = countState;
const referenceState = (state, tree) => {
    (0, unist_util_select_1.selectAll)('link', tree).map((node) => {
        const reference = (0, utils_1.normalizeLabel)(node.url);
        if (reference && reference.identifier in state.targets) {
            node.type = 'contentReference';
            node.kind =
                state.targets[reference.identifier].kind === TargetKind.math ? 'eq' : 'ref';
            node.identifier = reference.identifier;
            node.label = reference.label;
            delete node.url;
        }
    });
    (0, unist_util_visit_1.visit)(tree, 'contentReference', (node) => {
        state.resolveReferenceContent(node);
    });
};
exports.referenceState = referenceState;
//# sourceMappingURL=state.js.map