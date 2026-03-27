//Rutas de la aplicacion (definir las rutas para los componentes y cual se muestra en cada ruta)
import { Routes } from '@angular/router';
import { ClientList } from './componets/client-list/client-list';
import { ClientForm } from './componets/client-form/client-form';
import { BodegaList } from './componets/bodega-list/bodega-list';
import { BodegaForm } from './componets/bodega-form/bodega-form';
import { PortList } from './componets/port-list/port-list';
import { PortForm } from './componets/port-form/port-form';
import { MaritimeShipmentList } from './componets/maritime-shipment-list/maritime-shipment-list';
import { MaritimeShipmentForm } from './componets/maritime-shipment-form/maritime-shipment-form';
import { TerrestrialShipmentList } from './componets/terrestrial-shipment-list/terrestrial-shipment-list';
import { TerrestrialShipmentForm } from './componets/terrestrial-shipment-form/terrestrial-shipment-form';
import { Dashboard } from './componets/dashboard/dashboard';
import { Login } from './componets/login/login';
import { AuthGuard } from './guard/auth.guard';

export const routes: Routes = [
	// Ruta publica de autenticacion.
	{ path: 'login', component: Login },
	// Redireccion inicial al dashboard.
	{ path: '', redirectTo: 'dashboard', pathMatch: 'full' },
	// Rutas protegidas por autenticacion JWT.
	{ path: 'dashboard', component: Dashboard, canActivate: [AuthGuard] },
	{ path: 'clientes', component: ClientList, canActivate: [AuthGuard] },
	{ path: 'add-client', component: ClientForm, canActivate: [AuthGuard] },
	{ path: 'edit-client/:id', component: ClientForm, canActivate: [AuthGuard] },
	{ path: 'bodegas', component: BodegaList, canActivate: [AuthGuard] },
	{ path: 'bodegas/new', component: BodegaForm, canActivate: [AuthGuard] },
	{ path: 'bodegas/edit/:id', component: BodegaForm, canActivate: [AuthGuard] },
	{ path: 'puertos', component: PortList, canActivate: [AuthGuard] },
	{ path: 'puertos/new', component: PortForm, canActivate: [AuthGuard] },
	{ path: 'puertos/edit/:id', component: PortForm, canActivate: [AuthGuard] },
	{ path: 'maritime_shipments', component: MaritimeShipmentList, canActivate: [AuthGuard] },
	{ path: 'maritime_shipments/new', component: MaritimeShipmentForm, canActivate: [AuthGuard] },
	{ path: 'maritime_shipments/edit/:id', component: MaritimeShipmentForm, canActivate: [AuthGuard] },
	{ path: 'terrestrial_shipments', component: TerrestrialShipmentList, canActivate: [AuthGuard] },
	{ path: 'terrestrial_shipments/new', component: TerrestrialShipmentForm, canActivate: [AuthGuard] },
	{ path: 'terrestrial_shipments/edit/:id', component: TerrestrialShipmentForm, canActivate: [AuthGuard] },
	// Fallback global.
	{ path: '**', redirectTo: 'dashboard' },
];
