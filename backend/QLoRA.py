import os
import torch
from unsloth import is_bfloat16_supported
from unsloth import FastLanguageModel
import torch
import json
from datasets import load_dataset
from trl import SFTTrainer
from transformers import TrainingArguments
from unsloth import is_bfloat16_supported
from unsloth import FastLanguageModel
from datasets import Dataset, DatasetDict, Features, Value
import glob
import pandas as pd
from peft import LoraConfig, prepare_model_for_kbit_training, PeftModel, get_peft_model
from transformers import AutoModelForCausalLM, AutoTokenizer, BitsAndBytesConfig
import tensorflow as tf

torch.set_default_dtype(torch.bfloat16 if is_bfloat16_supported() else torch.float16)
os.environ["PYTORCH_CUDA_ALLOC_CONF"] = "expandable_segments:True"


max_seq_length = 1024 # Choose any! We auto support RoPE Scaling internally!
dtype = None # None for auto detection. Float16 for Tesla T4, V100, Bfloat16 for Ampere+
load_in_4bit = True # Use 4bit quantization to reduce memory usage. Can be False.
models = [
    "unsloth/mistral-7b-v0.3-bnb-4bit",     
    "unsloth/mistral-7b-instruct-v0.3-bnb-4bit",
    "unsloth/llama-3-8b-bnb-4bit",                  # probar la normal
    "unsloth/llama-3-8b-Instruct-bnb-4bit",         # probar la version que sabe seguir instrucciones code
    "unsloth/llama-3-70b-bnb-4bit",
    "unsloth/Phi-3-mini-4k-instruct",     
    "unsloth/Phi-3-medium-4k-instruct",
    "unsloth/mistral-7b-bnb-4bit",
    "unsloth/gemma-7b-bnb-4bit",
    "Qwen/Qwen2.5-Coder-7B-Instruct",
    "unsloth/Qwen2.5-Coder-3B-bnb-4bit",
    "Qwen/Qwen2.5-Coder-3B-Instruct",
    "deepseek-ai/DeepSeek-R1-Distill-Llama-8B",
    "unsloth/DeepSeek-R1-Distill-Llama-8B-unsloth-bnb-4bit",
    "Qwen/Qwen2.5-Coder-14B-Instruct",
    "unsloth/Qwen2.5-Coder-14B-Instruct"
]

# Configurar BitsAndBytes para cuantización en 4 bits
bnb_config = BitsAndBytesConfig(
    load_in_4bit=True,       # Habilitar cuantización en 4 bits
    bnb_4bit_use_double_quant=True,  # Usar doble cuantización
    bnb_4bit_quant_type="nf4",       # nf4 recomendado para entrenamiento
    bnb_4bit_compute_dtype=torch.float16  # Configurar cálculos en float16
)

# Carga el modelo con Unsloth (optimizado para entrenamiento)
model, tokenizer = FastLanguageModel.from_pretrained(
    model_name="Qwen/Qwen2.5-Coder-14B-Instruct",
    max_seq_length=max_seq_length,
    dtype=torch.bfloat16 if is_bfloat16_supported() else torch.float16,
    load_in_4bit=True,
)

# Aplica la configuración LoRA de Unsloth
model = FastLanguageModel.get_peft_model(
    model,
    r=16,  # Aumentar rango LoRA
    lora_alpha=32,
    target_modules=["q_proj", "k_proj", "v_proj", "o_proj"],
    lora_dropout=0.1, 
    use_gradient_checkpointing=True,  # Mejor integrado que enable()
)

# Verifica parámetros entrenables
model.print_trainable_parameters()

alpaca_prompt= """Below is an instruction that give a prompt. Write a response that appropriately completes the request and gives you a visualization code and the corresponding explanation.

### visualization _prompt:
{}

### visualization_code:
{}

### visualization_explanation:
{}"""

def formatting_prompts_func(examples, tokenizer):
    visualization_prompt = examples["visualization_prompt"]
    visualization_code = examples["visualization_code"]      # Cadena de texto (JSON)
    visualization_explanation = examples["visualization_explanation"]

    texts = []
    EOS_TOKEN = tokenizer.eos_token

    for prompt, code, explanation in zip(visualization_prompt, visualization_code, visualization_explanation):
        # Convertir el objeto visualization_code en una cadena JSON formateada (si es necesario)
        try:
            json.loads(code)
            chart_options_str = code
        except json.JSONDecodeError:
            # Si no es un JSON válido, intenta convertirlo
            chart_options_str = json.dumps(code, indent=4)

        # Formatear usando la plantilla para los nuevos datos
        text = alpaca_prompt.format(
            prompt,
            chart_options_str,  # Ahora la cadena JSON formateada
            explanation
        ) + EOS_TOKEN

        texts.append(text)

    return {"text": texts}


# Ruta a los archivos del dataset
dataset_path = "/home/roberto/Projects/ChartBot/dataset_test_2/*.json"  # Ajusta la extensión si es necesario

# Paso 1: Leer y consolidar todos los archivos JSON
data = []
json_files = glob.glob(dataset_path)

for file_path in json_files:
    with open(file_path, 'r') as f:
        try:
            # Asumiendo JSON estándar
            entries = json.load(f)
            if isinstance(entries, list):
                data.extend(entries)
            elif isinstance(entries, dict):
                data.append(entries)
            else:
                print(f"Formato desconocido en {file_path}")
        except json.JSONDecodeError as e:
            print(f"Error al leer {file_path}: {e}")

# Paso 2: Verificar y transformar los datos
for entry in data:
    # Asegurarse de que todas las claves existan
    if "visualization_prompt" not in entry:
        entry["visualization_prompt"] = ""
    if "visualization_code" not in entry:
        entry["visualization_code"] = {}
    if "visualization_explanation" not in entry:
        entry["visualization_explanation"] = ""
    
    # Convertir `visualization_code` a cadena JSON si es un dict o list
    if isinstance(entry["visualization_code"], (dict, list)):
        entry["visualization_code"] = json.dumps(entry["visualization_code"])
    else:
        entry["visualization_code"] = str(entry["visualization_code"])
    
    # Asegurarse de que los demás campos sean cadenas
    entry["visualization_prompt"] = str(entry.get("visualization_prompt", ""))
    entry["visualization_explanation"] = str(entry.get("visualization_explanation", ""))

# Paso 3: Convertir la lista de diccionarios a un DataFrame de pandas
df = pd.DataFrame(data)

# Paso 4: Definir el esquema del dataset utilizando `Features`
features = Features({
    "visualization_prompt": Value("string"),
    "visualization_code": Value("string"),  # Ahora es una cadena JSON
    "visualization_explanation": Value("string")
})

# Paso 5: Crear el objeto Dataset desde el DataFrame
dataset_aux = Dataset.from_pandas(df, features=features, preserve_index=False)

# Paso 6: Crear DatasetDict si es necesario
dataset= DatasetDict({
    "train": dataset_aux
})

print(tokenizer)

dataset = dataset.map(formatting_prompts_func, batched=True, fn_kwargs={'tokenizer': tokenizer})

split_dataset = dataset["train"].train_test_split(test_size=0.1, seed=3407)
# Crear un nuevo DatasetDict con los splits 'train' y 'validation'
dataset = DatasetDict({
    "train": split_dataset["train"],
    "validation": split_dataset["test"]  # 'test' se renombra como 'validation'
})

dataset["train"] = dataset["train"].map(
    formatting_prompts_func_2,
    batched=True,
    fn_kwargs={'tokenizer': tokenizer},
    remove_columns=["visualization_prompt", "visualization_code", "visualization_explanation"]
    if all(col in dataset["train"].column_names for col in ["visualization_prompt", "visualization_code", "visualization_explanation"])
    else None
)

# Aplicar el formateo al split de validación
dataset["validation"] = dataset["validation"].map(
    formatting_prompts_func_2,
    batched=True,
    fn_kwargs={'tokenizer': tokenizer},
    remove_columns=["visualization_prompt", "visualization_code", "visualization_explanation"]
    if all(col in dataset["validation"].column_names for col in ["visualization_prompt", "visualization_code", "visualization_explanation"])
    else None
)

# Definir los argumentos de entrenamiento ajustados
training_args = TrainingArguments(
    per_device_train_batch_size=1,                # Reducido de 2 a 1
    gradient_accumulation_steps=8,                # Ajustado para mantener el tamaño de batch efectivo
    warmup_steps=175,
    num_train_epochs=3,
    learning_rate=3e-5,
    fp16 = not is_bfloat16_supported(),  # Auto-ajustar según hardware
    bf16 = is_bfloat16_supported(),                                 # Desactivar BF16
    logging_steps=50,
    save_steps=500,
    optim="adamw_8bit",
    weight_decay=0.01,
    lr_scheduler_type="linear", # antes --> cosine
    seed=3407,
    output_dir="outputs",
    gradient_checkpointing=False,
    max_grad_norm= 0.3  # Desactivar clipping de gradiente
)


# Crear el entrenador con los splits específicos y el data collator personalizado
trainer = SFTTrainer(
    model=model,
    tokenizer=tokenizer,
    train_dataset=dataset["train"],            # Usar el split de entrenamiento
    eval_dataset=dataset["validation"],        # Usar el split de validación
    dataset_text_field="text",
    max_seq_length=max_seq_length,
    dataset_num_proc=2,
    packing=False,
    args=training_args,
)

gpu_stats = torch.cuda.get_device_properties(0)
start_gpu_memory = round(torch.cuda.max_memory_reserved() / 1024 / 1024 / 1024, 3)
max_memory = round(gpu_stats.total_memory / 1024 / 1024 / 1024, 3)
print(f"GPU = {gpu_stats.name}. Max memory = {max_memory} GB.")
print(f"{start_gpu_memory} GB of memory reserved.")

trainable_params = sum(p.numel() for p in model.parameters() if p.requires_grad)
print(f"Parámetros entrenables: {trainable_params}")


trainer_stats = trainer.train()

#@title Show final memory and time stats
used_memory = round(torch.cuda.max_memory_reserved() / 1024 / 1024 / 1024, 3)
used_memory_for_lora = round(used_memory - start_gpu_memory, 3)
used_percentage = round(used_memory         /max_memory*100, 3)
lora_percentage = round(used_memory_for_lora/max_memory*100, 3)
print(f"{trainer_stats.metrics['train_runtime']} seconds used for training.")
print(f"{round(trainer_stats.metrics['train_runtime']/60, 2)} minutes used for training.")
print(f"Peak reserved memory = {used_memory} GB.")
print(f"Peak reserved memory for training = {used_memory_for_lora} GB.")
print(f"Peak reserved memory % of max memory = {used_percentage} %.")
print(f"Peak reserved memory for training % of max memory = {lora_percentage} %.")

model.eval()  # Poner el modelo en modo de evaluación

model.save_pretrained("./output_Qwen2.5_14B_Coder_Instruct")
tokenizer.save_pretrained("./output_Qwen2.5_14B_Coder_Instruct")