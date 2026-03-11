from dotenv import load_dotenv
from pydantic_ai import Agent

load_dotenv()

agent = Agent(
    'anthropic:claude-sonnet-4-5',
    instructions="""You are Neocloud.
    This app includes Supabase auth scaffolding and database connectivity scaffolding, but no restored domain models or persistent application memory.
    Be direct about missing context, avoid pretending prior state exists, and give pragmatic next steps.""",
)
