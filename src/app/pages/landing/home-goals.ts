type Text = [string, string];
export type HomeGoal = { label: Text; title: Text; audience: Text; mechanic: Text; outcome: Text; points: Text[] };

export const HOME_GOALS: HomeGoal[] = [
  {
    label: ['Captar nuevos clientes', 'Win new clients'],
    title: ['Más clientes nuevos cada semana, no solo a final de mes.', 'More new clients every week, not just at the end of the month.'],
    audience: ['Equipos que viven de la cartera actual y necesitan abrir mercado.', 'Teams that rely on their existing clients and need to open new markets.'],
    mechanic: ['El nuevo cliente vale el doble que una venta repetida y cada semana hay un reto de captación con bonificación.', 'A new client is worth twice as much as a repeat sale, with a weekly prospecting challenge and bonus.'],
    outcome: ['Más visitas, más primeras ventas y una cartera menos dependiente.', 'More visits, more first sales and a more diverse client base.'],
    points: [['+200 nuevo cliente', '+200 new client'], ['+50 primera reunión', '+50 first meeting'], ['+300 reto: 5 clientes nuevos', '+300 challenge: 5 new clients']],
  },
  {
    label: ['Impulsar un producto', 'Promote a product'],
    title: ['Pon el foco del equipo en el producto que más te interesa vender.', 'Focus the team on the product you most want to sell.'],
    audience: ['Empresas con un lanzamiento, un producto de más margen o stock que rotar.', 'Companies launching a product, promoting a higher-margin product or moving stock.'],
    mechanic: ['Multiplicamos los puntos del producto estratégico y añadimos logros específicos por vender el primero, el quinto o el décimo.', 'We multiply points for the strategic product and add achievements for the first, fifth and tenth sale.'],
    outcome: ['El producto pasa a estar en todas las conversaciones del equipo.', 'The product becomes part of every team conversation.'],
    points: [['x2 producto estratégico', 'x2 strategic product'], ['+150 primera venta del producto', '+150 first product sale'], ['+250 reto semanal del producto', '+250 weekly product challenge']],
  },
  {
    label: ['Subir el ticket medio', 'Increase average deal size'],
    title: ['Que cada cliente compre un poco más.', 'Help each client buy a little more.'],
    audience: ['Equipos con buena captación y margen para crecer en cada cliente.', 'Teams with strong acquisition and room to grow each client account.'],
    mechanic: ['Puntuamos el upselling y la venta cruzada, y premiamos superar el ticket medio propio de cada comercial.', 'We score upselling and cross-selling and reward reps for exceeding their own average deal size.'],
    outcome: ['Más facturación con los mismos clientes.', 'More revenue from the same clients.'],
    points: [['+75 upselling', '+75 upselling'], ['+100 venta cruzada', '+100 cross-selling'], ['+200 superar tu ticket medio', '+200 beat your average deal size']],
  },
  {
    label: ['Constancia todo el mes', 'Consistency all month'],
    title: ['Ritmo estable en vez de picos a fin de mes.', 'Steady momentum instead of end-of-month spikes.'],
    audience: ['Equipos con meses irregulares y cierres a la carrera.', 'Teams with uneven months and rushed closes.'],
    mechanic: ['Rankings semanales que se reinician, rachas de actividad y niveles que se desbloquean semana a semana.', 'Weekly leaderboards that reset, activity streaks and levels unlocked week by week.'],
    outcome: ['La actividad se reparte y el cierre de mes deja de ser un sprint.', 'Activity is spread out and the end of the month stops being a sprint.'],
    points: [['+25 llamada o visita registrada', '+25 logged call or visit'], ['+150 racha de 5 días activo', '+150 5-day activity streak'], ['+300 objetivo semanal', '+300 weekly target']],
  },
  {
    label: ['Activar a todo el equipo', 'Activate the whole team'],
    title: ['Que la media del equipo se acerque a los mejores.', 'Bring the team average closer to the top performers.'],
    audience: ['Equipos con mucha diferencia entre los top y el resto.', 'Teams with a large gap between top performers and everyone else.'],
    mechanic: ['Ligas por nivel, competición por equipos y logros por mejora personal, para que todos tengan algo por lo que jugar.', 'Leagues by level, team competitions and personal improvement achievements give everyone something to play for.'],
    outcome: ['Más personas puntuando cada semana y menos dependencia de 2 o 3 estrellas.', 'More people scoring each week and less reliance on two or three stars.'],
    points: [['Ligas por nivel', 'Leagues by level'], ['+200 mejorar tu récord', '+200 beat your record'], ['Equipos premio colectivo', 'Teams collective reward']],
  },
];
