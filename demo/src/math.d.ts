import MarkdownIt from 'markdown-it';
import { Target } from './state';
export declare const renderMath: (math: string, block: boolean, target?: Target | undefined) => string;
export declare function addMathRenderers(md: MarkdownIt): void;
export declare function mathPlugin(md: MarkdownIt): void;
