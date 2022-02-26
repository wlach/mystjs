import MarkdownIt from 'markdown-it';
export declare type MathExtensionOptions = {
    amsmath?: boolean;
    dollarmath?: boolean;
};
export declare function addMathRenderers(md: MarkdownIt): void;
export declare function plugin(md: MarkdownIt, options?: true | MathExtensionOptions): void;
