from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # SightEngine
    sightengine_api_user: str
    sightengine_api_secret: str

    # LLM (switchable — any OpenAI-compatible provider)
    llm_base_url: str = "https://api.openai.com/v1"
    llm_api_key: str = ""
    llm_model_fast: str = "gpt-4o-mini"
    llm_model_reasoning: str = "gpt-4o"
    openai_api_key: str = ""

    # Search
    tavily_api_key: str = ""

    # InsForge
    insforge_url: str = ""
    insforge_api_key: str = ""

    # App
    cors_origins: str = "http://localhost:5173,http://localhost:3000"
    debug: bool = True

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8", "extra": "ignore"}


settings = Settings()
