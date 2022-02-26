import { AdmonitionKind, GenericNode } from './types';
export declare function admonitionKindToTitle(kind: AdmonitionKind): string;
export declare function withoutTrailingNewline(str: string): string;
/**
 * https://github.com/syntax-tree/mdast#association
 * @param label A label field can be present.
 *        label is a string value: it works just like title on a link or a
 *        lang on code: character escapes and character references are parsed.
 * @returns { identifier, label }
 */
export declare function normalizeLabel(label: string | undefined): {
    identifier: string;
    label: string;
} | undefined;
export declare function setTextAsChild(node: GenericNode, text: string): void;
