// supercollider_scripts/osc_listener.scd

// Paso 0: Declara la variable de entorno ~appAddr globalmente
// Esto evita que el ProxySpace intente "proxy" el NetAddr.
var <~appAddr; // Declara ~appAddr como una variable de entorno global.

// Paso 1: Asegúrate de que el servidor de SuperCollider está encendido
s.boot;

// Espera a que el servidor esté listo
s.waitForBoot {
  "SuperCollider Server booted.".postln;

  // Paso 2: Configura un OSCdef para escuchar mensajes entrantes de tu app Electron
  // Tu app Electron enviará mensajes a la dirección '/execute_sc_code'
  // El contenido del mensaje (msg[1]) será la cadena de código SuperCollider.
  OSCdef.new(
    \executeAppCode,  // Nombre único para tu OSCdef
    { arg msg, time, addr;
      var codeString = msg[1]; // El segundo elemento del mensaje OSC es el código

      // Imprime el código recibido en la Post Window de SuperCollider
      "------ Código SC recibido de la App AI ------".postln;
      codeString.postln;
      "---------------------------------------------".postln;

      // ¡Aquí está la magia! Interpreta y ejecuta la cadena de código
      // Asegúrate de que el código que la IA genera sea seguro y no malicioso.
      {
        thisProcess.interpreter.interpret(codeString);
      }.try; // Esto previene que un error en el código de la IA rompa el OSCdef

    },
    '/execute_sc_code', // La dirección OSC que tu app Electron enviará
    nil, // Predicado (nil para cualquier remitente)
    57120 // Usa el número de puerto directamente (puerto por defecto de SuperCollider)
  );

  "OSC Listener para /execute_sc_code configurado en SuperCollider.".postln;
  "Asegúrate de que tu app Electron envía a 127.0.0.1:57120".postln;

  // Paso 3: Asigna el NetAddr a la variable de entorno global ~appAddr
  // Ahora que ~appAddr ya está declarada, esta asignación no causará el error de "proxy".
  ~appAddr = NetAddr("127.0.0.1", 57121);
  "NetAddr para la app Electron configurado en 127.0.0.1:57121".postln;
  // Puedes usar esto para enviar mensajes a tu app Electron:
  // ~appAddr.sendMsg("/sc_status", "Code executed successfully!");
};

// Para detener todos los sintetizadores que se estén ejecutando
CmdPeriod.run;
