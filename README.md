# 🏨 HoteIA - Sistema Inteligente de Gestión Hotelera

HoteIA es una plataforma web profesional diseñada como Trabajo de Fin de Grado (TFG) para el ciclo de Desarrollo de Aplicaciones Web (DAW). Combina una arquitectura robusta, un motor de reservas real y un asistente de Inteligencia Artificial.

---

## 🚀 Guía Rápida de Configuración (¡IMPORTANTE!)

Para que la aplicación funcione correctamente, **DEBES** configurar las siguientes claves externas. Si no lo haces, algunas funciones como el pago o el login con Google fallarán.

### 1. Backend (Archivo `.env`)
Ubicación: `backend/.env`

| Variable | Qué poner aquí | Por qué es necesario |
| :--- | :--- | :--- |
| `DB_PASSWORD` | Tu contraseña de MySQL | Para conectar con la base de datos local. |
| `JWT_SECRET` | Una frase aleatoria larga | Para firmar los tokens de sesión de usuario de forma segura. |
| `GOOGLE_CLIENT_ID` | Tu ID de cliente de Google Cloud | Para que el botón de "Login con Google" funcione. |
| `STRIPE_SECRET_KEY` | Tu `sk_test_...` de Stripe | Para que el backend pueda crear sesiones de pago reales. |

### 2. Frontend (Configuración de Claves)
Debes cambiar estas claves en el código del frontend:

*   **Google OAuth**: En `frontend/src/main.jsx`, cambia `const GOOGLE_CLIENT_ID = "..."` por tu ID de cliente.
*   **Stripe**: En `frontend/src/pages/Search.jsx`, cambia `loadStripe('pk_test_...')` por tu clave pública de Stripe.

---

## 🛠️ Cómo arrancar el proyecto

### Requisitos previos
*   Node.js instalado.
*   MySQL (XAMPP, WAMP o instalación directa).
*   Importar el archivo `database.sql` en tu MySQL.

### Paso 1: Levantar el Backend
1.  Abre una terminal en la carpeta `backend`.
2.  Ejecuta `npm install`.
3.  Crea/edita tu archivo `.env` siguiendo el punto anterior.
4.  Ejecuta `npm start`. El servidor correrá en `http://localhost:5000`.

### Paso 2: Levantar el Frontend
1.  Abre una terminal en la carpeta `frontend`.
2.  Ejecuta `npm install`.
3.  Ejecuta `npm run dev`. La web se abrirá en `http://localhost:5173`.

---

## 🧠 Cómo funciona la aplicación

### 1. Motor de Reservas (El corazón técnico)
La lógica reside en `backend/controllers/booking.controller.js` y `backend/controllers/payment.controller.js`.
*   **Prevención de Overbooking**: Antes de cada reserva, el sistema hace una consulta SQL compleja para verificar que ninguna reserva existente choque con las fechas seleccionadas.
*   **Cálculo de Precio**: El backend calcula el total basándose en las noches reales entre entrada y salida.

### 2. Asistente de IA (Chat Inteligente)
Ubicado en `backend/services/ai.service.js`.
*   Funciona mediante un widget flotante en el frontend.
*   Guarda el historial en la base de datos vinculado a una `sessionId`, permitiendo que la conversación no se pierda al navegar.

### 3. Roles y Seguridad
*   **Cliente**: Puede buscar, reservar (vía Stripe) y ver su historial en el Dashboard.
*   **Admin**: Tiene acceso a `/admin`. Puede ver gráficas de ingresos (Chart.js), gestionar el inventario de habitaciones (CRUD completo) y ver todas las reservas del hotel.

### 4. Flujo de Pago con Stripe
1.  El usuario busca una habitación y pulsa "Reservar".
2.  El backend crea una "Checkout Session" en los servidores de Stripe.
3.  El frontend redirige al usuario a la pasarela segura de Stripe.
4.  Tras pagar, Stripe devuelve al usuario a `/payment-success`.
5.  El frontend avisa al backend para confirmar el pago y registrar la reserva definitivamente.

---

## 📁 Estructura del Proyecto

*   `/backend`: API REST construida con Express.
    *   `/models`: Consultas SQL directas.
    *   `/routes`: Definición de endpoints.
    *   `/controllers`: Lógica de negocio.
    *   `/middlewares`: Protección de rutas y validación de JWT.
*   `/frontend`: SPA construida con React + Vite.
    *   `/context`: Estado global de autenticación.
    *   `/pages`: Vistas principales (Home, Search, Admin, Dashboards).
    *   `/components`: Elementos reutilizables (Navbar, AIChat).

---

## 🌟 Credenciales de Prueba (Seeds)
Si has importado el `database.sql`, puedes entrar como admin con:
*   **Email**: `admin@hoteia.com`
*   **Password**: `admin123`


contraseña: ffak ozqy xdat nkyn