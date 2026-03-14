# Las Tardes · Web de tapicería en Node.js

Proyecto completo y funcional para una tapicería profesional.

## Stack
- Node.js
- Express.js
- EJS
- CSS + JavaScript vanilla
- JSON persistente (`data/db.json`)
- Panel admin con sesiones protegidas

## Funcionalidades
- Landing profesional con múltiples secciones
- Tabla de presupuestos editable
- Calendario de turnos con horarios disponibles reales
- Persistencia real de turnos, reseñas, precios y configuración en archivo JSON
- Envío automático a WhatsApp al confirmar turno
- Mapa embebido + botón a Google Maps
- Reseñas editables desde admin
- Gestión de disponibilidad semanal y bloqueo de fechas
- Dashboard de administración
- Notificaciones visuales estilo SaaS, sin `alert()`

## Credenciales iniciales
- Usuario: `admin`
- Contraseña: `admin123`

Cambiá esas credenciales en una siguiente mejora antes de publicar en producción.

## Instalación
```bash
npm install
npm run dev
```

O para ejecutar normal:
```bash
npm install
npm start
```

Abrir en:
```bash
http://localhost:3000
```

## Rutas principales
- Sitio público: `/`
- Login admin: `/admin/login`
- Dashboard admin: `/admin`

## Estructura
```bash
las-tardes/
├── data/
│   └── db.json
├── middleware/
│   └── auth.js
├── public/
│   ├── css/
│   │   ├── admin.css
│   │   └── style.css
│   └── js/
│       ├── main.js
│       └── toast.js
├── routes/
│   ├── admin.js
│   ├── api.js
│   └── public.js
├── views/
│   ├── partials/
│   │   ├── footer.ejs
│   │   └── head.ejs
│   ├── 404.ejs
│   ├── admin-dashboard.ejs
│   ├── admin-login.ejs
│   └── index.ejs
├── db.js
├── package.json
├── README.md
└── server.js
```

## Cómo funciona el sistema de turnos
1. El cliente selecciona fecha.
2. El frontend consulta `/api/availability?date=YYYY-MM-DD`.
3. El backend revisa:
   - si la fecha está bloqueada
   - si ese día está habilitado
   - qué horarios ya están ocupados
4. Solo muestra horarios libres.
5. Al confirmar, guarda el turno en SQLite.
6. Devuelve el link de WhatsApp con el mensaje armado.
7. El frontend abre WhatsApp automáticamente.

## Ideas recomendadas para una siguiente versión
- cambio de contraseña desde el admin
- carga de galería de trabajos
- subir imágenes reales del taller
- exportar turnos a Excel/PDF
- confirmaciones automáticas por mail
- roles de usuario
- deploy en Render, Railway o VPS propio
