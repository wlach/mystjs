"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("./utils");
describe('Utils', () => {
    it('html formatting is simple', () => {
        const f = utils_1.formatTag('figure', { id: 'one', class: 'numbered' }, false);
        expect(f).toBe('<figure id="one" class="numbered">');
    });
    it('strips dangerous tags', () => {
        const f = utils_1.formatTag('figure', { id: 'one', class: '<script>' }, false);
        expect(f).toBe('<figure id="one" class="&lt;script&gt;">');
    });
});
describe('toHTML', () => {
    it('Converts a tag schema to a string', () => {
        const [a, b] = utils_1.toHTML([
            'figure',
            { hi: '1' },
            ['img', { src: '2' }],
            ['figcaption', { number: '3' }, 0]
        ]);
        expect(a).toBe('<figure hi="1">\n<img src="2">\n<figcaption number="3">\n');
        expect(b).toBe('</figcaption>\n</figure>\n');
    });
    it('Raises errors on multiple holes', () => {
        expect(() => utils_1.toHTML([
            'figure',
            { hi: '1' },
            0,
            ['img', { src: '2' }],
            ['figcaption', { number: '3' }, 0]
        ])).toThrow();
    });
});
//# sourceMappingURL=utils.spec.js.map