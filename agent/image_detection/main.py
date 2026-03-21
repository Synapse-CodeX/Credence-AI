import os
from urllib import response
import numpy as np
from dotenv import load_dotenv
from huggingface_hub import InferenceClient
from langchain_google_genai import ChatGoogleGenerativeAI
from image_analysis import metadata_score, fft_score, noise_score, edge_score

load_dotenv()

HF_TOKEN = os.getenv("HUGGINGFACEHUB_ACCESS_TOKEN")

# -----------------------------
# AGENT 1: FAKE DETECTOR
# -----------------------------
detector = InferenceClient(
    model="dima806/deepfake_vs_real_image_detection",
    token=HF_TOKEN
)

# -----------------------------
# AGENT 2: IMAGE CAPTIONING
# -----------------------------
captioner = InferenceClient(
    model="nlpconnect/vit-gpt2-image-captioning",
    token=HF_TOKEN
)

# -----------------------------
# LLM
# -----------------------------
llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash")


# -----------------------------
# MODEL SCORE (FIXED)
# -----------------------------
def get_model_score(image_path):
    result = detector.image_classification(image_path)
    print("Model inference result:", result)
    return next(x.score for x in result if x.label.lower() == "fake")


# -----------------------------
# CAPTION ANALYSIS (NEW)
# -----------------------------
def get_caption_signal(image_path):
    response = captioner.image_to_text(image_path)
    print("Captioning response of second agent:", response)
    if isinstance(response, list):
      caption = response[0].get("generated_text", "")
    else:
      caption = str(response)
    suspicious_keywords = [
        "illustration", "painting", "render",
        "digital art", "3d", "anime", "cgi"
    ]

    score = 0.3  # base neutral

    if any(word in caption.lower() for word in suspicious_keywords):
        score = 0.7  # more likely AI

    return caption, score


# -----------------------------
# MAIN DETECTION
# -----------------------------
def detect_image(image_path):

    # -------- Signals --------
    m_score = get_model_score(image_path)
    meta = metadata_score(image_path)
    fft = fft_score(image_path)
    noise = noise_score(image_path)
    edge = edge_score(image_path)

    caption, caption_score = get_caption_signal(image_path)

    # -------- Improved Fusion --------
    final_score = (
        0.30 * m_score +
        0.15 * meta +
        0.15 * fft +
        0.10 * noise +
        0.10 * edge +
        0.20 * caption_score
    )

    # -------- LLM Reasoning --------
    prompt = f"""
    You are a digital image forensic expert.

    Signals:
    - Model score: {m_score}
    - Metadata score: {meta}
    - FFT score: {fft}
    - Noise score: {noise}
    - Edge score: {edge}
    - Caption: "{caption}"
    - Caption suspicion score: {caption_score}
    - Final score: {final_score}

    Rules:
    - Model score is important but not final
    - Natural captions → likely real
    - Artificial captions → possible AI
    - Missing metadata alone is NOT proof of AI

    Give STRICT JSON:
    {{
        "verdict": "AI-generated / Real / Uncertain",
        "confidence": "High / Medium / Low",
        "reason": "clear explanation"
    }}
    """

    analysis = llm.invoke(prompt).content

    return {
        "final_ai_probability": round(final_score, 3),
        "signals": {
            "model": round(m_score, 3),
            "metadata": round(meta, 3),
            "fft": round(fft, 3),
            "noise": round(noise, 3),
            "edge": round(edge, 3),
            "caption_score": round(caption_score, 3)
        },
        "caption": caption,
        "analysis": analysis
    }


# -----------------------------
# RUN
# -----------------------------
if __name__ == "__main__":
    result = detect_image("p4.png")

    for k, v in result.items():
        print(f"{k}: {v}")