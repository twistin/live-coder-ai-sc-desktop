# Asistente de IA para Live Coding con SuperCollider (Aplicación de Escritorio)

## Descripción del Proyecto

Este proyecto es una aplicación de escritorio construida con **Electron** y **React** que actúa como un asistente de Inteligencia Artificial para sesiones de live coding en **SuperCollider**. Permite a los músicos describir en lenguaje natural lo que están tocando o lo que desean crear, y la IA (impulsada por Google Gemini) responde con sugerencias de código SuperCollider complementario. Este código puede ser enviado directamente a SuperCollider a través de OSC para su ejecución en tiempo real y también se guarda como un archivo `.scd` para futuras referencias.

## Propósito

El objetivo principal de esta aplicación es potenciar la creatividad y la exploración musical en el live coding, ofreciendo ideas sonoras y fragmentos de código SuperCollider de forma interactiva. Actúa como un "cerebro musical" externo que puede inspirar nuevas direcciones, ayudar a superar bloqueos creativos o simplemente proporcionar una perspectiva diferente durante una performance de live coding.

## Características

- **Interfaz de Usuario Intuitiva:** Desarrollada con React y estilizada con Tailwind CSS para una experiencia de usuario moderna y agradable.
  
- **Asistencia de IA en Tiempo Real (simulada):** Describe tus ideas o lo que estás tocando, y la IA generará código SuperCollider complementario.
  
- **Generación de Código SC:** La IA está entrenada para producir fragmentos de código SuperCollider válidos y ejecutables, priorizando UGens básicos para garantizar la reproducción inmediata.
  
- **Comunicación OSC Bidireccional:**
  
  - **De la App a SuperCollider:** Envía el código SC sugerido por la IA directamente a tu instancia de SuperCollider a través de mensajes OSC.
    
  - **De SuperCollider a la App (Opcional):** Preparado para recibir feedback de SuperCollider (aunque la implementación actual se enfoca en el envío).
    
- **Persistencia de Sugerencias:** Cada interacción con la IA y el código generado se guarda automáticamente en Firebase (Firestore) y también como archivos `.scd` en tu sistema local para un historial y fácil acceso.
  
- **Limpieza de Interfaz:** Botón dedicado para limpiar rápidamente el área de descripción y la respuesta de la IA.
  
- **Feedback de Envío:** Mensajes claros en la interfaz sobre el estado del envío del código a SuperCollider.
  

## Requisitos

Antes de instalar y ejecutar el proyecto, asegúrate de tener lo siguiente:

- **Node.js y npm:** [Descargar e instalar Node.js](https://nodejs.org/en/download/ "null") (npm se incluye con Node.js).
  
- **Git:** Para clonar el repositorio. [Descargar e instalar Git](https://git-scm.com/downloads "null").
  
- **SuperCollider:** [Descargar e instalar SuperCollider](https://supercollider.github.io/download "null").
  
- **Clave API de Google Gemini:** Necesitarás una clave API para acceder al modelo de IA. Puedes obtener una en [Google AI Studio](https://aistudio.google.com/app/apikey "null").
  
- **Configuración de Firebase:** Para la persistencia de datos, necesitarás la configuración de una aplicación Firebase. Estos valores se obtienen del entorno de Google Canvas donde se desarrolló inicialmente el proyecto.
  

## Instalación

Sigue estos pasos para poner en marcha el proyecto en tu máquina local:

1. **Clona el Repositorio:**
  
  ```
  git clone https://github.com/tu-usuario/live-coder-ai-sc-desktop.git
  cd live-coder-ai-sc-desktop
  ```
  
  (Reemplaza `https://github.com/tu-usuario/live-coder-ai-sc-desktop.git` con la URL real de tu repositorio).
  
2. **Instala las Dependencias:**
  
  ```
  npm install
  ```
  
  Esto instalará todas las dependencias de Node.js necesarias para Electron, React y las librerías de OSC y Firebase.
  
3. Configura las Variables de Entorno (.env):
  
  Crea un archivo llamado .env en la raíz de tu proyecto (live-coder-ai-sc-desktop/) y añade las siguientes variables. Debes reemplazar los valores de ejemplo con tus propias claves y configuraciones.
  
  ```
  # .env
  GEMINI_API_KEY="TU_CLAVE_API_DE_GEMINI_AQUI"
  
  # Configuración de Firebase (OBTÉN ESTOS VALORES DE UNA APP DE CANVAS)
  # Puedes obtenerlos ejecutando la 'Aplicación de Lista de Tareas con Firebase' en el entorno de Canvas
  # y revisando la consola del navegador.
  __APP_ID="tu_app_id_de_canvas_aqui"
  __FIREBASE_CONFIG='{"apiKey":"AIzaSy...","authDomain":"your-project.firebaseapp.com","projectId":"your-project","storageBucket":"your-project.appspot.com","messagingSenderId":"...","appId":"1:..."}'
  __INITIAL_AUTH_TOKEN="tu_token_de_autenticacion_inicial_de_canvas_aqui"
  ```
  
  - **`GEMINI_API_KEY`**: Tu clave API de Google Gemini.
    
  - **`__APP_ID`**: El ID de la aplicación de Firebase de Canvas.
    
  - **`__FIREBASE_CONFIG`**: El objeto JSON de configuración de Firebase. **Asegúrate de que esté entre comillas simples (`'`) y que el JSON interno tenga todas las claves y valores de cadena entre comillas dobles (`"`).**
    
  - **`__INITIAL_AUTH_TOKEN`**: Un token de autenticación inicial de Firebase de Canvas. Si no lo tienes o no lo necesitas, la aplicación intentará autenticarse de forma anónima.
    
4. **Construye la Aplicación React:**
  
  ```
  npm run build-react
  ```
  
  Este comando compilará tu código React y generará los archivos estáticos necesarios en la carpeta `public/`.
  
5. Configura SuperCollider:
  
  Abre SuperCollider y carga el archivo supercollider_scripts/osc_listener.scd desde tu proyecto. Ejecuta todo el código en este archivo (selecciona todo y presiona Shift+Enter o Ctrl+Enter). Esto configurará SuperCollider para escuchar los mensajes OSC de tu aplicación.
  
  Asegúrate de que el servidor de SuperCollider (s.boot;) esté iniciado.
  
  ```
  // Contenido de supercollider_scripts/osc_listener.scd
  // (Asegúrate de que este archivo esté actualizado con la última versión proporcionada)
  
  // Paso 0: Asigna la variable de entorno ~appAddr globalmente al principio
  (
   currentEnvironment.put(\appAddr, NetAddr("127.0.0.1", 57121));
   "NetAddr para la app Electron configurado en 127.0.0.1:57121".postln;
  );
  
  // Paso 1: Asegúrate de que el servidor de SuperCollider está encendido
  s.boot;
  
  // Espera a que el servidor esté listo
  s.waitForBoot {
   "SuperCollider Server booted.".postln;
  
   // Paso 2: Configura un OSCdef para escuchar mensajes entrantes de tu app Electron
   OSCdef.new(
     \executeAppCode,
     { arg msg, time, addr;
       var codeString = msg[1];
       "------ Código SC recibido de la App AI ------".postln;
       codeString.postln;
       "---------------------------------------------".postln;
       {
         s.sync;
         "Intentando interpretar código...".postln;
         thisProcess.interpreter.interpret(codeString);
         "Interpretación finalizada (verifica la Post Window para errores o sonidos).".postln;
       }.fork;
     },
     '/execute_sc_code',
     nil,
     57120
   );
  
   "OSC Listener para /execute_sc_code configurado en SuperCollider.".postln;
   "Asegúrate de que tu app Electron envía a 127.0.0.1:57120".postln;
  };
  
  // Para detener todos los sintetizadores que se estén ejecutando
  CmdPeriod.run;
  ```
  

## Uso

1. **Inicia SuperCollider:** Asegúrate de que el servidor de SuperCollider esté corriendo y que el script `osc_listener.scd` esté ejecutado.
  
2. **Inicia la Aplicación de Escritorio:**
  
  ```
  npm start
  ```
  
  Esto abrirá la ventana de la aplicación Electron.
  
3. **Describe tu Música:** En el cuadro de texto "Describe lo que estás tocando en SuperCollider:", escribe una descripción de tu sonido actual o de lo que te gustaría añadir.
  
  - Ejemplo: "Estoy haciendo un ritmo techno con un kick fuerte y quiero una melodía de sintetizador ambiental en C menor."
    
  - Ejemplo: "Necesito un drone ruidoso que evolucione lentamente."
    
4. **Obtén Sugerencia:** Haz clic en el botón "Obtener Sugerencia Musical". La IA procesará tu descripción y generará un fragmento de código SuperCollider.
  
5. **Envía a SuperCollider:** Revisa el código sugerido. Si te gusta, haz clic en el botón "Enviar Código a SuperCollider".
  
  - El código se enviará a SuperCollider vía OSC y se ejecutará.
    
  - También se guardará automáticamente como un archivo `.scd` en la carpeta `supercollider_scripts/generated/` de tu proyecto.
    
  - Verás un mensaje de estado en la interfaz de la aplicación confirmando el envío y el guardado.
    
6. **Limpiar:** Usa el botón "Limpiar Descripción" para borrar el área de texto y la respuesta de la IA, listo para una nueva interacción.
  

## Estructura del Proyecto

```
live-coder-ai-sc-desktop/
├── main.js                  # Proceso principal de Electron: gestión de ventana, IPC, IA y OSC.
├── package.json             # Metadatos del proyecto y dependencias.
├── .env                     # Variables de entorno (claves API, configuración Firebase).
├── preload.js               # Script de seguridad de Electron para comunicación IPC.
├── src/                     # Código fuente de la aplicación React (interfaz de usuario).
│   ├── App.js               # Componente principal de React.
│   ├── index.js             # Punto de entrada de React.
│   └── index.css            # Estilos CSS globales.
├── public/                  # Archivos estáticos para la aplicación React (HTML, bundle.js).
│   ├── index.html           # Plantilla HTML principal.
│   └── bundle.js            # Código React compilado por Webpack.
├── supercollider_scripts/   # Scripts y recursos para SuperCollider.
│   ├── osc_listener.scd     # Script de SuperCollider para escuchar mensajes OSC.
│   └── generated/           # Carpeta donde se guardan los códigos SC generados por la IA.
├── webpack.config.js        # Configuración para compilar la aplicación React.
├── README.md                # Este archivo.
└── .gitignore               # Archivos y carpetas a ignorar por Git.
```

## Contribución

¡Las contribuciones son bienvenidas! Si deseas mejorar este proyecto, por favor:

1. Haz un "fork" del repositorio.
  
2. Crea una nueva rama (`git checkout -b feature/nueva-funcionalidad`).
  
3. Realiza tus cambios y haz "commit" (`git commit -am 'Añadir nueva funcionalidad'`).
  
4. Haz "push" a la rama (`git push origin feature/nueva-funcionalidad`).
  
5. Crea un nuevo "Pull Request".
  

## Licencia

Este proyecto está bajo la licencia MIT. Consulta el archivo `LICENSE` para más detalles.