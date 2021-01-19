import Token from 'markdown-it/lib/token';
import MarkdownIt from 'markdown-it';
import Renderer from 'markdown-it/lib/renderer';
import { HTMLOutputSpecArray } from '../utils';
import { StateEnv, TargetKind, Target } from '../state';
export declare enum DirectiveTokens {
    open = "container_directives_open",
    close = "container_directives_close",
    fence = "fence_directive",
    inline = "inline"
}
declare type Dict = Record<string, any>;
export declare type Directive<Args extends Dict = Dict, Opts extends Dict = Dict> = {
    token: string;
    numbered?: TargetKind;
    skipParsing?: true;
    autoNumber?: true;
    getArguments: (info: string) => {
        args: Args;
        content?: string;
    };
    getOptions: (data: Record<string, string>) => Opts;
    renderer: (args: Args, opts: Opts, target: Target | undefined, tokens: Token[], idx: number, options: MarkdownIt.Options, env: StateEnv, self: Renderer) => HTMLOutputSpecArray;
};
export declare type Directives = Record<string, Directive<any, any>>;
export {};
