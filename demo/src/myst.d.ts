import MarkdownIt from 'markdown-it';
import { Directives } from './directives/types';
import { Roles } from './roles/types';
export declare type Options = {
    directives: Directives;
    roles: Roles;
    math?: boolean;
    markdownit?: MarkdownIt.Options;
};
export declare const defaultOptions: Options;
export default function MyST(opts?: Options): MarkdownIt;
