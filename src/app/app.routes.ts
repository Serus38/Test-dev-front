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

export const routes: Routes = [
	{ path: '', component: ClientList },
	{ path: 'add-client', component: ClientForm },
	{ path: 'edit-client/:id', component: ClientForm },
	{ path: 'bodegas', component: BodegaList },
	{ path: 'bodegas/new', component: BodegaForm },
	{ path: 'bodegas/edit/:id', component: BodegaForm },
	{ path: 'puertos', component: PortList },
	{ path: 'puertos/new', component: PortForm },
	{ path: 'puertos/edit/:id', component: PortForm },
	{ path: 'maritime_shipments', component: MaritimeShipmentList },
	{ path: 'maritime_shipments/new', component: MaritimeShipmentForm },
	{ path: 'maritime_shipments/edit/:id', component: MaritimeShipmentForm },
	{ path: 'terrestrial_shipments', component: TerrestrialShipmentList },
	{ path: 'terrestrial_shipments/new', component: TerrestrialShipmentForm },
	{ path: 'terrestrial_shipments/edit/:id', component: TerrestrialShipmentForm },
];
