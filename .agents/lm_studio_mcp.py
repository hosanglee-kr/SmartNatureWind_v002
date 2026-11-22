import os
from mcp.server.mcpserver import MCPServer
from openai import OpenAI

BASE_URL = os.environ.get("OPENAI_BASE_URL", "http://192.168.123.108:1234/v1")
API_KEY = os.environ.get("OPENAI_API_KEY", "lm-studio")
DEFAULT_MODEL = os.environ.get("OPENAI_MODEL", "qwen/qwen3.5-9b")

mcp = MCPServer("lm-studio")
client = OpenAI(base_url=BASE_URL, api_key=API_KEY)


@mcp.tool()
def chat(prompt: str, system_prompt: str = "", model: str = "") -> str:
    """Send a prompt to the local LM Studio model and return its response."""
    messages = []
    if system_prompt:
        messages.append({"role": "system", "content": system_prompt})
    messages.append({"role": "user", "content": prompt})

    res = client.chat.completions.create(
        model=model or DEFAULT_MODEL,
        messages=messages,
    )
    return res.choices[0].message.content or ""


@mcp.tool()
def list_models() -> str:
    """List available models on the local LM Studio server."""
    models = client.models.list()
    return "\n".join(m.id for m in models.data)


if __name__ == "__main__":
    mcp.run()
