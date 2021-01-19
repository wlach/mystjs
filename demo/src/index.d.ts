import MarkdownIt from 'markdown-it';
import { Directives } from './directives/types';
import { Roles } from './roles/types';
export declare type Options = {
    directives: Directives;
    roles: Roles;
    math?: boolean;
};
export declare const defaultPlugins: Options;
export declare const defaultOpts: MarkdownIt.Options;
export default function MyST(plugins?: Options, opts?: MarkdownIt.Options | undefined): MarkdownIt;
