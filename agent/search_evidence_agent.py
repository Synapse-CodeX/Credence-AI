from agent_state import AgentState,  EvidenceSource
import os
from dotenv import load_dotenv   
from tavily import TavilyClient
load_dotenv()
search_client = TavilyClient(api_key=os.getenv("TAVILY_API_KEY"))

def search_evidence(state: AgentState) -> dict:
    print("\n[Agent 2] Searching for evidence...")

    evidence: dict[int, list[EvidenceSource]] = {}

    # -----------------------------
    # DOMAIN FILTERS
    # -----------------------------
    bad_domains = [
        "facebook", "instagram", "reddit", "yelp", "example",
        "twitter", "tiktok", "quora", "medium", "youtube",
        "pinterest", "tumblr", "vk", "weibo", "dailymotion",
        "flickr", "livejournal", "myspace", "westeamahead"
    ]

    trusted_domains = [
        "bbc", "reuters", "who", "un", "gov", "nature",
        "apnews", "npr", "wikipedia", "sciencedaily",
        "nih", "cdc", "sciencealert", "nasa", "arxiv",
        "ssrn", "jstor", "springer", "elsevier",
        "tandfonline", "sciencemag", "plos",
        "frontiersin", "biorxiv", "nationalgeographic"
    ]

    stopwords = {
        "is", "are", "was", "were", "the", "a", "an",
        "in", "on", "at", "of", "for", "to", "and",
        "does", "do", "did", "can", "could", "should",
        "has", "have", "had"
    }

    def extract_keywords(text: str):
        words = text.lower().split()
        return [w for w in words if w not in stopwords and len(w) > 2][:6]

    for claim_obj in state.claims:
        claim_text = claim_obj.claim
        claim_type = claim_obj.type
        confidence = claim_obj.confidence

        if confidence < 0.5:
            continue

        keywords = extract_keywords(claim_text)
        base_query = " ".join(keywords)

        # -----------------------------
        # QUERY STRATEGY (IMPROVED)
        # -----------------------------
        if claim_type == "numerical":
            queries = [
                f"{base_query} statistics data",
                f"{base_query} official report",
            ]
        elif claim_type == "temporal":
            queries = [
                f"{base_query} timeline history",
                f"{base_query} date event",
            ]
        elif claim_type == "entity":
            queries = [
                f"{base_query} who is",
                f"{base_query} details information",
            ]
        else:
            queries = [
                base_query,
                f"{base_query} facts explanation",
            ]

        # -----------------------------
        # SEARCH
        # -----------------------------
        all_results = []

        for q in queries:
            try:
                res = search_client.search(query=q, max_results=4)
                results = res.get("results", [])

                for r in results:
                    url = r.get("url", "")

                    if any(b in url for b in bad_domains):
                        continue

                    r["query_used"] = q
                    all_results.append(r)

            except Exception as e:
                print(f"Search error for '{q}':", e)

        # -----------------------------
        # DEDUPLICATE
        # -----------------------------
        seen_urls = set()
        unique_results = []

        for r in all_results:
            url = r.get("url")
            if url and url not in seen_urls:
                seen_urls.add(url)
                unique_results.append(r)

        # -----------------------------
        # 🔥 RELEVANCE FILTER (NEW)
        # -----------------------------
        def is_relevant(r):
            content = (r.get("content") or "").lower()
            title = (r.get("title") or "").lower()

            match = sum(1 for k in keywords if k in content or k in title)

            return match >= max(2, len(keywords) // 2)

        filtered_results = [r for r in unique_results if is_relevant(r)]

        if len(filtered_results) < 2:
            filtered_results = unique_results  # fallback

        # -----------------------------
        # 🔥 RANKING (UPGRADED)
        # -----------------------------
        def score_result(r):
            score = 0
            content = (r.get("content") or "").lower()
            title = (r.get("title") or "").lower()
            url = r.get("url") or ""

            # strong keyword overlap
            score += sum(2 for k in keywords if k in content)

            # title importance
            if any(k in title for k in keywords):
                score += 3

            # trusted boost
            if any(t in url for t in trusted_domains):
                score += 4

            return score

        ranked = sorted(filtered_results, key=score_result, reverse=True)

        # -----------------------------
        # CONVERT TO PYDANTIC
        # -----------------------------
        evidence[claim_obj.id] = [
            EvidenceSource(
                title=r.get("title", ""),
                content=r.get("content", ""),
                url=r.get("url", ""),
                score=r.get("score"),
                query_used=r.get("query_used"),
                credibility=1.0 if any(t in (r.get("url") or "") for t in trusted_domains) else 0.5
            )
            for r in ranked[:5]
        ]

    print("Evidence collected.")
    return {"evidence": evidence}
