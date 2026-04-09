# Secure Campus IA 🎓🤖

Bienvenido al repositorio de **Secure Campus IA**. Este proyecto es una aplicación web moderna desarrollada con Next.js que implementa una interfaz de chat con Inteligencia Artificial.

Está diseñada con un enfoque _mobile-first_ para que se sienta como una aplicación nativa (sin scroll global, solo en el área de mensajes) y cuenta con un diseño limpio utilizando Tailwind CSS.

---

## 🚀 Cómo empezar (Guía rápida)

### Requisitos previos
Asegúrate de tener instalado en tu computadora:
- Node.js (Se recomienda la versión 18 o superior).

### Instalación y ejecución

1. **Instala las dependencias** del proyecto. Abre tu terminal en la carpeta raíz del proyecto y ejecuta:
   ```bash
   npm install
   ```

2. **Inicia el servidor de desarrollo** localmente:
   ```bash
   npm run dev
   ```

3. **Abre la aplicación:** Ve a tu navegador y entra a http://localhost:3000. ¡Deberías ver la interfaz del chat!

---

## 🛠️ Tecnologías Principales

- **Next.js (App Router):** El framework de React que usamos tanto para el frontend como para las rutas de API (backend ligero).
- **React:** Para construir la interfaz de usuario.
- **Tailwind CSS:** Para los estilos rápidos, responsivos y el soporte de "Modo Oscuro".
- **Zustand:** Para manejar el estado global de la aplicación (como guardar el historial de la conversación).

---

## 📂 Estructura clave para estudiantes

Si vas a modificar el código, estos son los archivos y carpetas más importantes que debes conocer:

- 🖥️ `app/page.tsx`: Es la pantalla principal. Aquí está el diseño del chat (el _Header_, el área de mensajes y el _Input_ para escribir).
- ⚙️ `app/api/chat/route.ts`: Es el "Backend" de nuestro chat. Esta ruta recibe los mensajes del usuario y es donde deberás conectar la lógica para que la Inteligencia Artificial devuelva una respuesta.
- 🧠 `app/store/conversation.ts`: Aquí se guarda la memoria de la conversación actual utilizando Zustand.
- 🪝 `app/hooks/useConversation.ts`: Contiene la lógica que conecta la interfaz gráfica (frontend) con la ruta de la API (backend).

> **Tip para el equipo:** Si necesitan modificar cómo se ven los mensajes, revisen `app/page.tsx`. Si necesitan cambiar qué responde la IA, revisen `app/api/chat/route.ts`.
