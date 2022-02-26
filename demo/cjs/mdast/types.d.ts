import type Token from 'markdown-it/lib/token';
export type { Token };
export declare type GenericText = {
    type: string;
    value: string;
};
export declare type GenericNode<T extends Record<string, any> = Record<string, any>> = {
    type: string;
    kind?: string;
    children?: GenericNode<Record<string, any>>[];
    value?: string;
    identifier?: string;
    label?: string;
} & T;
export declare type GenericParent<T extends Record<string, any> = Record<string, any>> = GenericNode<T> & {
    children: GenericNode<T>[];
};
export declare type Spec = {
    type: string;
    getAttrs?: (token: Token, tokens: Token[], index: number) => Record<string, any>;
    attrs?: Record<string, any>;
    noCloseToken?: boolean;
    isText?: boolean;
    isLeaf?: boolean;
};
export declare type Admonition = GenericNode<{
    kind?: AdmonitionKind;
    class?: string;
}>;
export declare type Container = {
    kind: string;
    identifier?: string;
    label?: string;
    class?: string;
    numbered?: boolean;
};
export declare enum AdmonitionKind {
    admonition = "admonition",
    attention = "attention",
    caution = "caution",
    danger = "danger",
    error = "error",
    important = "important",
    hint = "hint",
    note = "note",
    seealso = "seealso",
    tip = "tip",
    warning = "warning"
}
