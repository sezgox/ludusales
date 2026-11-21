import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { LandingLanguage } from '../../../services/landing-language.service';

@Component({
  selector: 'app-landing-intro',
  templateUrl: './landing-intro.html',
  styleUrl: './landing-intro.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LandingIntro {
  readonly i18n = inject(LandingLanguage);
  readonly pains = [
    ['Todo llega a fin de mes', 'Everything lands at month-end', 'Semanas flojas y un cierre a la carrera en los últimos días.', 'Slow weeks and a last-minute rush to close.'],
    ['Dependes de 2 o 3 estrellas', 'You rely on 2 or 3 stars', 'Unos pocos sostienen la facturación y el resto deja de compararse.', 'A few carry the revenue and the rest stop measuring themselves against them.'],
    ['Las comisiones ya no mueven', 'Commissions no longer move the needle', 'Premian el resultado final, no los hábitos que llevan a él.', 'They reward the final result, not the habits that lead to it.'],
    ['Progreso invisible', 'Invisible progress', 'Nadie sabe cómo va hasta que llega el informe mensual.', "Nobody knows how they're doing until the monthly report."],
    ['El manager es el único motor', 'The manager is the only engine', 'Si él baja el ritmo, el equipo entero baja con él.', 'If they slow down, the whole team slows down.'],
  ];
}
