import { TargetKind } from '../mdast/state';
declare type Target = {
    id: string;
    name: string;
    kind: TargetKind;
    defaultReference: string;
    title?: string;
    number?: number;
};
export declare const renderMath: (math: string, block: boolean, target?: Target | undefined) => string;
export {};
