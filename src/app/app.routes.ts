import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/home').then((m) => m.HomePage),
  },
  {
    path: 'kural/:id',
    loadComponent: () => import('./pages/kural').then((m) => m.KuralPage),
  },
  {
    path: 'kural',
    loadComponent: () => import('./pages/kural-browse').then((m) => m.KuralBrowsePage),
  },
  {
    path: 'adhikaram',
    loadComponent: () => import('./pages/adhikaram-list').then((m) => m.AdhikaramListPage),
  },
  {
    path: 'adhikaram/:id',
    loadComponent: () => import('./pages/adhikaram').then((m) => m.AdhikaramPage),
  },
  {
    path: 'iyal',
    loadComponent: () => import('./pages/iyal-list').then((m) => m.IyalListPage),
  },
  {
    path: 'iyal/:id',
    loadComponent: () => import('./pages/iyal').then((m) => m.IyalPage),
  },
  {
    path: 'paal',
    loadComponent: () => import('./pages/paal-list').then((m) => m.PaalListPage),
  },
  {
    path: 'paal/:id',
    loadComponent: () => import('./pages/paal').then((m) => m.PaalPage),
  },
  {
    path: 'search',
    loadComponent: () => import('./pages/search').then((m) => m.SearchPage),
  },
  {
    path: 'favourites',
    loadComponent: () => import('./pages/favourites').then((m) => m.FavouritesPage),
  },
  {
    path: 'help',
    loadComponent: () => import('./pages/help').then((m) => m.HelpPage),
  },
  {
    path: 'about',
    loadComponent: () => import('./pages/about').then((m) => m.AboutPage),
  },
  {
    path: '**',
    loadComponent: () => import('./pages/not-found').then((m) => m.NotFoundPage),
  },
];
