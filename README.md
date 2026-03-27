# TestDevFront

Frontend Angular para gestion y seguimiento de envios maritimos y terrestres.

## Quick Start (5 minutos)

1. Levanta backend en `http://localhost:8081`.
2. Instala dependencias con `npm install`.
3. Levanta frontend con `npm run start` (o `ng serve --port 4201` si 4200 esta ocupado).
4. Entra a `/login` e inicia sesion.
5. Verifica que en Network las peticiones incluyan `Authorization: Bearer <token>`.

## 1. Objetivo del proyecto

La aplicacion permite:

- Autenticarse con JWT contra el backend.
- Consultar y administrar clientes, bodegas, puertos y envios.
- Visualizar un dashboard consolidado de seguimiento.

Backend esperado en local:

- Base URL: `http://localhost:8081`
- Login: `POST /auth/login`
- Respuesta de login:

```json
{
	"token": "eyJhbGciOiJIUzI1NiJ9....",
	"username": "admin",
	"expiresIn": 86400000
}
```

## 2. Stack tecnico

- Angular 21 (standalone components)
- TypeScript
- RxJS
- Bootstrap 5
- Vitest (tests)

## 3. Ejecutar el proyecto

Instalar dependencias:

```bash
npm install
```

Modo desarrollo:

```bash
npm run start
```

Si el puerto 4200 ya esta en uso:

```bash
ng serve --port 4201
```

Build:

```bash
npm run build
```

Tests:

```bash
npm run test
```

## 4. Estructura funcional

Carpetas principales:

- `src/app/componets/`: componentes de UI (listas, formularios, dashboard, navbar, login).
- `src/app/service/`: servicios HTTP por modulo.
- `src/app/guard/`: guardas de rutas autenticadas.
- `src/app/interceptor/`: interceptor JWT para adjuntar token en cada request.
- `src/app/app.routes.ts`: definicion de rutas.
- `src/app/app.config.ts`: configuracion global (router + http + interceptor).

## 5. Flujo de autenticacion JWT

### Inicio de sesion

1. El usuario envia `username` y `password` desde el componente login.
2. `AuthService` consume `POST /auth/login`.
3. Si es exitoso:
	 - Guarda `authToken` en `localStorage`.
	 - Guarda `username` en `localStorage`.
	 - Actualiza estado reactivo de sesion.

### Uso del token

`AuthInterceptor` toma el token guardado y agrega el header a cada request:

```http
Authorization: Bearer <token>
```

### Proteccion de rutas

`AuthGuard` bloquea navegacion si no hay sesion y redirige a `/login`.

## 6. Mapa de rutas

Ruta publica:

- `/login`

Rutas protegidas con `AuthGuard`:

- `/dashboard`
- `/clientes`
- `/add-client`
- `/edit-client/:id`
- `/bodegas`
- `/bodegas/new`
- `/bodegas/edit/:id`
- `/puertos`
- `/puertos/new`
- `/puertos/edit/:id`
- `/maritime_shipments`
- `/maritime_shipments/new`
- `/maritime_shipments/edit/:id`
- `/terrestrial_shipments`
- `/terrestrial_shipments/new`
- `/terrestrial_shipments/edit/:id`

## 7. Modulos de negocio

### Clientes

- Lista, creacion, edicion y eliminacion.
- Servicio: `client.service.ts`.

### Bodegas

- Lista, creacion, edicion y eliminacion.
- Servicio: `bodega.service.ts`.

### Puertos

- Lista, creacion, edicion y eliminacion.
- Servicio: `port.service.ts`.

### Envios maritimos

- Lista, creacion, edicion y eliminacion.
- Servicio: `maritime-shipment.service.ts`.

### Envios terrestres

- Lista, creacion, edicion y eliminacion.
- Servicio: `terrestrial-shipment.service.ts`.

### Dashboard

- Une envios maritimos y terrestres.
- Calcula metricas (total, entregados, retrasados, cumplimiento).
- Permite filtros por tipo, estado y busqueda.

## 8. Comportamientos clave de UI

- Navbar lateral con accesos a dashboard y modulos.
- Boton de cierre de sesion visible cuando el usuario esta autenticado.
- Manejo de estados de carga y error en listas/dashboard.

## 9. Guia de troubleshooting rapido

### Error 401 o 403 en listas/dashboard

Checklist:

1. Verificar que backend este arriba en `http://localhost:8081`.
2. Confirmar login exitoso y token en `localStorage` (`authToken`).
3. Revisar en Network que salga header `Authorization: Bearer ...`.
4. Validar que el usuario tenga permisos/roles para esos endpoints.

### No abre en 4200

- Ejecutar en otro puerto:

```bash
ng serve --port 4201
```

### Redirige a login constantemente

- Token ausente o invalido.
- Limpiar almacenamiento local y reloguear.

## 10. Recomendaciones para mantenimiento futuro

- Centralizar el `apiUrl` en una configuracion por ambiente (`environment.ts`).
- Agregar manejo global de 401/403 en interceptor (logout automatico o redireccion).
- Definir tipos DTO por endpoint para desacoplar modelos de UI.
- Cubrir AuthService, AuthGuard e interceptor con pruebas unitarias.
- Documentar cambios de endpoints en este README cada vez que cambie el backend.
