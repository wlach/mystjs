import { Directive } from './types';
declare const admonitionTitles: {
    attention: string;
    caution: string;
    danger: string;
    error: string;
    important: string;
    hint: string;
    note: string;
    seealso: string;
    tip: string;
    warning: string;
};
declare type AdmonitionTypes = keyof typeof admonitionTitles | 'admonition';
export declare type Args = {
    title: string;
};
export declare type Opts = {
    class: AdmonitionTypes;
};
declare const admonitions: {
    admonition: Directive<Args, Opts>;
    callout: Directive<Args, Opts>;
    attention: Directive<Args, Opts>;
    caution: Directive<Args, Opts>;
    danger: Directive<Args, Opts>;
    error: Directive<Args, Opts>;
    important: Directive<Args, Opts>;
    hint: Directive<Args, Opts>;
    note: Directive<Args, Opts>;
    seealso: Directive<Args, Opts>;
    tip: Directive<Args, Opts>;
    warning: Directive<Args, Opts>;
};
export default admonitions;
