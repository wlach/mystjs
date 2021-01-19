import MarkdownIt from 'markdown-it';
import { Roles } from './types';
export declare const rolePlugin: (roles: Roles) => (md: MarkdownIt) => void;
