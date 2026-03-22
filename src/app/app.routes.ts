//Rutas de la aplicacion (definir las rutas para los componentes y cual se muestra en cada ruta)
import { Routes } from '@angular/router';
import { ClientList } from './componets/client-list/client-list';
import { ClientForm } from './componets/client-form/client-form';

export const routes: Routes = [
	{ path: '', component: ClientList },
	{ path: 'add-client', component: ClientForm },
	{ path: 'edit-client/:id', component: ClientForm },
];
