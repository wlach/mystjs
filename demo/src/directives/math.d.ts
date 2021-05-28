import { Directive } from './types';
export declare type Args = {
    [key: string]: any;
};
export declare type Opts = {
    name: string;
};
declare const math: {
    math: Directive<Args, Opts>;
};
export default math;
