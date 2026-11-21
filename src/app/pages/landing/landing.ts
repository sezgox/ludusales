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

@Component({
  selector: 'app-landing',
  imports: [
    LandingHeader,
    LandingFooter,
    LandingHero,
    LandingIntro,
    LandingSubpages,
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
  readonly goals = [
    {
      es: 'Captar nuevos clientes',
      en: 'Win new customers',
      descriptionEs: 'Más clientes nuevos cada semana, no solo a final de mes.',
      descriptionEn: 'More new customers every week, not just at the end of the month.',
      detailEs: 'Los nuevos clientes suman más puntos y cada semana hay un reto de captación.',
      detailEn: 'New customers earn more points and each week brings a prospecting challenge.',
    },
    {
      es: 'Impulsar un producto',
      en: 'Promote a product',
      descriptionEs: 'Pon el foco en los productos que quieres impulsar.',
      descriptionEn: 'Focus on the products you want to promote.',
      detailEs: 'Premiamos las ventas de productos estratégicos y el progreso del equipo.',
      detailEn: 'Reward strategic product sales and team progress.',
    },
    {
      es: 'Subir el ticket medio',
      en: 'Increase average order value',
      descriptionEs: 'Haz que cada oportunidad cuente más.',
      descriptionEn: 'Make every opportunity count for more.',
      detailEs: 'Recompensamos el valor añadido y las ventas complementarias.',
      detailEn: 'Reward added value and complementary sales.',
    },
    {
      es: 'Constancia todo el mes',
      en: 'Build consistency',
      descriptionEs: 'Mantén el ritmo durante todo el mes.',
      descriptionEn: 'Keep momentum throughout the month.',
      detailEs: 'Los retos semanales reconocen los hábitos que llevan al resultado.',
      detailEn: 'Weekly challenges recognise the habits that lead to results.',
    },
    {
      es: 'Activar a todo el equipo',
      en: 'Engage the whole team',
      descriptionEs: 'Cada persona tiene una forma de avanzar.',
      descriptionEn: 'Everyone has a way to progress.',
      detailEs: 'Combinamos objetivos individuales, logros y retos de equipo.',
      detailEn: 'Combine individual goals, achievements and team challenges.',
    },
  ];
  readonly faqs = [
    {
      q: ['¿Ludus Sales es un software?', 'Is Ludus Sales software?'],
      a: [
        'No. Es un servicio hecho para ti. Diseñamos la competición, la ponemos en marcha y la seguimos contigo.',
        'No. It is a service built for you. We design, launch and support your competition.',
      ],
    },
    {
      q: ['¿Para qué empresas es?', 'Which companies is it for?'],
      a: [
        'Para empresas que quieren motivar a su equipo comercial y medir sus resultados.',
        'For companies that want to motivate their sales team and measure results.',
      ],
    },
    {
      q: ['¿Qué necesitáis de nosotros?', 'What do you need from us?'],
      a: [
        'Datos de ventas con regularidad, una persona de contacto y la validación de las propuestas.',
        'Regular sales data, a point of contact and approval of the proposals.',
      ],
    },
    {
      q: ['¿Cuánto cuesta?', 'How much does it cost?'],
      a: [
        'El piloto es gratuito para empresas fundadoras. Los planes posteriores se preparan a medida.',
        'The pilot is free for founding companies. Subsequent plans are tailored to your needs.',
      ],
    },
    {
      q: ['¿Y si el ranking desmotiva a los últimos?', 'What if a ranking discourages people?'],
      a: [
        'Diseñamos mecánicas y reconocimientos para que todos tengan oportunidades de progresar.',
        'We design mechanics and recognition so everyone has opportunities to progress.',
      ],
    },
    {
      q: ['¿Cuánto tarda en arrancar?', 'How long does it take to launch?'],
      a: [
        'Del análisis al lanzamiento, aproximadamente tres semanas.',
        'Approximately three weeks from analysis to launch.',
      ],
    },
  ];
  rangeValue(event: Event): number {
    return Number((event.target as HTMLInputElement).value);
  }
}
