import { Root } from 'mdast';
import { Plugin } from 'unified';
import { State } from './state';
export declare type Options = {
    addAdmonitionHeaders?: boolean;
    addContainerCaptionNumbers?: boolean;
};
export declare function addAdmonitionHeaders(tree: Root): void;
export declare function addContainerCaptionNumbers(tree: Root, state: State): void;
export declare const transform: Plugin<[State, Options?], string, Root>;
