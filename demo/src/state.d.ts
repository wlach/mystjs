export declare enum TargetKind {
    ref = "ref",
    equation = "eq",
    figure = "fig",
    table = "table",
    code = "code"
}
export declare type Target = {
    id: string;
    name: string;
    kind: TargetKind;
    defaultReference: string;
    title?: string;
    number?: number;
};
export declare type StateEnv = {
    targets: Record<string, Target>;
    numbering: {
        eq: number;
        fig: number;
        table: number;
        code: number;
    };
};
export declare function getStateEnv(state: {
    env: any;
}): StateEnv;
/** Create a new internal target.
 *
 * @param state MarkdownIt state that will be modified
 * @param name The reference name that will be used for the target. Note some directives use label.
 * @param kind The target kind: "ref", "equation", "code", "table" or "figure"
 */
export declare function newTarget(state: {
    env: any;
}, name: string | undefined, kind: TargetKind): Target;
