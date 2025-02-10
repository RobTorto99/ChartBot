import torch
from unsloth import FastLanguageModel
from peft import PeftModel
from transformers import AutoTokenizer
import pandas as pd
import json
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from transformers import logging as hf_logging
from typing import Optional

hf_logging.set_verbosity_error() 

app = Flask(__name__)
# Permitir que TODAS las rutas (/*) se consuman DESDE http://localhost:5173
CORS(app, resources={r"/*": {"origins": ["http://localhost:5173", "http://127.0.0.1:5173"]}})

print("Cargando modelo...")

base_model, tokenizer = FastLanguageModel.from_pretrained(
    "unsloth/Qwen2.5-Coder-7B-Instruct",
    load_in_4bit=True,
    dtype=torch.float16,
    max_seq_length=1024,
)

base_model = FastLanguageModel.get_peft_model(
    base_model,
    r=16,
    lora_alpha=32,
    lora_dropout=0.1,
    target_modules=["q_proj", "k_proj", "v_proj", "o_proj"],
    use_gradient_checkpointing=True
)

model = PeftModel.from_pretrained(base_model, "/home/roberto/Projects/ChartBot/modelo_v1")
model = FastLanguageModel.for_inference(model)

print("Modelo cargado.")


def clean_json_response(response_str: str) -> str:
    # Quita espacios y saltos de línea al principio y al final
    response_str = response_str.strip()
    # Si está envuelto en backticks o delimitadores, quítalos:
    if response_str.startswith("```") and response_str.endswith("```"):
        # Quita los backticks y cualquier especificador de lenguaje (por ejemplo, "json")
        lines = response_str.splitlines()
        # Si la primera línea es algo como "```json", la descartamos
        if lines[0].startswith("```"):
            lines = lines[1:]
        # Si la última línea contiene ``` se descarta
        if lines and lines[-1].strip().startswith("```"):
            lines = lines[:-1]
        response_str = "\n".join(lines).strip()
    # Otra opción: extraer el primer substring que comience con "{" y termine con "}"
    start = response_str.find("{")
    end = response_str.rfind("}")
    if start != -1 and end != -1:
        response_str = response_str[start:end+1]
    return response_str

# Función de inferencia usando el modelo cargado
def generate_visualization_code(prompt: str, df: Optional[pd.DataFrame] = None) -> str:
    if df is None:
        system_message = (
            "It responds in JSON format with two attributes:\n"
            " - 'visualization_code': must contain only the chartOptions object from HighchartJS and must not contain expressions that do not accept the JSON format.\n"
            " - 'visualization_explanation': must contain only the explanation of the chart.\n\n"
            "Please follow exactly that JSON structure without extra text.\n\n"
        )
    else:
        # Si df existe, conviértelo a string y úsalo en la instrucción
        df_str = df.to_string()
        system_message = (
            "It responds in JSON format with two attributes:\n"
            " - 'visualization_code': must contain only the chartOptions object from HighchartJS and must not contain expressions that do not accept the JSON format.\n"
            " - 'visualization_explanation': must contain only the explanation of the chart.\n\n"
            "Please follow exactly that JSON structure without extra text.\n\n"
            f"Use this dataframe to create the chart: \n{df_str}\n\n"
        )

    # Construye el texto final con el prompt
    text = f"{system_message}Prompt:\n{prompt}\n\nResponse:\n"
    inputs = tokenizer(text, return_tensors="pt").to(model.device)
    
    with torch.no_grad():
        output = model.generate(
            **inputs,
            max_new_tokens=800,
            do_sample=True,
            top_k=40,
            top_p=0.9,
            temperature=0.9,
            repetition_penalty=1.2
        )

    response = tokenizer.decode(output[0], skip_special_tokens=True)
    if "Response:" in response:
        response = response.split("Response:")[1].strip()

    return response


@app.route('/chart-data', methods=['POST'])
def chart_data():
    df = None
    prompt = request.form.get('prompt')
    generate_chart = request.form.get('generateChart', 'false').lower() == 'true'
    file = request.files.get('file')

    if generate_chart:
        
        # 1. Procesar el archivo (si se envió) con Pandas
        if file:
            if file.filename.endswith('.csv'):
                df = pd.read_csv(file)
            elif file.filename.endswith('.xlsx'):
                df = pd.read_excel(file, engine='openpyxl')
            elif file.filename.endswith('.xls'):
                df = pd.read_excel(file, engine='xlrd')
            else:
                return jsonify({'error': 'Tipo de archivo no soportado.'}), 400
        else:
            df = None

        # 2. Llamar a la función del modelo
        model_response = generate_visualization_code(prompt, df)
            
        # 3. Parsear la cadena que devuelve el modelo (si es JSON)
        #    El modelo ya responde en JSON con 2 atributos. 
        #    Podemos hacer un try/except:
        print("Respuesta original del modelo:")
        print(model_response)
        
        # Limpia la respuesta para convertirla en JSON válido
        cleaned_response = clean_json_response(model_response)
        print("Respuesta limpiada:")
        print(cleaned_response)
        
        try:
            response_json = json.loads(cleaned_response)
            visualization_code = response_json.get('visualization_code', '{}')
            visualization_explanation = response_json.get('visualization_explanation', '')
        except json.JSONDecodeError as err:
            print("Error al parsear JSON:", err)
            visualization_code = {}
            visualization_explanation = "El modelo devolvió un formato inesperado."

    else:
        # Si no se requiere gráfico, se devuelve una respuesta normal
        visualization_code = json.dumps({})
        visualization_explanation = "Respuesta normal: " + (prompt or "Sin texto")
    
    print(f"visualization_code:\n{visualization_code}")
    print(f"visualization_explanation:\n{visualization_explanation}")

    return jsonify({
        'visualization_code': visualization_code,
        'visualization_explanation': visualization_explanation
    })


@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    if path and path != "favicon.ico":
        return send_from_directory('static', path)
    else:
        return send_from_directory('static', 'index.html')

if __name__ == '__main__':
    app.run(debug=True,  use_reloader=False)
