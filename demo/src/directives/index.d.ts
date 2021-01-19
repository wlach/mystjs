import MarkdownIt from 'markdown-it';
import { Directives } from './types';
export declare const directivesPlugin: (directives: Directives) => (md: MarkdownIt) => void;
