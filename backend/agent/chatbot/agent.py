from dotenv import load_dotenv
from pydantic_ai import Agent

load_dotenv()

agent = Agent(
    'anthropic:claude-sonnet-4-5',
    instructions="""You are Neocloud.
    This app is a barebones scaffold with no authentication, no database, and no persistent memory.
    Be direct about missing context, avoid pretending prior state exists, and give pragmatic next steps.""",
)
