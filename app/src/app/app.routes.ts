import { Routes } from '@angular/router';
import { CatalogComponent } from './features/catalog/catalog.component';
import { GearDetailComponent } from './features/gear-detail/gear-detail.component';
import { HomeComponent } from './features/home/home.component';

export const routes: Routes = [
	{ path: '', component: HomeComponent },
	{ path: 'catalog', component: CatalogComponent },
	{ path: 'gear/:slug', component: GearDetailComponent },
	{ path: '**', redirectTo: '' }
];
