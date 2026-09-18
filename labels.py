#!/usr/bin/env python3
"""
Script para criar labels automaticamente em TODOS os projetos de um
workspace do Plane (self-hosted).

Comportamento:
- Busca todos os projetos do workspace.
- Para cada projeto, busca as labels já existentes.
- Para cada label da lista LABELS abaixo:
    - Se já existir uma label com o mesmo nome (case-insensitive) -> pula, não mexe.
    - Se não existir -> cria com o nome/cor definidos.

Requisitos:
    pip install requests
"""

import sys
import time
import threading
import collections
import requests

# ----------------------------------------------------------------------
# CONFIGURAÇÃO
# ----------------------------------------------------------------------

BASE_URL = "https://plane.dokploy.mmcinfra.com"
WORKSPACE_SLUG = "main"
API_KEY = "plane_api_592a60298d9445efaab492c9cb93a54f"

# Nome do jeito que vai aparecer no Plane (emoji + nome, igual à tela de Etiquetas)
# Ajuste as cores (hex) se quiser bater 100% com o que você tem hoje.
LABELS = [
    {"name": "✨ Feature",         "color": "#F5A623"},
    {"name": "🎨 Melhoria",        "color": "#F783AC"},
    {"name": "🐛 Bug",             "color": "#12B76A"},
    {"name": "🔧 Manutenção",      "color": "#7DD3FC"},
    {"name": "👤 Suporte/Cliente", "color": "#F97316"},
    {"name": "🚨 Incidente",       "color": "#E11D48"},
    {"name": "💥 Não Planejado",   "color": "#94A3B8"},
]

# Limite máximo de requisições por minuto (janela deslizante)
MAX_REQUESTS_PER_MINUTE = 60

# ----------------------------------------------------------------------
# HTTP HELPERS
# ----------------------------------------------------------------------

SESSION = requests.Session()
SESSION.headers.update({
    "x-api-key": API_KEY,
    "Content-Type": "application/json",
})


class RateLimiter:
    """Garante no máximo `max_per_minute` chamadas em qualquer janela de 60s."""

    def __init__(self, max_per_minute: int):
        self.max_per_minute = max_per_minute
        self.calls = collections.deque()
        self.lock = threading.Lock()

    def wait(self):
        with self.lock:
            now = time.monotonic()
            # descarta chamadas com mais de 60s
            while self.calls and now - self.calls[0] >= 60:
                self.calls.popleft()

            if len(self.calls) >= self.max_per_minute:
                sleep_time = 60 - (now - self.calls[0]) + 0.05
            else:
                sleep_time = 0

        if sleep_time > 0:
            time.sleep(sleep_time)

        with self.lock:
            self.calls.append(time.monotonic())


RATE_LIMITER = RateLimiter(MAX_REQUESTS_PER_MINUTE)


def api_url(path: str) -> str:
    return f"{BASE_URL}/api/v1{path}"


def api_get(url: str, **kwargs):
    RATE_LIMITER.wait()
    return SESSION.get(url, **kwargs)


def api_post(url: str, **kwargs):
    RATE_LIMITER.wait()
    return SESSION.post(url, **kwargs)


def get_paginated(path: str):
    """Busca todos os resultados de um endpoint paginado do Plane."""
    results = []
    url = api_url(path)
    params = {"per_page": 100}
    cursor = None

    while True:
        if cursor:
            params["cursor"] = cursor
        resp = api_get(url, params=params, timeout=30)
        resp.raise_for_status()
        data = resp.json()

        # Plane retorna paginado em "results" (com next_cursor) OU lista direta
        if isinstance(data, dict) and "results" in data:
            results.extend(data["results"])
            if data.get("next_page_results") is False or not data.get("next_cursor"):
                break
            cursor = data["next_cursor"]
        elif isinstance(data, list):
            results.extend(data)
            break
        else:
            results.append(data)
            break

    return results


def get_projects():
    return get_paginated(f"/workspaces/{WORKSPACE_SLUG}/projects/")


def get_labels(project_id: str):
    return get_paginated(f"/workspaces/{WORKSPACE_SLUG}/projects/{project_id}/labels/")


def create_label(project_id: str, name: str, color: str):
    url = api_url(f"/workspaces/{WORKSPACE_SLUG}/projects/{project_id}/labels/")
    resp = api_post(url, json={"name": name, "color": color}, timeout=30)
    resp.raise_for_status()
    return resp.json()


# ----------------------------------------------------------------------
# MAIN
# ----------------------------------------------------------------------

def main():
    try:
        projects = get_projects()
    except requests.HTTPError as e:
        print(f"Erro ao buscar projetos: {e}\nResposta: {e.response.text}")
        sys.exit(1)

    if not projects:
        print("Nenhum projeto encontrado no workspace.")
        return

    print(f"Encontrados {len(projects)} projeto(s) no workspace '{WORKSPACE_SLUG}'.\n")

    for project in projects:
        project_id = project.get("id")
        project_name = project.get("name", project_id)
        print(f"== Projeto: {project_name} ==")

        try:
            existing_labels = get_labels(project_id)
        except requests.HTTPError as e:
            print(f"  ! Erro ao buscar labels: {e}")
            continue

        existing_names = {lbl["name"].strip().lower() for lbl in existing_labels}

        for label in LABELS:
            name = label["name"]
            color = label["color"]

            if name.strip().lower() in existing_names:
                print(f"  - '{name}' já existe, mantendo como está.")
                continue

            try:
                create_label(project_id, name, color)
                print(f"  + '{name}' criada.")
            except requests.HTTPError as e:
                print(f"  ! Erro ao criar '{name}': {e} -> {e.response.text}")

        print()

    print("Concluído.")


if __name__ == "__main__":
    main()j