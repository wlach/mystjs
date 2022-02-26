import MarkdownIt from 'markdown-it';
import { Root } from 'mdast';
import type { Plugin } from 'unified';
import type { AllOptions, Options } from './types';
export type { Options, IRole, IDirective } from './types';
export { directivesDefault, Directive, IDirectiveData, directiveOptions, Role, rolesDefault, IRoleData, } from 'markdown-it-docutils';
export declare const defaultOptions: Omit<AllOptions, 'roles' | 'directives'>;
export declare class MyST {
    opts: Omit<AllOptions, 'roles' | 'directives'>;
    tokenizer: MarkdownIt;
    constructor(opts?: Options);
    _parseOptions(user: Options): Omit<AllOptions, 'roles' | 'directives'>;
    _createTokenizer(): MarkdownIt;
    parse(content: string): Root;
    render(content: string): string;
    renderMdast(tree: Root): string;
}
/**
 * MyST Parser as a Unified Plugin
 */
export declare const mystParser: Plugin<[Options?], string, Root>;
