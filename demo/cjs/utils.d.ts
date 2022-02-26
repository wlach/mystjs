declare type AttrTypes = string | string[] | number | boolean | undefined | null;
declare type HTMLAttributes = {
    [attr: string]: AttrTypes;
};
export interface HTMLOutputSpecArray {
    0: string;
    1?: HTMLOutputSpec | 0 | HTMLAttributes;
    2?: HTMLOutputSpec | 0;
    3?: HTMLOutputSpec | 0;
    4?: HTMLOutputSpec | 0;
    5?: HTMLOutputSpec | 0;
    6?: HTMLOutputSpec | 0;
    7?: HTMLOutputSpec | 0;
    8?: HTMLOutputSpec | 0;
    9?: HTMLOutputSpec | 0;
}
export declare type HTMLOutputSpec = HTMLOutputSpecArray;
export declare function formatTag(tag: string, attributes: HTMLAttributes, inline: boolean): string;
/**
 * A helper function to create valid HTML with a "hole" (represented by zero) for content.
 *
 * The content is escaped and null/undefined attributes are not included.
 *
 * **A simple wrapper tag:**
 * ```
 * const attr = 'hello';
 * const html = toHTML(['tag', {attr}, 0]);
 * console.log(html);
 * > ['<tag attr="hello">', '</tag>']
 * ```
 *
 * **A nested wrapper tag:**
 * ```
 * const html = toHTML([
 *  'tag', {attr},
 *  ['img', {src}],
 *  ['caption', 0],
 * ]);
 * console.log(html);
 * > ['<tag attr="x"><img src="src"><caption>', '</caption></tag>']
 * ```
 *
 * You can include `children` in the `attrs` and that adds inline content for a tag.
 *
 * You can also send in a list of strings for `attrs`, which are joined with a space (`' '`).
 *
 * Types are based on prosemirror-model.
 *
 * @param spec The spec for the dom model.
 * @param opts Options dict, `inline` creates HTML that is on a single line.
 */
export declare function toHTML(template: HTMLOutputSpec, opts?: {
    inline: boolean;
}): [string, string | null];
export {};
