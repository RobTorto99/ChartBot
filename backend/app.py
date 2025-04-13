import torch
from unsloth import FastLanguageModel
from peft import PeftModel
import pandas as pd
import json
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from transformers import logging as hf_logging
from typing import Optional

hf_logging.set_verbosity_error() 

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": ["http://localhost:5173", "http://127.0.0.1:5173"]}})

print("Cargando modelo...")

base_model, tokenizer = FastLanguageModel.from_pretrained(
    "unsloth/Qwen2.5-Coder-7B-Instruct",
    load_in_4bit=True,
    dtype=torch.float16,
    max_seq_length=4096,
)

base_model = FastLanguageModel.get_peft_model(
    base_model,
    r=16,
    lora_alpha=32,
    lora_dropout=0.1,
    target_modules=["q_proj", "k_proj", "v_proj", "o_proj"],
    use_gradient_checkpointing=True
)

model = PeftModel.from_pretrained(base_model, "/home/roberto/Projects/ChartBot/output_QLoRA_final")
model = FastLanguageModel.for_inference(model)

print("Modelo cargado.")


def clean_json_response(response_str: str) -> str:
    response_str = response_str.strip()
    if response_str.startswith("```") and response_str.endswith("```"):
        lines = response_str.splitlines()
        if lines[0].startswith("```"):
            lines = lines[1:]
        if lines and lines[-1].strip().startswith("```"):
            lines = lines[:-1]
        response_str = "\n".join(lines).strip()
    start = response_str.find("{")
    end = response_str.rfind("}")
    if start != -1 and end != -1:
        response_str = response_str[start:end+1]
    return response_str

def generate_visualization_code(prompt: str, df: Optional[pd.DataFrame] = None) -> str:
    if df is None:
        system_message = (
            "It responds in JSON format with two attributes:\n"
            " - 'visualization_code': must contain only the chartOptions object from HighchartJS and must not contain expressions that do not accept the JSON format.\n"
            " - 'visualization_explanation': must contain only the explanation of the chart.\n\n"
            "Please follow exactly that JSON structure without extra text.\n\n"
        )
    else:
        df_str = df.to_string()
        system_message = (
            "It responds in JSON format with two attributes:\n"
            " - 'visualization_code': must contain only the chartOptions object from HighchartJS and must not contain expressions that do not accept the JSON format.\n"
            " - 'visualization_explanation': must contain only the explanation of the chart.\n\n"
            "Please follow exactly that JSON structure without extra text.\n\n"
            f"Use this dataframe to create the chart: \n{df_str}\n\n"
        )

    text = f"{system_message}Prompt:\n{prompt}\n\nResponse:\n"
    inputs = tokenizer(text, return_tensors="pt").to(model.device)
    
    with torch.no_grad():
        output = model.generate(
            **inputs,
            max_new_tokens=4096,
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

        model_response = generate_visualization_code(prompt, df)
            
        print("Respuesta original del modelo:")
        print(model_response)
        
        cleaned_response = clean_json_response(model_response)
        print("Respuesta limpiada:")
        print(cleaned_response)
        data = cleaned_response
        """try:
            response_json = json.loads(cleaned_response)
            print('paso 1')
            visualization_code = response_json.get('visualization_code', '{}')
            print('paso 2')
            visualization_explanation = response_json.get('visualization_explanation', '')
            print('paso 3')
        except json.JSONDecodeError as err:
            print("Error al parsear JSON:", err)
            visualization_code = {}
            visualization_explanation = "El modelo devolvió un formato inesperado.\""""

    else:
        visualization_code = json.dumps({})
        visualization_explanation = "Respuesta normal: " + (prompt or "Sin texto")
        data = {
            'visualization_code': visualization_code,
            'visualization_explanation': visualization_explanation
        }
    
    print('respuesta final:\n')
    print(data)
    return data


@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    if path and path != "favicon.ico":
        return send_from_directory('static', path)
    else:
        return send_from_directory('static', 'index.html')

if __name__ == '__main__':
    app.run(debug=True,  use_reloader=False)
