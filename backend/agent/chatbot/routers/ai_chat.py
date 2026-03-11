"""Stateless AI chat router."""

from typing import Literal

from fastapi import APIRouter, Request, Response, status
from pydantic import BaseModel, Field, ValidationError
from pydantic.alias_generators import to_camel
from pydantic_ai.builtin_tools import (
    AbstractBuiltinTool,
    CodeExecutionTool,
    ImageGenerationTool,
    WebSearchTool,
)
from pydantic_ai.ui.vercel_ai import VercelAIAdapter

from ..agent import agent

router = APIRouter(prefix='/chat', tags=['chat'])

AIModelID = Literal[
    'anthropic:claude-sonnet-4-5',
    'openai-responses:gpt-5',
    'google-gla:gemini-2.5-pro',
]
BuiltinToolID = Literal['web_search', 'image_generation', 'code_execution']


class AIModel(BaseModel):
    id: AIModelID
    name: str
    builtin_tools: list[BuiltinToolID]


class BuiltinTool(BaseModel):
    id: BuiltinToolID
    name: str


BUILTIN_TOOL_DEFS: list[BuiltinTool] = [
    BuiltinTool(id='web_search', name='Web Search'),
    BuiltinTool(id='code_execution', name='Code Execution'),
    BuiltinTool(id='image_generation', name='Image Generation'),
]

BUILTIN_TOOLS: dict[BuiltinToolID, AbstractBuiltinTool] = {
    'web_search': WebSearchTool(),
    'code_execution': CodeExecutionTool(),
    'image_generation': ImageGenerationTool(),
}

AI_MODELS: list[AIModel] = [
    AIModel(
        id='anthropic:claude-sonnet-4-5',
        name='Claude Sonnet 4.5',
        builtin_tools=['web_search', 'code_execution'],
    ),
    AIModel(
        id='openai-responses:gpt-5',
        name='GPT 5',
        builtin_tools=['web_search', 'code_execution', 'image_generation'],
    ),
    AIModel(
        id='google-gla:gemini-2.5-pro',
        name='Gemini 2.5 Pro',
        builtin_tools=['web_search', 'code_execution'],
    ),
]


class ConfigureFrontend(BaseModel, alias_generator=to_camel, populate_by_name=True):
    models: list[AIModel]
    builtin_tools: list[BuiltinTool]


class ChatRequestExtra(BaseModel, extra='ignore', alias_generator=to_camel):
    model: AIModelID | None = None
    builtin_tools: list[BuiltinToolID] = Field(default_factory=list)


@router.get('/configure', response_model=ConfigureFrontend)
async def configure_frontend() -> ConfigureFrontend:
    return ConfigureFrontend(models=AI_MODELS, builtin_tools=BUILTIN_TOOL_DEFS)


@router.post('/stream')
async def ai_chat(request: Request) -> Response:
    try:
        adapter = await VercelAIAdapter.from_request(request, agent=agent)
    except ValidationError as error:  # pragma: no cover
        return Response(
            content=error.json(),
            media_type='application/json',
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        )

    extra_data = ChatRequestExtra.model_validate(
        adapter.run_input.__pydantic_extra__ or {}
    )

    return adapter.streaming_response(
        adapter.run_stream(
            model=extra_data.model,
            builtin_tools=[
                BUILTIN_TOOLS[tool_id] for tool_id in extra_data.builtin_tools
            ],
        )
    )
