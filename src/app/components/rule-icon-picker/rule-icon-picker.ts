import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { icons, isLucideIconComponent, LucideDynamicIcon } from '@lucide/angular';

const pageSize = 72;
const iconNames = Object.values(icons)
  .filter(isLucideIconComponent)
  .map((icon) => icon.icon.name)
  .filter((name, index, names) => names.indexOf(name) === index)
  .sort((left, right) => left.localeCompare(right));

@Component({
  selector: 'app-rule-icon-picker',
  imports: [LucideDynamicIcon],
  templateUrl: './rule-icon-picker.html',
  styleUrl: './rule-icon-picker.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RuleIconPicker {
  readonly iconName = input.required<string>();
  readonly selected = output<string>();
  readonly search = signal('');
  readonly page = signal(0);
  readonly matchingIcons = computed(() => {
    const term = this.search().trim().toLowerCase();
    return term ? iconNames.filter((name) => name.includes(term)) : iconNames;
  });
  readonly pageCount = computed(() => Math.max(1, Math.ceil(this.matchingIcons().length / pageSize)));
  readonly visibleIcons = computed(() => {
    const page = Math.min(this.page(), this.pageCount() - 1);
    return this.matchingIcons().slice(page * pageSize, (page + 1) * pageSize);
  });

  open(dialog: HTMLDialogElement): void {
    this.search.set('');
    this.page.set(0);
    dialog.showModal();
  }

  updateSearch(value: string): void {
    this.search.set(value);
    this.page.set(0);
  }

  choose(iconName: string, dialog: HTMLDialogElement): void {
    this.selected.emit(iconName);
    dialog.close();
  }

  previousPage(): void {
    this.page.update((page) => Math.max(0, page - 1));
  }

  nextPage(): void {
    this.page.update((page) => Math.min(this.pageCount() - 1, page + 1));
  }
}
