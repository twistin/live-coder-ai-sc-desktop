// webpack.config.js
const path = require('path');

module.exports = {
  // Punto de entrada de tu aplicación React
  entry: './src/index.js',

  // Configuración de salida: dónde se guardará el bundle compilado
  output: {
    path: path.resolve(__dirname, 'public'), // Compila React en la carpeta 'public'
    filename: 'bundle.js', // Nombre del archivo JavaScript compilado
  },

  // Módulos: cómo Webpack maneja diferentes tipos de archivos
  module: {
    rules: [
      {
        // Regla para archivos JavaScript y JSX
        test: /\.(js|jsx)$/,
        exclude: /node_modules/, // Excluye la carpeta node_modules
        use: {
          loader: 'babel-loader', // Usa Babel para transcompilar JS/JSX
          options: {
            presets: ['@babel/preset-env', '@babel/preset-react'], // Presets de Babel para ES6+ y React
          },
        },
      },
      {
        // Regla para archivos CSS
        test: /\.css$/,
        use: ['style-loader', 'css-loader'], // Usa style-loader y css-loader para importar CSS
      },
      // Puedes añadir reglas para imágenes, fuentes, etc., si las necesitas
    ],
  },

  // Resuelve extensiones de archivo para que no tengas que especificarlas en los imports
  resolve: {
    extensions: ['.js', '.jsx'],
  },

  // Modo de desarrollo o producción (se puede sobrescribir con --mode en el script)
  mode: 'development', // Por defecto, puedes cambiarlo a 'production' para el build final
};