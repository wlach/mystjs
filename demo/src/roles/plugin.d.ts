import MarkdownIt from 'markdown-it';
import { Roles } from './types';
export declare const plugin: (roles: Roles) => (md: MarkdownIt) => void;
