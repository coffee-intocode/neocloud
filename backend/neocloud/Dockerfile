FROM python:3.12-slim AS build

RUN pip install --no-cache-dir uv

WORKDIR /app

COPY pyproject.toml ./
RUN uv pip install --system --no-cache -r pyproject.toml

COPY chatbot ./chatbot
RUN uv pip install --system --no-cache -e .

FROM python:3.12-slim

WORKDIR /app

COPY --from=build /usr/local/lib/python3.12/site-packages /usr/local/lib/python3.12/site-packages
COPY --from=build /usr/local/bin /usr/local/bin
COPY --from=build /app/chatbot ./chatbot

EXPOSE 8080

CMD ["uvicorn", "chatbot.app:app", "--host", "0.0.0.0", "--port", "8080"]
