import { Component, computed, input } from '@angular/core';

interface Span {
  text: string;
  bold: boolean;
}

type Block =
  | { kind: 'heading' | 'paragraph'; spans: Span[] }
  | { kind: 'ordered' | 'bullets'; items: Span[][] };

/** Splits `**bold**` runs into spans so they render without innerHTML. */
function toSpans(text: string): Span[] {
  return text
    .split(/\*\*(.+?)\*\*/g)
    .map((part, i) => ({ text: part, bold: i % 2 === 1 }))
    .filter((span) => span.text);
}

/** Parses the small Markdown subset articles use: `## ` headings, numbered and `- ` lists, paragraphs. */
function parseArticle(content: string): Block[] {
  const blocks: Block[] = [];
  let paragraph: string[] = [];

  const flush = () => {
    if (paragraph.length) blocks.push({ kind: 'paragraph', spans: toSpans(paragraph.join(' ')) });
    paragraph = [];
  };

  const addItem = (kind: 'ordered' | 'bullets', text: string) => {
    flush();
    const last = blocks.at(-1);
    if (last?.kind === kind) last.items.push(toSpans(text));
    else blocks.push({ kind, items: [toSpans(text)] });
  };

  for (const raw of content.split('\n')) {
    const line = raw.trim();
    const numbered = /^\d+[.)]\s+(.*)$/.exec(line);
    const bullet = /^[-*]\s+(.*)$/.exec(line);

    if (!line) flush();
    else if (line.startsWith('#')) {
      flush();
      blocks.push({ kind: 'heading', spans: toSpans(line.replace(/^#+\s*/, '')) });
    } else if (numbered) addItem('ordered', numbered[1]);
    else if (bullet) addItem('bullets', bullet[1]);
    else paragraph.push(line);
  }
  flush();
  return blocks;
}

/** Renders inline spans; used as an attribute so the host keeps its own element (h2, p, li). */
@Component({
  selector: '[appSpans]',
  template: `
    @for (span of spans(); track $index) {
      @if (span.bold) {
        <strong class="font-semibold">{{ span.text }}</strong>
      } @else {
        {{ span.text }}
      }
    }
  `,
})
export class Spans {
  readonly spans = input.required<Span[]>({ alias: 'appSpans' });
}

@Component({
  selector: 'app-article-content',
  imports: [Spans],
  host: { class: 'block space-y-4 leading-relaxed' },
  template: `
    @for (block of blocks(); track $index) {
      @switch (block.kind) {
        @case ('heading') {
          <h2 class="pt-2 text-base md:text-lg" [appSpans]="block.spans"></h2>
        }
        @case ('paragraph') {
          <p [appSpans]="block.spans"></p>
        }
        @case ('ordered') {
          <ol class="list-decimal space-y-1.5 pl-6">
            @for (item of block.items; track $index) {
              <li [appSpans]="item"></li>
            }
          </ol>
        }
        @case ('bullets') {
          <ul class="list-disc space-y-1.5 pl-6">
            @for (item of block.items; track $index) {
              <li [appSpans]="item"></li>
            }
          </ul>
        }
      }
    }
  `,
})
export class ArticleContent {
  readonly content = input.required<string>();

  protected readonly blocks = computed(() => parseArticle(this.content()));
}
