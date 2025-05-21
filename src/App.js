import React, { useState, useEffect, useRef } from 'react';

function App() {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [userId, setUserId] = useState('');
  const [sendStatus, setSendStatus] = useState(''); // Nuevo estado para el feedback de envío
  const responseRef = useRef(null);

  // Efecto para escuchar el userId y el estado de envío del proceso principal de Electron
  useEffect(() => {
    if (window.electronAPI && window.electronAPI.on) {
      // Listener para el userId
      const unsubscribeUserId = window.electronAPI.on('set-user-id', (id) => {
        setUserId(id);
      });
      // Listener para el estado de envío de OSC
      const unsubscribeSendStatus = window.electronAPI.on('send-status', (status) => {
        setSendStatus(status);
        // Opcional: limpiar el mensaje de estado después de un tiempo
        const timer = setTimeout(() => {
          setSendStatus('');
        }, 5000); // El mensaje desaparece después de 5 segundos
        return () => clearTimeout(timer);
      });

      // Solicita el userId al proceso principal cuando el componente se monta
      window.electronAPI.send('request-user-id');

      return () => {
        unsubscribeUserId();
        unsubscribeSendStatus();
      }; // Limpia los listeners al desmontar
    }
  }, []);

  // Effect to scroll to the latest response
  useEffect(() => {
    if (responseRef.current) {
      responseRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [response]);

  const generateMusicalResponse = async () => {
    if (!prompt.trim()) {
      setError("Por favor, describe lo que estás tocando en SuperCollider.");
      return;
    }

    setIsLoading(true);
    setError('');
    setResponse('');
    setSendStatus(''); // Limpiar estado de envío al generar nueva respuesta

    try {
      const result = await window.electronAPI.invoke('generate-musical-response', prompt);

      if (result.error) {
        setError(result.error);
        console.error("Error al obtener respuesta de IA:", result.error);
      } else if (result.code) {
        setResponse(result.code);
      } else {
        setError("Respuesta inesperada de la IA.");
        console.error("Unexpected AI response structure:", result);
      }
    } catch (e) {
      console.error("Error al invocar la función de IA en Electron:", e);
      setError(`Error de comunicación con la aplicación: ${e.message || e.toString()}`);
    } finally {
      setIsLoading(false);
    }
  };

  const sendCodeToSuperCollider = () => {
    if (!response.trim()) {
      setError("No hay código para enviar a SuperCollider.");
      return;
    }
    try {
        const scCodeMatch = response.match(/```supercollider\s*([\s\S]*?)\s*```/);
        const codeToSend = scCodeMatch ? scCodeMatch[1].trim() : response.trim();

        window.electronAPI.send('send-sc-code', codeToSend);
        console.log("Comando para enviar código SC a Electron enviado.");
        setError(''); // Limpia cualquier error anterior
        setSendStatus('Enviando código a SuperCollider...'); // Actualizar estado de envío
    } catch (e) {
        console.error("Error al enviar código SC a Electron:", e);
        setError(`Error al intentar enviar código a SuperCollider: ${e.message || e.toString()}`);
    }
  };

  const clearPrompt = () => {
    setPrompt('');
    setResponse('');
    setError('');
    setSendStatus('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white p-4 sm:p-8 flex flex-col items-center justify-center font-inter">
      {/* Tailwind CSS CDN y fuente Inter ya están en public/index.html */}

      <div className="w-full max-w-3xl bg-gray-800 rounded-xl shadow-2xl p-6 sm:p-8 border border-gray-700">
        <h1 className="text-3xl sm:text-4xl font-bold text-center mb-6 text-purple-400">
          Asistente de IA para Live Coding
        </h1>
        {userId && (
          <p className="text-sm text-gray-400 text-center mb-6">
            Tu ID de usuario: <span className="font-mono text-xs break-all">{userId}</span>
          </p>
        )}

        <div className="mb-6">
          <label htmlFor="prompt" className="block text-lg font-medium text-gray-300 mb-2">
            Describe lo que estás tocando en SuperCollider:
          </label>
          <textarea
            id="prompt"
            className="w-full p-3 rounded-lg bg-gray-700 text-white border border-gray-600 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 resize-y min-h-[100px]"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Ej: 'Estoy haciendo un drone ambiental en F# menor con mucho reverb y un LFO lento en el filtro.' o 'Acabo de iniciar un ritmo de batería con un kick muy seco y un hi-hat repetitivo.'"
            rows="4"
          ></textarea>
          <button
            onClick={clearPrompt}
            className="mt-2 w-full bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transform hover:scale-105 transition-all duration-300"
          >
            Limpiar Descripción
          </button>
        </div>

        <button
          onClick={generateMusicalResponse}
          disabled={isLoading}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-lg shadow-lg transform hover:scale-105 transition-all duration-300
                     disabled:bg-gray-600 disabled:cursor-not-allowed disabled:transform-none"
        >
          {isLoading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Pensando una respuesta...
            </span>
          ) : (
            'Obtener Sugerencia Musical'
          )}
        </button>

        {error && (
          <div className="mt-6 p-4 bg-red-800 rounded-lg text-red-200 border border-red-700">
            <p className="font-semibold">Error:</p>
            <p>{error}</p>
          </div>
        )}

        {sendStatus && (
          <div className="mt-4 p-3 bg-blue-800 rounded-lg text-blue-200 border border-blue-700 text-center">
            <p>{sendStatus}</p>
          </div>
        )}

        {response && (
          <div className="mt-8">
            <h2 className="text-2xl font-bold text-purple-400 mb-4">Sugerencia de la IA:</h2>
            <div className="bg-gray-700 p-5 rounded-lg border border-gray-600 shadow-inner scrollable-content" ref={responseRef}>
              <pre className="whitespace-pre-wrap text-gray-200 text-sm overflow-auto">
                <code>
                    {response.replace(/```supercollider\s*([\s\S]*?)\s*```/, '$1').trim()}
                </code>
              </pre>
            </div>
            <button
              onClick={sendCodeToSuperCollider}
              className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg shadow-lg transform hover:scale-105 transition-all duration-300"
            >
              Enviar Código a SuperCollider
            </button>
          </div>
        )}

        <div className="mt-8 p-4 bg-gray-700 rounded-lg text-gray-300 text-sm border border-gray-600">
          <h3 className="font-semibold text-white mb-2">Nota Importante:</h3>
          <p>
            Esta aplicación de escritorio utiliza Electron para interactuar con la IA y SuperCollider.
            Las sugerencias de la IA son fragmentos de código SuperCollider ejecutables.
            Asegúrate de que SuperCollider esté ejecutándose y configurado para recibir mensajes OSC en el puerto `57120` con la dirección `/execute_sc_code`.
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;
