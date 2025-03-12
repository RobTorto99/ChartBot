# obtener_dataset.py
import json
import glob
import pandas as pd
from datasets import Dataset, DatasetDict, Features, Value


alpaca_prompt = """Below is an instruction that give a prompt. Write a response that appropriately completes the request and gives you a visualization code and the corresponding explanation.

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

        text = alpaca_prompt.format(prompt, chart_options_str, explanation) + EOS_TOKEN
        texts.append(text)

    return {"text": texts}

def obtener_dataset(tokenizer):
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
    dataset = DatasetDict({"train": dataset_aux})
    
    dataset = dataset.map(formatting_prompts_func, batched=True, fn_kwargs={'tokenizer': tokenizer})
    
    split_dataset = dataset["train"].train_test_split(test_size=0.1, seed=3407)
    dataset = DatasetDict({
        "train": split_dataset["train"],
        "validation": split_dataset["test"]
    })

    remove_cols = ["visualization_prompt", "visualization_code", "visualization_explanation"] \
                  if all(col in dataset["train"].column_names for col in ["visualization_prompt", "visualization_code", "visualization_explanation"]) \
                  else None

    dataset["train"] = dataset["train"].map(
        formatting_prompts_func,
        batched=True,
        fn_kwargs={'tokenizer': tokenizer},
        remove_columns=remove_cols
    )
    dataset["validation"] = dataset["validation"].map(
        formatting_prompts_func,
        batched=True,
        fn_kwargs={'tokenizer': tokenizer},
        remove_columns=remove_cols
    )
    
    return dataset
