import os
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
# MODEL SCORE
# -----------------------------
def get_model_score(image_path):
    result = detector.image_classification(image_path)
    print("Model result:", result)

    return next(
        (x.score for x in result if x.label.lower() == "fake"),
        0.5
    )


# -----------------------------
# CAPTION SIGNAL
# -----------------------------
def get_caption_signal(image_path):
    try:
        resp = captioner.image_to_text(image_path)
        print("Caption response:", resp)

        # Robust extraction
        if isinstance(resp, list) and len(resp) > 0:
            caption = resp[0].get("generated_text", "")
        elif isinstance(resp, dict):
            caption = resp.get("generated_text", "")
        else:
            caption = str(resp)

    except Exception as e:
        print("Caption error:", e)
        return "unknown scene", 0.5

    caption_lower = caption.lower()

    ai_keywords = [
        "illustration", "painting", "render",
        "digital art", "3d", "anime", "cgi"
    ]

    real_keywords = [
        "photo", "person", "man", "woman",
        "street", "car", "tree", "building"
    ]

    score = 0.5

    if any(k in caption_lower for k in ai_keywords):
        score += 0.2

    if any(k in caption_lower for k in real_keywords):
        score -= 0.2

    score = max(0.0, min(1.0, score))

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

    # -------- Dynamic weighting --------
    model_weight = 0.5 if m_score > 0.8 else 0.3

    remaining_weight = 1 - model_weight
    other_weight = remaining_weight / 5

    final_score = (
        model_weight * m_score +
        other_weight * meta +
        other_weight * fft +
        other_weight * noise +
        other_weight * edge +
        other_weight * caption_score
    )

    # -------- Disagreement handling --------
    if abs(m_score - caption_score) > 0.5:
        final_score = (final_score + 0.5) / 2

    # -------- LLM reasoning --------
    prompt = f"""
    You are a digital forensic analyst.

    Signals:
    - Model score: {m_score}
    - Metadata: {meta}
    - FFT: {fft}
    - Noise: {noise}
    - Edge: {edge}
    - Caption: "{caption}"
    - Caption score: {caption_score}
    - Final score: {final_score}

    Rules:
    - High model score alone is NOT enough
    - Caption reflects semantic reality
    - Missing metadata is NOT strong evidence
    - Conflicting signals reduce confidence

    Return STRICT JSON:
    {{
        "verdict": "AI-generated / Real / Uncertain",
        "confidence": "High / Medium / Low",
        "reason": "clear short explanation"
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
    result = detect_image("p5.png")

    for k, v in result.items():
        print(f"{k}: {v}")