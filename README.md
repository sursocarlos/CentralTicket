# CentralTicket 🎫

CentralTicket es una aplicación web para la gestión de incidencias internas en empresas. Registra, asigna y hace seguimiento de tickets técnicos o de mantenimiento desde el navegador, sin instalar nada.

## Acerca del proyecto ❓

En muchas empresas la gestión de incidencias acaba siendo un caos: correos que se pierden, llamadas que nadie registra, problemas que se repiten porque nadie documentó la solución. CentralTicket nace para resolver exactamente eso, centralizando todo en un único sistema trazable y ordenado.

La idea surge de mi experiencia trabajando como administrador de sistemas, donde no teníamos ninguna herramienta específica para esto. Así que decidí construirla.

## Acceso total desde cualquier dispositivo 📱💻
CentralTicket ha sido desarrollado bajo un enfoque completamente responsive. Esto significa que el sistema se adapta automáticamente a cualquier tamaño de pantalla, permitiendo una gestión eficiente tanto para técnicos que están en movilidad con su smartphone o tablet, como para administradores que trabajan desde su ordenador de escritorio.

## Funcionalidades ⚡

* **Tickets numerados**: cada incidencia se registra con identificador único, categoría, prioridad y responsable asignado.
* **Roles de usuario**: tres niveles con permisos diferenciados.
  * *Empleado*: crea tickets y consulta el estado de los suyos.
  * *Técnico*: gestiona incidencias y actualiza estados.
  * *Administrador*: gestiona usuarios, categorías y configuración general.
* **Historial de cambios**: trazabilidad completa de cada ticket con todas las actuaciones registradas.
* **Comentarios internos**: comunicación contextual dentro de cada incidencia.
* **Panel estadístico**: métricas sobre incidencias en proceso, abiertas y resueltas.

## Tecnologías utilizadas 🛠️

**Frontend**
* React + Vite: interfaz de usuario con componentes reutilizables.
* React Router: navegación entre vistas.
* Axios: comunicación con la API.
* CSS3: diseño responsive.

**Backend**
* Node.js + Express: servidor y API REST.
* JWT: autenticación y gestión de sesiones sin estado.
* bcrypt: cifrado de contraseñas.

**Base de datos**
* PostgreSQL: base de datos relacional.
* Sequelize (ORM): modelado y consultas.

**Despliegue**
* Vercel → Frontend
* Render → Backend
* Render / Supabase → Base de datos

## Seguridad 🔒

* Contraseñas cifradas con bcrypt.
* Sesiones mediante JWT (sin estado en servidor).
* Validación de datos en cliente y servidor.
* Protección frente a inyección SQL y XSS.
* CORS restringido al dominio del frontend.

## Roadmap 🚀

El proyecto está pensado desde el principio para escalar hacia un modelo SaaS multitenant. Algunas de las cosas que tengo en mente para próximas versiones:

- [ ] Soporte multitenant (una instancia, múltiples empresas)
- [ ] Notificaciones por email al cambiar el estado de un ticket
- [ ] Exportación de reportes en PDF/CSV
- [ ] Posibilidad de adjuntar archivos en las incidencias
- [ ] Aplicación móvil con React Native

## Autor 👤

Carlos Flores Hernández

🔗 [LinkedIn](https://www.linkedin.com/in/carlos-flores-hern%C3%A1ndez-0a63862b1/) 🔗 [Web](https://carlos-flores-cv.vercel.app/)
