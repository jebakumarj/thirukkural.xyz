import { RenderMode, ServerRoute } from '@angular/ssr';
import { ADHIKARAMS, IYALS, KURALS, PAALS } from './core/corpus';

const ids = (rows: readonly { id: number }[]) => rows.map((row) => ({ id: String(row.id) }));

/**
 * Everything is prerendered to static HTML at build time: 1,330 kural pages,
 * 133 adhikarams, 13 iyals, 3 paals and the standalone pages. Nginx serves the
 * result directly — there is no Node process in production.
 */
export const serverRoutes: ServerRoute[] = [
  {
    path: 'kural/:id',
    renderMode: RenderMode.Prerender,
    getPrerenderParams: async () => ids(KURALS),
  },
  {
    path: 'adhikaram/:id',
    renderMode: RenderMode.Prerender,
    getPrerenderParams: async () => ids(ADHIKARAMS),
  },
  {
    path: 'iyal/:id',
    renderMode: RenderMode.Prerender,
    getPrerenderParams: async () => ids(IYALS),
  },
  {
    path: 'paal/:id',
    renderMode: RenderMode.Prerender,
    getPrerenderParams: async () => ids(PAALS),
  },
  {
    path: '**',
    renderMode: RenderMode.Prerender,
  },
];
