import torch
from unsloth import FastLanguageModel
from peft import PeftModel
from transformers import AutoTokenizer

# Carga el modelo base
base_model, tokenizer = FastLanguageModel.from_pretrained(
    "unsloth/Qwen2.5-Coder-7B-Instruct",
    load_in_4bit=True,
    dtype=torch.float16,
    max_seq_length=1024,
)

# Aplica la misma configuración de LoRA usada en entrenamiento
base_model = FastLanguageModel.get_peft_model(
    base_model,
    r=16,
    lora_alpha=32,
    lora_dropout=0.1,
    target_modules=["q_proj", "k_proj", "v_proj", "o_proj"],
    use_gradient_checkpointing=True
)

# Carga los pesos entrenados (guardados con trainer.save_model(...) o model.save_pretrained(...))
model = PeftModel.from_pretrained(base_model, "/home/roberto/Projects/ChartBot/modelo_v1")

# Ajuste para inferencia con Unsloth (si pide).
model = FastLanguageModel.for_inference(model)

# Función de inferencia
def generate_visualization_code(prompt):
    system_message = (
        "It responds in JSON format with two attributes:\n"
        " - 'visualization_code': must contain only the chartOptions object from HighchartJS.\n"
        " - 'visualization_explanation': must contain only the explanation of the chart.\n\n"
        "Please follow exactly that JSON structure without extra text.\n\n"
    )
    text = f"{system_message}Prompt:\n{prompt}\n\nResponse:\n"
    inputs = tokenizer(text, return_tensors="pt").to(model.device)
    
    with torch.no_grad():
        output = model.generate(
            **inputs,
            max_new_tokens=1024,
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

