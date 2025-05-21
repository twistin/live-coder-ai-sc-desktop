// preload.js
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Para llamadas que esperan una respuesta (ej. llamada a la IA)
  invoke: (channel, ...args) => {
    // Lista blanca de canales que pueden ser invocados
    const validInvokeChannels = ['generate-musical-response'];
    if (validInvokeChannels.includes(channel)) {
      return ipcRenderer.invoke(channel, ...args);
    }
    return Promise.reject(new Error(`Canal IPC no válido: ${channel}`));
  },
  // Para enviar mensajes sin esperar una respuesta (ej. enviar código a SC, solicitar userId)
  send: (channel, ...args) => {
    // Lista blanca de canales que pueden ser enviados
    const validSendChannels = ['send-sc-code', 'request-user-id']; // Añadido 'request-user-id'
    if (validSendChannels.includes(channel)) {
      ipcRenderer.send(channel, ...args);
    } else {
      console.error(`Canal IPC no válido para enviar: ${channel}`);
    }
  },
  // Para recibir mensajes del proceso principal (ej. setear userId, estado de envío OSC)
  on: (channel, callback) => {
    const validOnChannels = ['set-user-id', 'send-status']; // Añadido 'set-user-id' y 'send-status'
    if (validOnChannels.includes(channel)) {
      const subscription = (event, ...args) => callback(...args);
      ipcRenderer.on(channel, subscription);
      return () => ipcRenderer.removeListener(channel, subscription);
    }
    return () => {}; // Devolver una función vacía para el cleanup si el canal no es válido
  }
});
