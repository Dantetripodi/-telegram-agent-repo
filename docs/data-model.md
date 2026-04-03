# Categorias y estructura de datos

## Categorias principales

- `task`
- `idea`
- `reminder`
- `follow_up`
- `note`
- `resource`

## Subtipos de recurso

- `repo`
- `article`
- `video`
- `tool`
- `documentation`
- `reference`

## Estructura de cada item

```json
{
  "id": "itm_001",
  "createdAt": "2026-04-02T19:30:00.000Z",
  "source": "whatsapp",
  "rawInput": "Guardar este repo para auth https://github.com/example/repo",
  "normalizedText": "Guardar este repo para auth https://github.com/example/repo",
  "category": "resource",
  "resourceType": "repo",
  "summary": "Repo guardado para auth",
  "project": "sin-proyecto",
  "tags": ["repo", "github", "auth"],
  "priority": "normal",
  "status": "open",
  "followUpDate": null,
  "links": [
    {
      "url": "https://github.com/example/repo",
      "kind": "github_repo"
    }
  ],
  "suggestedNextAction": "Revisar si la autenticacion sirve para reutilizarla en otro proyecto"
}
```

## Campos clave

- `category`: tipo principal
- `resourceType`: solo aplica si `category` es `resource`
- `summary`: lo que deberias entender rapido al buscar despues
- `project`: a que proyecto se asocia si se detecta
- `tags`: recuperacion rapida por tema
- `status`: `open`, `reviewed`, `done`, `archived`
- `followUpDate`: fecha detectada o definida manualmente
- `links`: URLs detectadas con su tipo
- `suggestedNextAction`: accion minima sugerida
