import { afterNextRender, ChangeDetectionStrategy, Component, DestroyRef, effect, forwardRef, inject, input, signal, viewChild, ElementRef } from '@angular/core';
import { FormControl, NG_VALUE_ACCESSOR, ReactiveFormsModule, type ControlValueAccessor } from '@angular/forms';
import { Editor } from '@tiptap/core';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import StarterKit from '@tiptap/starter-kit';

@Component({
  selector: 'app-rich-text-editor',
  imports: [ReactiveFormsModule],
  templateUrl: './rich-text-editor.html',
  styleUrl: './rich-text-editor.css',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => RichTextEditor),
      multi: true,
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RichTextEditor implements ControlValueAccessor {
  private readonly destroyRef = inject(DestroyRef);
  private readonly editorHost = viewChild.required<ElementRef<HTMLElement>>('editorHost');
  private editor: Editor | null = null;
  private pendingValue = '';
  private onChange: (value: string) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  readonly ariaLabel = input('Descripción de la gamificación');
  readonly ariaDescribedBy = input<string | null>(null);
  readonly invalid = input(false);
  readonly required = input(false);
  readonly disabled = signal(false);
  readonly revision = signal(0);
  readonly linkFormOpen = signal(false);
  readonly linkFeedback = signal<string | null>(null);
  readonly linkControl = new FormControl('', { nonNullable: true });

  constructor() {
    afterNextRender(() => this.initializeEditor());
    this.destroyRef.onDestroy(() => this.editor?.destroy());
    effect(() => {
      this.invalid();
      this.required();
      this.ariaDescribedBy();
      this.syncAccessibilityAttributes();
    });
  }

  writeValue(value: string | null): void {
    this.pendingValue = value ?? '';

    if (this.editor && this.editor.getHTML() !== this.pendingValue) {
      this.editor.commands.setContent(this.pendingValue || '<p></p>', { emitUpdate: false });
      this.bumpRevision();
    }
  }

  registerOnChange(callback: (value: string) => void): void {
    this.onChange = callback;
  }

  registerOnTouched(callback: () => void): void {
    this.onTouched = callback;
  }

  setDisabledState(disabled: boolean): void {
    this.disabled.set(disabled);
    this.editor?.setEditable(!disabled);
  }

  toggleBold(): void {
    this.runCommand(() => this.editor?.chain().focus().toggleBold().run());
  }

  toggleItalic(): void {
    this.runCommand(() => this.editor?.chain().focus().toggleItalic().run());
  }

  toggleUnderline(): void {
    this.runCommand(() => this.editor?.chain().focus().toggleUnderline().run());
  }

  toggleStrike(): void {
    this.runCommand(() => this.editor?.chain().focus().toggleStrike().run());
  }

  setParagraph(): void {
    this.runCommand(() => this.editor?.chain().focus().setParagraph().run());
  }

  toggleHeading(level: 2 | 3): void {
    this.runCommand(() => this.editor?.chain().focus().toggleHeading({ level }).run());
  }

  toggleBulletList(): void {
    this.runCommand(() => this.editor?.chain().focus().toggleBulletList().run());
  }

  toggleOrderedList(): void {
    this.runCommand(() => this.editor?.chain().focus().toggleOrderedList().run());
  }

  toggleBlockquote(): void {
    this.runCommand(() => this.editor?.chain().focus().toggleBlockquote().run());
  }

  undo(): void {
    this.runCommand(() => this.editor?.chain().focus().undo().run());
  }

  redo(): void {
    this.runCommand(() => this.editor?.chain().focus().redo().run());
  }

  openLinkForm(): void {
    const attributes = this.editor?.getAttributes('link');
    const href = attributes ? Reflect.get(attributes, 'href') : null;
    this.linkControl.setValue(typeof href === 'string' ? href : '');
    this.linkFeedback.set(null);
    this.linkFormOpen.set(true);
  }

  closeLinkForm(): void {
    this.linkFormOpen.set(false);
    this.linkFeedback.set(null);
  }

  applyLink(): void {
    const href = this.linkControl.value.trim();

    if (!/^(https?:\/\/|mailto:).+/i.test(href)) {
      this.linkFeedback.set('Usa una URL http, https o mailto.');
      return;
    }

    this.runCommand(() => this.editor?.chain().focus().extendMarkRange('link').setLink({ href }).run());
    this.closeLinkForm();
  }

  removeLink(): void {
    this.runCommand(() => this.editor?.chain().focus().extendMarkRange('link').unsetLink().run());
    this.closeLinkForm();
  }

  isActive(name: string, attributes?: Record<string, unknown>): boolean {
    this.revision();
    return this.editor?.isActive(name, attributes) ?? false;
  }

  canUndo(): boolean {
    this.revision();
    return this.editor?.can().chain().focus().undo().run() ?? false;
  }

  canRedo(): boolean {
    this.revision();
    return this.editor?.can().chain().focus().redo().run() ?? false;
  }

  private initializeEditor(): void {
    this.editor = new Editor({
      element: this.editorHost().nativeElement,
      extensions: [
        StarterKit.configure({ heading: { levels: [2, 3] }, code: false, codeBlock: false, horizontalRule: false }),
        Underline,
        Link.configure({ openOnClick: false, autolink: false, defaultProtocol: 'https' }),
      ],
      content: this.pendingValue || '<p></p>',
      editable: !this.disabled(),
      editorProps: {
        attributes: {
          class: 'rich-text-editor__content',
          role: 'textbox',
          'aria-label': this.ariaLabel(),
          'aria-multiline': 'true',
        },
        handleDOMEvents: {
          blur: () => {
            this.onTouched();
            return false;
          },
        },
      },
      onUpdate: ({ editor }) => {
        this.pendingValue = editor.getHTML();
        this.onChange(this.pendingValue);
        this.bumpRevision();
      },
      onSelectionUpdate: () => this.bumpRevision(),
      onTransaction: () => this.bumpRevision(),
    });
    this.syncAccessibilityAttributes();
    this.bumpRevision();
  }

  private syncAccessibilityAttributes(): void {
    const editorElement = this.editor?.view.dom;
    if (!editorElement) return;

    editorElement.setAttribute('aria-invalid', String(this.invalid()));
    editorElement.setAttribute('aria-required', String(this.required()));
    const describedBy = this.ariaDescribedBy();
    if (describedBy) editorElement.setAttribute('aria-describedby', describedBy);
    else editorElement.removeAttribute('aria-describedby');
  }

  private runCommand(command: () => boolean | undefined): void {
    if (!this.disabled()) {
      command();
      this.bumpRevision();
    }
  }

  private bumpRevision(): void {
    this.revision.update((value) => value + 1);
  }
}
