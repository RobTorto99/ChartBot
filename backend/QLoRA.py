import os
import torch
from unsloth import is_bfloat16_supported
from unsloth import FastLanguageModel
import torch
import json
from trl import SFTTrainer
from transformers import TrainingArguments
from unsloth import is_bfloat16_supported
from unsloth import FastLanguageModel
from datasets import Dataset, DatasetDict, Features, Value
import glob
import pandas as pd
from transformers import BitsAndBytesConfig


torch.set_default_dtype(torch.bfloat16 if is_bfloat16_supported() else torch.float16)
os.environ["PYTORCH_CUDA_ALLOC_CONF"] = "expandable_segments:True"

max_seq_length = 1024 

# Configurar BitsAndBytes para cuantización en 4 bits
bnb_config = BitsAndBytesConfig(
    load_in_4bit=True, 
    bnb_4bit_use_double_quant=True,
    bnb_4bit_quant_type="nf4",
    bnb_4bit_compute_dtype=torch.float16 
)

model, tokenizer = FastLanguageModel.from_pretrained(
    model_name="unsloth/Qwen2.5-Coder-7B-Instruct",
    max_seq_length=max_seq_length,
    dtype=torch.bfloat16 if is_bfloat16_supported() else torch.float16,
    load_in_4bit=True,
)

model = FastLanguageModel.get_peft_model(
    model,
    r=16,
    lora_alpha=32,
    target_modules=["q_proj", "k_proj", "v_proj", "o_proj"],
    lora_dropout=0.1, 
    use_gradient_checkpointing=True,
)

model.print_trainable_parameters()

alpaca_prompt= """Below is an instruction that give a prompt. Write a response that appropriately completes the request and gives you a visualization code and the corresponding explanation.

### visualization_prompt:
{}

### visualization_code:
{}

### visualization_explanation:
{}"""

def formatting_prompts_func(examples, tokenizer):
    visualization_prompt = examples["visualization_prompt"]
    visualization_code = examples["visualization_code"] 
    visualization_explanation = examples["visualization_explanation"]

    texts = []
    EOS_TOKEN = tokenizer.eos_token

    for prompt, code, explanation in zip(visualization_prompt, visualization_code, visualization_explanation):
        try:
            json.loads(code)
            chart_options_str = code
        except json.JSONDecodeError:
            chart_options_str = json.dumps(code, indent=4)

        text = alpaca_prompt.format(
            prompt,
            chart_options_str,
            explanation
        ) + EOS_TOKEN

        texts.append(text)

    return {"text": texts}


dataset_path = "dataset_test_2/*.json" 


data = []
json_files = glob.glob(dataset_path)

for file_path in json_files:
    with open(file_path, 'r') as f:
        try:
            entries = json.load(f)
            if isinstance(entries, list):
                data.extend(entries)
            elif isinstance(entries, dict):
                data.append(entries)
            else:
                print(f"Formato desconocido en {file_path}")
        except json.JSONDecodeError as e:
            print(f"Error al leer {file_path}: {e}")

for entry in data:
    if "visualization_prompt" not in entry:
        entry["visualization_prompt"] = ""
    if "visualization_code" not in entry:
        entry["visualization_code"] = {}
    if "visualization_explanation" not in entry:
        entry["visualization_explanation"] = ""

    if isinstance(entry["visualization_code"], (dict, list)):
        entry["visualization_code"] = json.dumps(entry["visualization_code"])
    else:
        entry["visualization_code"] = str(entry["visualization_code"])
    
    entry["visualization_prompt"] = str(entry.get("visualization_prompt", ""))
    entry["visualization_explanation"] = str(entry.get("visualization_explanation", ""))

df = pd.DataFrame(data)

features = Features({
    "visualization_prompt": Value("string"),
    "visualization_code": Value("string"),
    "visualization_explanation": Value("string")
})

dataset_aux = Dataset.from_pandas(df, features=features, preserve_index=False)

dataset= DatasetDict({
    "train": dataset_aux
})

print(tokenizer)

dataset = dataset.map(formatting_prompts_func, batched=True, fn_kwargs={'tokenizer': tokenizer})

split_dataset = dataset["train"].train_test_split(test_size=0.1, seed=3407)
dataset = DatasetDict({
    "train": split_dataset["train"],
    "validation": split_dataset["test"]
})

dataset["train"] = dataset["train"].map(
    formatting_prompts_func,
    batched=True,
    fn_kwargs={'tokenizer': tokenizer},
    remove_columns=["visualization_prompt", "visualization_code", "visualization_explanation"]
    if all(col in dataset["train"].column_names for col in ["visualization_prompt", "visualization_code", "visualization_explanation"])
    else None
)

dataset["validation"] = dataset["validation"].map(
    formatting_prompts_func,
    batched=True,
    fn_kwargs={'tokenizer': tokenizer},
    remove_columns=["visualization_prompt", "visualization_code", "visualization_explanation"]
    if all(col in dataset["validation"].column_names for col in ["visualization_prompt", "visualization_code", "visualization_explanation"])
    else None
)

training_args = TrainingArguments(
    per_device_train_batch_size=1,                
    gradient_accumulation_steps=8,             
    warmup_steps=175,
    num_train_epochs=3,
    learning_rate=3e-5,
    fp16 = not is_bfloat16_supported(),  
    bf16 = is_bfloat16_supported(),  
    logging_steps=50,
    save_steps=500,
    optim="adamw_8bit",
    weight_decay=0.01,
    lr_scheduler_type="linear",
    seed=3407,
    output_dir="output_logs_QLoRA",
    gradient_checkpointing=False,
    max_grad_norm= 0.3
)


trainer = SFTTrainer(
    model=model,
    tokenizer=tokenizer,
    train_dataset=dataset["train"], 
    eval_dataset=dataset["validation"], 
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

model.eval() 

model.save_pretrained("./output_QLoRA")
tokenizer.save_pretrained("./output_QLoRA")