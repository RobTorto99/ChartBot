# Proyecto de TFG: ChatBot con generación de visualizaciones

Este repositorio contiene un **ChatBot** capaz de recibir texto y/o un archivo CSV/Excel y, opcionalmente, generar gráficos interactivos con Highcharts. El sistema consta de:

* **Backend** en Flask + PyTorch + Unsloth.
* **Frontend** con React (Vite + TailwindCSS).

---

## Requisitos previos

* **Python** ≥ 3.10
* **Node.js** ≥ 16
* Git (para clonar el repositorio)

---

## Instalación

### 1. Clonar el repositorio

```bash
git clone https://github.com/RobTorto99/ChartBot.git
cd Proyecto-de-TFG
```

### 2. Backend

1. Crear y activar el entorno virtual:

   **Linux/macOS**

   ```bash
   cd backend
   python3 -m venv venv
   source venv/bin/activate
   ```

   **Windows (PowerShell)**

   ```powershell
   cd backend
   python -m venv venv
   .\venv\Scripts\Activate
   ```

2. Instalar dependencias:

   ```bash
   pip install --upgrade pip
   pip install -r requirements.txt
   ```

3. Ejecutar el servidor:

   ```bash
   python app.py
   ```

   Por defecto arrancará en `http://localhost:5000`.

---

### 3. Frontend

1. Instalar dependencias con npm (o yarn/pnpm):

   ```bash
   cd ../frontend
   npm install
   ```

   Esto creará la carpeta `node_modules` según tu `package.json`.

2. Arrancar el servidor de desarrollo:

   ```bash
   npm run dev
   ```

   Está disponible en `http://localhost:5173`.

---

## Uso

1. Con el backend corriendo en `http://localhost:5000` y el frontend en `http://localhost:5173`, abre tu navegador en la URL del frontend.
2. En la interfaz de chat puedes:

   * Escribir texto libre.
   * Adjuntar un CSV o Excel.
   * Marcar/desmarcar el toggle **“Generar gráfico”** para indicar si la IA debe devolver un gráfico o solo texto.
3. Envía y espera la respuesta. Si pediste gráfico, aparecerá integrado en la conversación.

---

## Contacto

**Roberto Tortoledo**
[roberto7tortoledo@gmail.com](mailto:roberto7tortoledo@gmail.com)
TFG: “Desarrollo de aplicación web para implementar Inteligencia Artificial Generativa ajustada vía QLoRA en la creación de visualizaciones de datos”
