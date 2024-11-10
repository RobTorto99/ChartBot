# backend/app.py
from flask import Flask, request, jsonify
import pandas as pd
import json

app = Flask(__name__)

@app.route('/chart-data', methods=['POST'])
def chart_data():
    prompt = request.form.get('prompt')
    file = request.files.get('file')

    if file:
        # Procesar el archivo usando Pandas
        if file.filename.endswith('.csv'):
            df = pd.read_csv(file)
        elif file.filename.endswith(('.xlsx', '.xls')):
            df = pd.read_excel(file)
        else:
            return jsonify({'error': 'Tipo de archivo no soportado.'}), 400
    else:
        df = None  # No hay archivo adjunto

    # Aquí implementas la lógica para generar el gráfico basado en el prompt y df

    # Ejemplo simple
    if df is not None:
        # Por ejemplo, obtener los nombres de columnas y enviarlos al frontend
        columns = df.columns.tolist()
        visualization_explanation = f"Las columnas en tu archivo son: {', '.join(columns)}"
    else:
        visualization_explanation = "No se proporcionó ningún archivo."

    # Generar un gráfico de ejemplo
    visualization_code = json.dumps({
        'chart': {'type': 'column'},
        'title': {'text': 'Ejemplo de Gráfico'},
        'series': [
            {'name': 'Datos', 'data': [1, 2, 3, 4, 5]}
        ]
    })

    return jsonify({
        'visualization_code': visualization_code,
        'visualization_explanation': visualization_explanation
    })

if __name__ == '__main__':
    app.run(debug=True)
