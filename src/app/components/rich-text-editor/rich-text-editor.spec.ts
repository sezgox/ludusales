import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RichTextEditor } from './rich-text-editor';

describe('RichTextEditor', () => {
  let fixture: ComponentFixture<RichTextEditor>;
  let component: RichTextEditor;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [RichTextEditor] }).compileComponents();
    fixture = TestBed.createComponent(RichTextEditor);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('creates an accessible multiline editing surface in the browser', () => {
    const editor: HTMLElement | null = fixture.nativeElement.querySelector('[role="textbox"]');
    expect(editor?.getAttribute('aria-multiline')).toBe('true');
    expect(fixture.nativeElement.querySelector('[role="toolbar"]')).not.toBeNull();
  });

  it('supports Angular disabled state', () => {
    component.setDisabledState(true);
    fixture.detectChanges();
    expect(component.disabled()).toBe(true);
    const wrapper: HTMLElement = fixture.nativeElement.querySelector('.rich-text-editor');
    expect(wrapper.classList.contains('is-disabled')).toBe(true);
  });

  it('exposes required and invalid state on the editing surface', () => {
    fixture.componentRef.setInput('required', true);
    fixture.componentRef.setInput('invalid', true);
    fixture.componentRef.setInput('ariaDescribedBy', 'description-error');
    fixture.detectChanges();

    const editor: HTMLElement = fixture.nativeElement.querySelector('[role="textbox"]');
    expect(editor.getAttribute('aria-required')).toBe('true');
    expect(editor.getAttribute('aria-invalid')).toBe('true');
    expect(editor.getAttribute('aria-describedby')).toBe('description-error');
    expect(fixture.nativeElement.querySelector('.rich-text-editor').classList).toContain('is-invalid');
  });
});
