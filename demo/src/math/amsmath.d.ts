import MarkdownIt from 'markdown-it';
/**
  Parses TeX math equations, without any surrounding delimiters,
  only for top-level [amsmath](https://ctan.org/pkg/amsmath) environments:
  ```latex
    \begin{gather*}
      a_1=b_1+c_1\\
      a_2=b_2+c_2-d_2+e_2
    \end{gather*}
  ```
*/
declare function amsmathPlugin(md: MarkdownIt): void;
export default amsmathPlugin;
