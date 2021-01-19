"use strict";
/* eslint-disable no-param-reassign */
Object.defineProperty(exports, "__esModule", { value: true });
exports.newTarget = exports.getStateEnv = exports.TargetKind = void 0;
const utils_1 = require("markdown-it/lib/common/utils");
var TargetKind;
(function (TargetKind) {
    TargetKind["ref"] = "ref";
    TargetKind["equation"] = "eq";
    TargetKind["figure"] = "fig";
    TargetKind["table"] = "table";
    TargetKind["code"] = "code";
})(TargetKind = exports.TargetKind || (exports.TargetKind = {}));
const RefFormatter = {
    ref(id) { return `[${id}]`; },
    eq(id, num) { return `Eq ${num}`; },
    fig(id, num) { return `Fig ${num}`; },
    table(id, num) { return `Table ${num}`; },
    code(id, num) { return `Code ${num}`; },
};
function getStateEnv(state) {
    const env = state.env;
    if (!env.targets)
        env.targets = {};
    if (!env.numbering) {
        env.numbering = {
            eq: 0,
            fig: 0,
            table: 0,
            code: 0,
        };
    }
    if (!state.env)
        state.env = env;
    return env;
}
exports.getStateEnv = getStateEnv;
/** Get the next number for an equation, figure, code or table
 *
 * Can input `{ numbering: { equation: 100 } }` to start counting at a different numebr.
 *
 * @param state MarkdownIt state that will be modified
 */
function nextNumber(state, kind) {
    if (kind === TargetKind.ref)
        throw new Error('Targets are not numbered?');
    const env = getStateEnv(state);
    env.numbering[kind] += 1;
    return env.numbering[kind];
}
/** Create a new internal target.
 *
 * @param state MarkdownIt state that will be modified
 * @param name The reference name that will be used for the target. Note some directives use label.
 * @param kind The target kind: "ref", "equation", "code", "table" or "figure"
 */
function newTarget(state, name, kind) {
    const env = getStateEnv(state);
    const number = kind === TargetKind.ref ? undefined : nextNumber(state, kind);
    // TODO: not sure about this - if name is not provided, then you get `fig-1` etc.
    const useName = name ? utils_1.escapeHtml(name) : `${kind}-${String(number)}`;
    const id = name ? `${kind}-${utils_1.escapeHtml(useName)}` : useName;
    const target = {
        id,
        name: useName,
        defaultReference: RefFormatter[kind](id, number),
        kind,
        number,
    };
    env.targets[useName] = target;
    return target;
}
exports.newTarget = newTarget;
//# sourceMappingURL=state.js.map