import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  LucideCheck,
} from '@lucide/angular';
import { LandingHeader } from '@components/landing-header/landing-header';
import { LandingFooter } from '@components/landing-footer/landing-footer';
import { LandingHero } from './landing-hero/landing-hero';
import { LandingIntro } from './landing-intro/landing-intro';
import { LandingSubpages } from './landing-subpages/landing-subpages';
import { LandingLanguage } from '../../services/landing-language.service';
import { LandingTheme } from '../../services/landing-theme.service';
import { HOME_GOALS } from './home-goals';
import { LandingBlog } from './landing-blog/landing-blog';

@Component({
  selector: 'app-landing',
  imports: [
    LandingHeader,
    LandingFooter,
    LandingHero,
    LandingIntro,
    LandingSubpages,
    LandingBlog,
    RouterLink,
    CurrencyPipe,
    LucideCheck,
  ],
  templateUrl: './landing.html',
  styleUrl: './landing.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[attr.lang]': 'i18n.language()', '[attr.data-theme]': 'theme.dark() ? "dark" : null' },
})
export class Landing {
  readonly i18n = inject(LandingLanguage);
  readonly theme = inject(LandingTheme);
  readonly page = inject(ActivatedRoute).snapshot.data['landingPage'] ?? 'home';
  readonly selectedGoal = signal(0);
  readonly reps = signal(15);
  readonly average = signal(12000);
  readonly uplift = signal(5);
  readonly monthlyImpact = computed(() => (this.reps() * this.average() * this.uplift()) / 100);
  readonly comparison = [
    [['Quién lo diseña', 'Who designs it'], ['El manager o RR. HH.', 'The manager or HR'], ['Tu equipo, configurando la herramienta', 'Your team, configuring the tool'], ['Nosotros, a medida de tus KPIs', 'Us, tailored to your KPIs']],
    [['Para quién', "Who it’s for"], ['Toda la plantilla comercial por igual', 'The whole sales force, all the same'], ['Toda la empresa: RR. HH., onboarding, formación', 'The whole company: HR, onboarding, training'], ['Solo equipos comerciales', 'Sales teams only']],
    [['Tu tiempo', 'Your time'], ['Cálculos y seguimiento manual', 'Manual calculations and tracking'], ['Aprender, configurar y mantener la plataforma', 'Learning, configuring and maintaining the platform'], ['Nos envías los datos y validas propuestas', 'You send us the data and approve proposals']],
    [['Motivación diaria', 'Day-to-day motivation'], ['Se nota a fin de mes', 'Felt at month-end'], ['Depende de cómo la configures', 'Depends on how you set it up'], ['Retos, logros y progreso visibles cada semana', 'Challenges, achievements and progress visible every week']],
    [['Seguimiento', 'Follow-up'], ['Informe mensual', 'Monthly report'], ['Dashboard en autoservicio', 'Self-service dashboard'], ['Seguimiento semanal, ajustes e informe final', 'Weekly follow-up, adjustments and final report']],
    [['Cómo empezar', 'How to start'], ['Cambiar el plan de comisiones', 'Change the commission plan'], ['Licencia y periodo de implantación', 'License and rollout period'], ['Piloto de 30 días, gratis para fundadores', '30-day pilot, free for founders']],
  ];
  readonly goals = HOME_GOALS;
  readonly faqs = [
    {
      q: ['¿Ludus Sales es un software?', 'Is Ludus Sales software?'],
      a: [
        'No. Es un servicio hecho para ti. Diseñamos la competición, la ponemos en marcha y la seguimos contigo. Tu equipo accede a un portal online para ver retos, ranking y premios, pero tú no tienes que configurar nada.',
        'No. It is a service built for you. We design, launch and support your competition. Your team can access challenges, rankings and rewards online, with nothing for you to configure.',
      ],
    },
    {
      q: ['¿Para qué empresas es?', 'Which companies is it for?'],
      a: [
        'Para empresas con un equipo comercial, de cualquier sector, que quieran más constancia y más resultados. Funciona especialmente bien a partir de unos 8 comerciales.',
        'For companies in any sector that want more consistency and better results from their sales team. It works especially well with around eight or more salespeople.',
      ],
    },
    {
      q: ['¿Qué necesitáis de nosotros?', 'What do you need from us?'],
      a: [
        'El tamaño del equipo, los objetivos que queréis impulsar y los datos de venta (Excel, Google Sheets o una exportación de vuestro CRM) con la frecuencia que acordemos. Además, validar las propuestas y comunicar la iniciativa al equipo.',
        'Your team size, goals and sales data (Excel, Google Sheets or a CRM export) at the agreed frequency. We also need you to approve the proposals and tell your team about the initiative.',
      ],
    },
    {
      q: ['¿Cuánto cuesta?', 'How much does it cost?'],
      a: [
        'Para las empresas del Programa Fundadores, el piloto de 30 días es gratuito a cambio de poder publicar el caso de éxito. Después, cada propuesta se calcula según el tamaño del equipo y los objetivos, y te la damos cerrada antes de empezar.',
        'For Founders Program companies, the 30-day pilot is free in exchange for permission to publish the success story. Later proposals are priced by team size and goals, with a fixed quote before you start.',
      ],
    },
    {
      q: ['¿Y si el ranking desmotiva a los últimos?', 'What if a ranking discourages people?'],
      a: [
        'Lo diseñamos para que no pase: ligas o grupos por nivel, rankings semanales que se reinician, logros por mejora personal y puntos por actividad, no solo por cierres.',
        'We design against that: leagues or groups by level, weekly rankings that reset, personal improvement achievements and points for activity, not just closed deals.',
      ],
    },
    {
      q: ['¿Cuánto tarda en arrancar?', 'How long does it take to launch?'],
      a: [
        'Unas 3 semanas desde la primera reunión: análisis en la semana 0, diseño y preparación en las semanas 1 y 2, y lanzamiento en la semana 3.',
        'About 3 weeks from the first meeting: analysis in week 0, design and preparation in weeks 1 and 2, and launch in week 3.',
      ],
    },
  ];
  rangeValue(event: Event): number {
    return Number((event.target as HTMLInputElement).value);
  }

  onGoalKey(event: KeyboardEvent): void {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
    event.preventDefault();
    const next = (this.selectedGoal() + (event.key === 'ArrowRight' ? 1 : this.goals.length - 1)) % this.goals.length;
    this.selectedGoal.set(next);
    (event.currentTarget as HTMLElement).querySelectorAll<HTMLButtonElement>('button')[next]?.focus();
  }
}
