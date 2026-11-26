import { DecimalPipe, DOCUMENT } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { FormControl, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import type { Badge, BadgeRarity, ChallengeMember, ChallengeSettings, Duel, ImportMode, MasterInput, MasterPreview, Metric, Minimum, Mission, PointRule } from '../../../models/challenge';
import { missionLabels, rarityLabels } from '../../../models/challenge';
import type { GamificationDetail } from '../../../models/gamification';
import { apiErrorMessage } from '../../../services/api-error';
import { ChallengeDataService } from '../../../services/challenge-data.service';
import { RankingExcelImportService } from '../../../services/ranking-excel-import.service';

const fixedHeaders = ['id_participante', 'nombre', 'fecha_datos', 'zona_equipo'];
const rarityPoints: Record<BadgeRarity, number> = { common: 5, rare: 10, epic: 25, legendary: 50 };

@Component({
  selector: 'app-challenge-editor',
  imports: [ReactiveFormsModule, DecimalPipe],
  templateUrl: './challenge-editor.html',
  styleUrl: './challenge-editor.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChallengeEditor {
  private readonly api = inject(ChallengeDataService);
  private readonly excel = inject(RankingExcelImportService);
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly document = inject(DOCUMENT);

  readonly challenge = input.required<GamificationDetail>();
  readonly changed = output<void>();
  readonly settings = signal<ChallengeSettings | null>(null);
  readonly members = signal<ChallengeMember[]>([]);
  readonly pending = signal(false);
  readonly error = signal<string | null>(null);
  readonly success = signal<string | null>(null);
  readonly errors = signal<string[]>([]);
  readonly warnings = signal<string[]>([]);
  readonly file = signal<File | null>(null);
  readonly preview = signal<{ result: MasterPreview; input: MasterInput; file: File } | null>(null);
  readonly missionLabels = missionLabels;
  readonly rarityLabels = rarityLabels;
  readonly missionKinds = Object.keys(missionLabels) as Mission['kind'][];
  readonly rarities = Object.keys(rarityLabels) as BadgeRarity[];
  readonly weekdays = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

  readonly metrics = this.fb.array<ReturnType<ChallengeEditor['metricGroup']>>([]);
  readonly rules = this.fb.array<ReturnType<ChallengeEditor['ruleGroup']>>([]);
  readonly minimums = this.fb.array<ReturnType<ChallengeEditor['minimumGroup']>>([]);
  readonly missions = this.fb.array<ReturnType<ChallengeEditor['missionGroup']>>([]);
  readonly badges = this.fb.array<ReturnType<ChallengeEditor['badgeGroup']>>([]);
  readonly duels = this.fb.array<ReturnType<ChallengeEditor['duelGroup']>>([]);
  readonly columns = this.fb.array<ReturnType<ChallengeEditor['columnGroup']>>([]);
  readonly config = this.fb.group({ metrics: this.metrics, rules: this.rules, minimums: this.minimums, missions: this.missions, badges: this.badges, duels: this.duels,
    columns: this.columns, tieBreakers: [''], hiddenMetrics: [''], goalMetric: [''], streakLength: [0], streakPoints: [0],
    mode: this.fb.control<ImportMode>('accumulated'), showTeams: [false], showDuels: [false], showPhotos: [true], anonymousFrom: [0], tvInterval: [9], tvLimit: [10],
    updateDays: this.fb.control<number[]>([]),
  });
  readonly rosterForm = this.fb.group({ code: ['', Validators.required], fullName: ['', Validators.required], zone: [''], active: [true] });
  readonly uploading = this.fb.group({ mode: this.fb.control<ImportMode>('accumulated'), allowDecreases: [false] });

  constructor() {
    const id = computed(() => this.challenge().publicId);
    effect(() => { void this.load(id()); });
  }

  async load(id = this.challenge().publicId): Promise<void> {
    this.pending.set(true);
    this.error.set(null);
    try {
      const [settings, members] = await Promise.all([firstValueFrom(this.api.settings(id)), firstValueFrom(this.api.members(id))]);
      if (id !== this.challenge().publicId) return;
      this.settings.set(settings);
      this.members.set(members);
      this.populate(settings);
    } catch (error) {
      if (id === this.challenge().publicId) this.error.set(apiErrorMessage(error, 'No se pudo cargar la configuración del reto.'));
    } finally {
      if (id === this.challenge().publicId) this.pending.set(false);
    }
  }

  metricGroup(value: Metric = { key: '', label: '', kind: 'sum', integer: false }) { return this.fb.group(value); }
  ruleGroup(value: PointRule = { metric: '', label: '', rate: 1, multiplier: null }) {
    return this.fb.group({ ...value, multiplier: new FormControl<number | null>(value.multiplier) });
  }
  minimumGroup(value: Minimum = { metric: '', operator: '>=', value: 0, label: '' }) { return this.fb.group(value); }
  missionGroup(value?: Mission) {
    const { startAt, endAt } = this.challenge();
    return this.fb.group(value ?? { id: crypto.randomUUID(), title: '', description: '', kind: 'all', metric: '', threshold: 1,
      start: startAt, end: endAt, reward: 5, featured: true } satisfies Mission);
  }
  badgeGroup(value: Badge = { id: crypto.randomUUID(), title: '', description: '', rarity: 'common', points: 5, rule: 'metric', metric: '', threshold: 1, active: true }) {
    return this.fb.group(value);
  }
  duelGroup(value?: Duel) {
    const { startAt, endAt } = this.challenge();
    const duel: Duel = value ?? { id: crypto.randomUUID(), title: '', round: '', format: 'solo', left: [], right: [], leftFrom: '', rightFrom: '',
      metric: '', start: startAt, end: endAt, stake: '', useZone: false };
    return this.fb.group({ ...duel, left: duel.left.join(', '), right: duel.right.join(', ') });
  }
  columnGroup(key: string, label: string) { return this.fb.group({ key, label }); }

  refreshColumns(): void {
    const mapping = new Map(this.columns.getRawValue().map(({ key, label }) => [key, label]));
    const keys = [...new Set([...fixedHeaders, ...this.metrics.getRawValue().map(({ key }) => key.trim()).filter(Boolean)])];
    this.columns.clear();
    for (const key of keys) this.columns.push(this.columnGroup(key, mapping.get(key) ?? key));
  }

  setRarity(group: ReturnType<ChallengeEditor['badgeGroup']>, rarity: string): void {
    if (rarity in rarityPoints) group.controls.points.setValue(rarityPoints[rarity as BadgeRarity]);
  }

  toggleUpdateDay(day: number, checked: boolean): void {
    const control = this.config.controls.updateDays;
    control.setValue(checked ? [...control.value, day] : control.value.filter((value) => value !== day));
  }

  async saveSettings(): Promise<void> {
    const value = this.config.getRawValue();
    const split = (list: string) => list.split(',').map((item) => item.trim()).filter(Boolean);
    const settings: ChallengeSettings = { ...value, columns: Object.fromEntries(value.columns.filter(({ label }) => label.trim()).map(({ key, label }) => [key, label])),
      duels: value.duels.map((duel) => ({ ...duel, left: duel.leftFrom ? [] : split(duel.left), right: duel.rightFrom ? [] : split(duel.right) })),
      goalMetric: value.goalMetric || null, tieBreakers: split(value.tieBreakers), hiddenMetrics: split(value.hiddenMetrics), anonymousFrom: value.anonymousFrom || null,
      streak: value.streakLength ? { length: value.streakLength, points: value.streakPoints } : null };
    await this.run(async (id) => {
      this.settings.set(await firstValueFrom(this.api.saveSettings(id, settings)));
      this.uploading.controls.mode.setValue(settings.mode);
      this.preview.set(null);
      this.changed.emit();
      this.success.set('Configuración guardada. Se aplica al calcular la próxima publicación.');
    });
  }

  editMember(member: ChallengeMember): void { this.rosterForm.setValue({ code: member.code, fullName: member.fullName, zone: member.zone, active: member.active }); }

  async saveMember(): Promise<void> {
    if (this.rosterForm.invalid) return;
    await this.run(async (id) => {
      this.members.set(await firstValueFrom(this.api.saveMember(id, this.rosterForm.getRawValue())));
      this.rosterForm.reset();
      this.preview.set(null);
      this.changed.emit();
    });
  }

  selectFile(input: HTMLInputElement): void {
    this.file.set(input.files?.[0] ?? null);
    this.invalidatePreview();
    input.value = '';
  }

  invalidatePreview(): void {
    this.preview.set(null);
    this.errors.set([]);
    this.warnings.set([]);
  }

  async makePreview(): Promise<void> {
    const file = this.file();
    if (!file) return;
    await this.run(async (id) => {
      this.invalidatePreview();
      const input = { ...await this.excel.parseMaster(file), ...this.uploading.getRawValue() };
      const result = await firstValueFrom(this.api.preview(id, input));
      if (id === this.challenge().publicId) {
        this.preview.set({ result, input, file });
        this.warnings.set(result.warnings);
      }
    });
  }

  async publish(): Promise<void> {
    const preview = this.preview();
    if (!preview) return;
    await this.run(async (id) => {
      await firstValueFrom(this.api.publish(id, preview.input, preview.result.previewToken, preview.file));
      this.preview.set(null);
      this.file.set(null);
      this.changed.emit();
      this.success.set('Clasificación publicada. El portal ya muestra la actualización.');
    });
  }

  async downloadTemplate(): Promise<void> {
    const configuration = this.settings();
    if (!configuration) return;
    const headers = [...fixedHeaders, ...configuration.metrics.map(({ key }) => key)];
    const blob = await this.excel.masterTemplate(headers.map((key) => configuration.columns[key] ?? key));
    const url = URL.createObjectURL(blob);
    const link = this.document.createElement('a');
    link.href = url;
    link.download = 'plantilla-excel-maestro.xlsx';
    link.click();
    URL.revokeObjectURL(url);
  }

  private populate(settings: ChallengeSettings): void {
    this.metrics.clear(); this.rules.clear(); this.minimums.clear(); this.missions.clear(); this.badges.clear(); this.duels.clear(); this.columns.clear();
    for (const item of settings.metrics) this.metrics.push(this.metricGroup(item));
    for (const item of settings.rules) this.rules.push(this.ruleGroup(item));
    for (const item of settings.minimums) this.minimums.push(this.minimumGroup(item));
    for (const item of settings.missions) this.missions.push(this.missionGroup(item));
    for (const item of settings.badges) this.badges.push(this.badgeGroup(item));
    for (const item of settings.duels ?? []) this.duels.push(this.duelGroup(item));
    for (const [key, label] of Object.entries(settings.columns)) this.columns.push(this.columnGroup(key, label));
    this.refreshColumns();
    this.config.patchValue({ ...settings, tieBreakers: settings.tieBreakers.join(', '), hiddenMetrics: settings.hiddenMetrics.join(', '),
      goalMetric: settings.goalMetric ?? '', streakLength: settings.streak?.length ?? 0, streakPoints: settings.streak?.points ?? 0,
      anonymousFrom: settings.anonymousFrom ?? 0, tvLimit: settings.tvLimit ?? 10, columns: [], duels: [],
      showDuels: settings.showDuels ?? false, updateDays: settings.updateDays ?? [] });
    this.uploading.patchValue({ mode: settings.mode, allowDecreases: false });
  }

  private async run(action: (id: string) => Promise<void>): Promise<void> {
    if (this.pending()) return;
    this.error.set(null);
    this.success.set(null);
    this.pending.set(true);
    try {
      await action(this.challenge().publicId);
    } catch (error) {
      if (error instanceof HttpErrorResponse && error.status === 422 && Array.isArray(error.error?.errors)) {
        this.errors.set(error.error.errors);
        this.warnings.set(error.error.warnings ?? []);
      } else {
        this.error.set(apiErrorMessage(error, 'No se pudo completar la operación.'));
      }
    } finally {
      this.pending.set(false);
    }
  }
}
