import type { Root } from 'mdast';
import { Spec, Token } from './types';
export declare type Options = {
    handlers?: Record<string, Spec>;
    hoistSingleImagesOutofParagraphs?: boolean;
    nestBlocks?: boolean;
};
export declare function tokensToMyst(tokens: Token[], options?: Options): Root;
