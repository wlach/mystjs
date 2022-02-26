import type { GenericNode, GenericText, Spec, Token } from './types';
/** MarkdownParseState tracks the context of a running token stream.
 *
 * Loosly based on prosemirror-markdown
 */
export declare class MarkdownParseState {
    stack: GenericNode[];
    handlers: Record<string, TokenHandler>;
    constructor(handlers: Record<string, Spec>);
    top(): GenericNode<Record<string, any>>;
    addNode(node?: GenericNode): GenericNode<Record<string, any>> | undefined;
    addText(text: string, type?: string, attrs?: Record<string, any>): GenericText | GenericNode<Record<string, any>> | undefined;
    openNode(type: string, attrs: Record<string, any>, isLeaf?: boolean): void;
    closeNode(): GenericNode<Record<string, any>> | undefined;
    parseTokens(tokens?: Token[] | null): void;
}
declare type TokenHandler = (state: MarkdownParseState, token: Token, tokens: Token[], index: number) => void;
export {};
