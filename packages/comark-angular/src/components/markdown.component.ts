import {
  Component,
  Input,
  OnChanges,
  SimpleChanges,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Type,
  inject,
} from '@angular/core'
import { createSerializedMarkdownParser, getMarkdownParser } from 'comark'
import type { ParserOptions, ComarkParseFn, MarkdownDocument as MarkdownDocumentType } from 'comark'
import { isMarkdownDocument } from 'comark/utils'
import { MarkdownDocument } from './markdown-document.component.ts'

/**
 * High-level Markdown component that accepts raw markdown, parses it,
 * and renders the resulting document.
 *
 * @example
 * ```html
 * <comark-markdown [value]="content" [components]="customComponents" />
 * ```
 */
@Component({
  selector: 'comark-markdown',
  standalone: true,
  imports: [MarkdownDocument],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (document) {
      <comark-markdown-document
        [value]="document"
        [components]="components"
        [streaming]="streaming"
        [caret]="caret"
        [data]="data"
      />
    }
  `,
})
export class Markdown implements OnChanges {
  /** The markdown content to parse and render, or a pre-parsed MarkdownDocument */
  @Input() value?: string | MarkdownDocumentType

  /** Parser options (excluding plugins) */
  @Input() options: Exclude<ParserOptions, 'plugins'> = {}

  /** Additional plugins to use */
  @Input() plugins: ParserOptions['plugins'] = []

  /**
   * Strip wrapper tags from the top level of the document — shorthand for
   * `options.unwrap`. `true` unwraps `<p>`; a space-separated string or array
   * unwraps the listed tags.
   */
  @Input() unwrap: boolean | string | string[] = false

  /** Custom component mappings for element tags */
  @Input() components: Record<string, Type<any>> = {}

  /** Enable streaming mode */
  @Input() streaming: boolean = false

  /** If document has a <!-- more --> comment, only render content before it */
  @Input() summary: boolean = false

  /** Append a caret to the last text node (for streaming UIs) */
  @Input() caret: boolean | { class: string } = false

  /** Additional data to pass to the renderer for :binding resolution */
  @Input() data: Record<string, unknown> = {}

  /** Parser to use instead of one resolved from `options` and `plugins` */
  @Input() parser?: ComarkParseFn

  document: MarkdownDocumentType | null = null

  private serializedParse: ComarkParseFn = getMarkdownParser({})

  private cdr = inject(ChangeDetectorRef)

  /**
   * Streaming keeps incremental state inside the parser closure, and every
   * non-streaming parse resets it, so a streaming instance must own its parser.
   * Non-streaming instances share one, which is where the win is.
   */
  private resolveParser(): ComarkParseFn {
    if (this.parser) return this.parser
    const parseOptions = {
      ...this.options,
      ...(this.unwrap ? { unwrap: this.unwrap } : {}),
      plugins: this.plugins,
    }
    return this.streaming ? createSerializedMarkdownParser(parseOptions) : getMarkdownParser(parseOptions)
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['options'] || changes['plugins'] || changes['unwrap'] || changes['streaming'] || changes['parser']) {
      this.serializedParse = this.resolveParser()
    }
    if (
      changes['value'] ||
      changes['options'] ||
      changes['plugins'] ||
      changes['unwrap'] ||
      changes['streaming'] ||
      changes['summary']
    ) {
      this.parseMarkdown()
    }
  }

  private parseMarkdown(): void {
    // Pre-parsed document — skip parsing and render directly
    if (isMarkdownDocument(this.value)) {
      this.document = this.value
      this.cdr.markForCheck()
      return
    }

    let source = (this.value as string | undefined) ?? ''
    if (this.summary) {
      source = source.split('<!-- more -->')[0] || ''
    }
    source = source.trim()

    this.serializedParse(source, { streaming: this.streaming }).then((result) => {
      this.document = result
      this.cdr.markForCheck()
    })
  }
}
