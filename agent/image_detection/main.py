import os
from dotenv import load_dotenv
from huggingface_hub import InferenceClient
from langchain_google_genai import ChatGoogleGenerativeAI
from image_analysis import metadata_score, fft_score, noise_score, edge_score

load_dotenv()

HF_TOKEN = os.getenv("HUGGINGFACEHUB_ACCESS_TOKEN")

# -----------------------------
# AGENT 1: DETECTOR
# -----------------------------
detector = InferenceClient(
    model="dima806/deepfake_vs_real_image_detection",
    token=HF_TOKEN
)

# -----------------------------
# AGENT 2: CAPTION
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
# CAPTION SIGNAL (FIXED)
# -----------------------------
def get_caption_signal(image_path):
    try:
        resp = captioner.image_to_text(image_path)

        if isinstance(resp, list) and len(resp) > 0:
            caption = resp[0].get("generated_text", "")
        elif isinstance(resp, dict):
            caption = resp.get("generated_text", "")
        else:
            caption = str(resp)

        if not caption.strip():
            raise ValueError("Empty caption")

    except Exception as e:
        print("Caption failed:", e)
        return None, None  # important

    caption_lower = caption.lower()

    ai_keywords = [
        "illustration", "painting", "render",
        "digital art", "3d", "anime", "cgi"
    ]

    real_keywords = [
        "person", "street", "car",
        "tree", "building"
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
    fft = min(fft, 0.6)  # prevent over-influence

    noise = noise_score(image_path)
    edge = edge_score(image_path)

    caption, caption_score = get_caption_signal(image_path)

    # -------- Dynamic Weights --------
    weights = {
        "model": 0.5 if m_score > 0.8 else 0.3,
        "meta": 0.1,
        "fft": 0.1,
        "noise": 0.1,
        "edge": 0.1,
        "caption": 0.2
    }

    # -------- Handle caption failure --------
    if caption is None:
        weights["caption"] = 0

        total = sum(weights.values())
        weights = {k: v / total for k, v in weights.items()}

    # -------- Fusion --------
    final_score = (
        weights["model"] * m_score +
        weights["meta"] * meta +
        weights["fft"] * fft +
        weights["noise"] * noise +
        weights["edge"] * edge +
        (weights["caption"] * caption_score if caption_score is not None else 0)
    )

    # -------- Disagreement handling --------
    if caption_score is not None and abs(m_score - caption_score) > 0.5:
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
    - Model score is strong but not final
    - Caption reflects semantic reality
    - Missing metadata is common
    - Weak signals (FFT, noise) are supportive only
    - Conflicts reduce confidence

    Return STRICT JSON:
    {{
        "verdict": "AI-generated / Real / Uncertain",
        "confidence": "High / Medium / Low",
        "reason": "short explanation"
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
            "caption_score": round(caption_score, 3) if caption_score else None
        },
        "caption": caption if caption else "N/A",
        "analysis": analysis
    }


# -----------------------------
# RUN
# -----------------------------
if __name__ == "__main__":
    result = detect_image("p4.png")

    for k, v in result.items():
        print(f"{k}: {v}")