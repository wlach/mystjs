import { Root } from 'mdast';
import { GenericNode } from '.';
export declare enum TargetKind {
    heading = "heading",
    math = "math",
    figure = "figure",
    table = "table",
    code = "code"
}
export declare enum ReferenceKind {
    ref = "ref",
    numref = "numref",
    eq = "eq"
}
declare type Target = {
    node: GenericNode;
    kind: TargetKind;
    number: string;
};
export declare class State {
    targets: Record<string, Target>;
    targetCounts: Record<string, number>;
    constructor(targetCounts?: Record<string, number>, targets?: Record<string, Target>);
    addTarget(node: GenericNode): void;
    incrementCount(kind: string): number;
    getTarget(identifier?: string): Target | undefined;
    resolveReferenceContent(node: GenericNode): GenericNode['children'] | undefined;
}
export declare const countState: (state: State, tree: Root) => Root;
export declare const referenceState: (state: State, tree: Root) => void;
export {};
