import os
import torch
from unsloth import is_bfloat16_supported
from unsloth import FastLanguageModel
from trl import SFTTrainer
from transformers import TrainingArguments
from transformers import BitsAndBytesConfig
from obtener_dataset import obtener_dataset

torch.set_default_dtype(torch.bfloat16 if is_bfloat16_supported() else torch.float16)
os.environ["PYTORCH_CUDA_ALLOC_CONF"] = "expandable_segments:True"

max_seq_length = 4096
dtype = None

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

dataset = obtener_dataset(tokenizer)

training_args = TrainingArguments(
    per_device_train_batch_size=1, 
    gradient_accumulation_steps=8,
    warmup_steps=85,
    num_train_epochs=3,
    learning_rate=3e-5,
    fp16 = not is_bfloat16_supported(), 
    bf16 = is_bfloat16_supported(),
    logging_steps=50,
    save_steps=150,
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

model.save_pretrained("output_QLoRA")
tokenizer.save_pretrained("output_QLoRA")