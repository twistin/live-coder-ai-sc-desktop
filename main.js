// main.js
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('node:path');
const { Client, Server } = require('node-osc');
const fs = require('node:fs'); // Importar el módulo 'fs' para operaciones de archivos
require('dotenv').config();
const { initializeApp } = require('firebase/app');
const { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } = require('firebase/auth');
const { getFirestore, doc, setDoc } = require('firebase/firestore');

// --- Configuración Firebase (para persistencia) ---
const appId = process.env.__APP_ID || 'default-app-id';
const firebaseConfig = process.env.__FIREBASE_CONFIG ? JSON.parse(process.env.__FIREBASE_CONFIG) : {};
let db;
let auth;
let currentUserId = '';

async function initializeFirebaseAndAuth() {
    if (!Object.keys(firebaseConfig).length) {
        console.error("Firebase config is not defined. Cannot initialize Firebase.");
        return;
    }
    try {
        const firebaseApp = initializeApp(firebaseConfig);
        db = getFirestore(firebaseApp);
        auth = getAuth(firebaseApp);

        if (process.env.__INITIAL_AUTH_TOKEN) {
            await signInWithCustomToken(auth, process.env.__INITIAL_AUTH_TOKEN);
        } else {
            await signInAnonymously(auth);
        }

        onAuthStateChanged(auth, (user) => {
            if (user) {
                currentUserId = user.uid;
                console.log("Firebase User ID:", currentUserId);
                if (mainWindow) {
                    mainWindow.webContents.send('set-user-id', currentUserId);
                }
            } else {
                currentUserId = crypto.randomUUID();
                console.log("Anonymous User ID:", currentUserId);
                if (mainWindow) {
                    mainWindow.webContents.send('set-user-id', currentUserId);
                }
            }
        });
        console.log("Firebase initialized and authentication listener set up.");
    } catch (e) {
        console.error("Error initializing Firebase or during authentication:", e);
    }
}

// --- Configuración OSC ---
const SC_IP = "127.0.0.1";
const SC_PORT = 57120;
const APP_OSC_PORT = 57121;

let oscClient;
let oscServer;

function createOSCClient() {
    oscClient = new Client(SC_IP, SC_PORT);
    console.log(`OSC Client initialized: Sending to ${SC_IP}:${SC_PORT}`);
}

function createOSCServer() {
    oscServer = new Server(APP_OSC_PORT, SC_IP);
    oscServer.on('message', function (msg) {
        console.log(`OSC Message from SuperCollider: ${msg}`);
        // mainWindow.webContents.send('osc-feedback', msg);
    });
    oscServer.on('error', function (err) {
        console.error("OSC Server Error:", err);
    });
    console.log(`OSC Server initialized: Listening on ${SC_IP}:${APP_OSC_PORT}`);
}

// --- Ventana principal de Electron ---
let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1000,
        height: 800,
        minWidth: 800,
        minHeight: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
            enableRemoteModule: false
        }
    });

    mainWindow.loadFile(path.join(__dirname, 'public', 'index.html'));
    // mainWindow.webContents.openDevTools();

    mainWindow.on('closed', () => {
        mainWindow = null;
    });

    createOSCClient();
    createOSCServer();
}

app.whenReady().then(async () => {
    await initializeFirebaseAndAuth();
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        if (oscClient) {
            oscClient.close();
            console.log("OSC Client closed.");
        }
        if (oscServer) {
            oscServer.close();
            console.log("OSC Server closed.");
        }
        app.quit();
    }
});


// --- Manejadores IPC (Comunicación entre Electron y React) ---

ipcMain.handle('generate-musical-response', async (event, prompt) => {
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_API_KEY) {
        console.error("GEMINI_API_KEY no está definida en .env");
        return { error: "Clave API de Gemini no configurada." };
    }

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;
    
    const combinedPrompt = `Eres un asistente de IA experto en música y live coding con SuperCollider. Tu tarea es escuchar (a través de descripciones de texto) lo que el usuario está tocando y responder con ideas de sonidos complementarios. Tu respuesta debe ser un FRAGMENTO DE CÓDIGO SUPERCOLLIDER COMPLETO Y EJECUTABLE que el usuario pueda copiar y pegar directamente o enviar vía OSC. El código debe estar envuelto en un bloque de Markdown de SuperCollider (ej: \`\`\`supercollider ... \`\`\`). Ofrece una idea musical concreta y funcional. **Prioriza el uso de UGens básicos (como SinOsc, Saw, WhiteNoise, Pulse, LPF, HPF, etc.) para asegurar que el sonido se genere inmediatamente sin depender de archivos externos.** Si necesitas usar un Buffer, asegúrate de que el código incluya una nota clara para el usuario sobre cómo cargar un archivo de sonido válido (ej: // Reemplaza "path/to/your/sound.wav" con la ruta real de tu archivo de sonido). No añadas explicaciones fuera del bloque de código.

    Estoy tocando: "${prompt}". ¿Qué sonido complementario me sugieres en código SuperCollider?`;

    const payload = {
        contents: [
            { role: "user", parts: [{ text: combinedPrompt }] }
        ]
    };

    try {
        console.log("Llamando a la API de Gemini...");
        const apiResponse = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!apiResponse.ok) {
            let errorDetails = `Status: ${apiResponse.status}`;
            const contentType = apiResponse.headers.get('Content-Type');
            if (contentType && contentType.includes('application/json')) {
                try {
                    const errorData = await apiResponse.json();
                    errorDetails += `, Details: ${errorData.error ? errorData.error.message : JSON.stringify(errorData)}`;
                } catch (jsonError) {
                    errorDetails += `, JSON parse error: ${jsonError.message}`;
                }
            } else {
                errorDetails += `, Raw Text: ${await apiResponse.text().catch(() => 'No body')}`;
            }
            console.error("Error de la API de Gemini:", errorDetails);
            return { error: `Error de la API: ${errorDetails}` };
        }

        const result = await apiResponse.json();
        if (result.candidates && result.candidates.length > 0 &&
            result.candidates[0].content && result.candidates[0].content.parts &&
            result.candidates[0].content.parts.length > 0) {
            const aiText = result.candidates[0].content.parts[0].text;
            console.log("Respuesta de Gemini recibida.");
            
            // Guardar la interacción en Firestore
            if (db && currentUserId) {
                const docRef = doc(db, `artifacts/${appId}/users/${currentUserId}/ai_musical_responses`, Date.now().toString());
                await setDoc(docRef, {
                    timestamp: new Date(),
                    userPrompt: prompt,
                    aiResponse: aiText,
                });
                console.log("Response saved to Firestore!");
            } else {
                console.warn("Firestore or User ID not available. Response not saved.");
            }
            return { code: aiText };
        } else {
            return { error: "Respuesta inesperada de la IA. Inténtalo de nuevo." };
        }
    } catch (e) {
        console.error("Error al comunicarse con la API de Gemini:", e);
        return { error: `Error de comunicación con la IA: ${e.message || e.toString()}` };
    }
});

// Maneja la solicitud de enviar código SC a SuperCollider y guardarlo
ipcMain.on('send-sc-code', (event, codeString) => {
    if (!oscClient) {
        console.error("OSC Client not initialized. Cannot send code.");
        event.sender.send('send-status', 'Error: Cliente OSC no inicializado.');
        return;
    }

    // 1. Extraer el código SC puro del bloque Markdown
    const scCodeMatch = codeString.match(/```supercollider\s*([\s\S]*?)\s*```/);
    const pureScCode = scCodeMatch ? scCodeMatch[1].trim() : codeString.trim();

    // 2. Guardar el código en un archivo .scd
    const generatedScriptsDir = path.join(__dirname, 'supercollider_scripts', 'generated');
    // Asegurarse de que la carpeta 'generated' exista
    if (!fs.existsSync(generatedScriptsDir)) {
        fs.mkdirSync(generatedScriptsDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `suggestion_${timestamp}.scd`;
    const filePath = path.join(generatedScriptsDir, filename);

    fs.writeFile(filePath, pureScCode, (err) => {
        if (err) {
            console.error("Error al guardar el archivo .scd:", err);
            event.sender.send('send-status', `Error al guardar el archivo SC: ${err.message}`);
        } else {
            console.log(`Código SC guardado en: ${filePath}`);
            // 3. Enviar el código OSC a SuperCollider
            oscClient.send('/execute_sc_code', pureScCode, (oscErr) => {
                if (oscErr) {
                    console.error("Error enviando mensaje OSC a SuperCollider:", oscErr);
                    event.sender.send('send-status', `Error al enviar OSC: ${oscErr.message}`);
                } else {
                    console.log("Código SuperCollider enviado vía OSC exitosamente.");
                    event.sender.send('send-status', `Código guardado en ${filename} y enviado a SuperCollider.`);
                }
            });
        }
    });
});

// Maneja la solicitud del userId desde el proceso de renderizado
ipcMain.on('request-user-id', (event) => {
    if (currentUserId) {
        event.sender.send('set-user-id', currentUserId);
    }
});
