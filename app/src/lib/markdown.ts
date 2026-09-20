import { Marked, type MarkedExtension, type TokenizerAndRendererExtension } from 'marked';
import katex from 'katex';

export function preprocessLatex(content: string): string {
  if (!content) return '';
  let text = content;

  text = text.replace(
    /(^|\n)\s*\[\s*([\s\S]*?\\[a-zA-Z]+[\s\S]*?)\s*\]\s*(?=\n|$)/g,
    (_match, prefix, math) => {
      return `${prefix}\\[ ${math.trim()} \\]`;
    }
  );

  text = text.replace(
    /(^|[\s(])\(\s*([^\n()]*?\\[a-zA-Z]+[^\n()]*?)\s*\)(?=$|[\s.,!?;:)])/g,
    (_match, prefix, math) => {
      return `${prefix}\\( ${math.trim()} \\)`;
    }
  );

  return text;
}

export function createKatexExtension(): MarkedExtension {
  const blockMath: TokenizerAndRendererExtension = {
    name: 'blockMath',
    level: 'block',
    start(src: string) {
      const match = src.match(/(\$\$|\\\[)/);
      return match ? match.index : undefined;
    },
    tokenizer(src: string) {
      const match = src.match(/^(?:\$\$([\s\S]*?)\$\$|\\\[([\s\S]*?)\\\])/);
      if (match) {
        const formula = (match[1] ?? match[2] ?? '').trim();
        return {
          type: 'blockMath',
          raw: match[0],
          text: formula,
        };
      }
    },
    renderer(token) {
      try {
        const rendered = katex.renderToString(token.text, {
          displayMode: true,
          throwOnError: false,
        });
        return `<div class="katex-display-wrapper my-3 overflow-x-auto py-1 text-center">${rendered}</div>\n`;
      } catch {
        return `<pre class="katex-error text-destructive">${token.text}</pre>`;
      }
    },
  };

  const inlineMath: TokenizerAndRendererExtension = {
    name: 'inlineMath',
    level: 'inline',
    start(src: string) {
      const match = src.match(/(\$|\\\()/);
      return match ? match.index : undefined;
    },
    tokenizer(src: string) {
      const parenMatch = src.match(/^\\\(([\s\S]*?)\\\)/);
      if (parenMatch) {
        return {
          type: 'inlineMath',
          raw: parenMatch[0],
          text: parenMatch[1].trim(),
        };
      }

      const dollarMatch = src.match(/^\$((?:\\\$|[^$\n])+?)\$/);
      if (dollarMatch) {
        return {
          type: 'inlineMath',
          raw: dollarMatch[0],
          text: dollarMatch[1].trim(),
        };
      }
    },
    renderer(token) {
      try {
        return katex.renderToString(token.text, {
          displayMode: false,
          throwOnError: false,
        });
      } catch {
        return `<span class="katex-error text-destructive">${token.text}</span>`;
      }
    },
  };

  return {
    extensions: [blockMath, inlineMath],
  };
}

const markedInstance = new Marked();
markedInstance.use(createKatexExtension());
markedInstance.setOptions({
  gfm: true,
  breaks: true,
});

export function renderMarkdown(content: string): string {
  if (!content) return '';
  try {
    const preprocessed = preprocessLatex(content);
    return markedInstance.parse(preprocessed, { async: false }) as string;
  } catch {
    return content;
  }
}
