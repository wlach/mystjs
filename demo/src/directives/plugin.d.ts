import MarkdownIt from 'markdown-it';
import { Directives } from './types';
export declare const plugin: (directives: Directives) => (md: MarkdownIt) => void;
