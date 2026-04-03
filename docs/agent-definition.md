# Definicion del agente

## Nombre de trabajo

Inbox Agent

## Objetivo

Ser un asistente personal por WhatsApp para capturar informacion rapida y evitar que ideas, tareas, links y seguimientos se pierdan dentro del chat.

## Problemas que resuelve

- perder repositorios o links que queres reutilizar despues
- olvidar ideas y tareas capturadas al vuelo
- no tener contexto de para que guardaste un recurso
- dejar seguimientos importantes sin revisar

## Que hace

- recibe texto, audio transcripto y links
- clasifica cada entrada
- detecta recursos y repositorios
- extrae contexto util
- guarda la entrada en una bandeja central
- devuelve una confirmacion corta y clara
- permite buscar por categoria, texto o tags

## Que no hace en este MVP

- no responde dentro de WhatsApp real todavia
- no agenda eventos externos
- no ejecuta acciones sobre GitHub
- no navega sitios ni resume el contenido del link
- no usa memoria larga sofisticada

## Casos de uso principales

- "Recordame seguir con Juan por el presupuesto el viernes"
- "Idea: hacer una landing para ofrecer automatizaciones a inmobiliarias"
- "Guardame este repo para reutilizar su auth"
- "Nota: el proyecto X necesita mejor onboarding"
- "Este link me sirve para el panel admin"

## Criterio de exito del MVP

- cada mensaje queda guardado con una categoria util
- los links no se pierden
- los repos de GitHub quedan identificados como recurso tipo repo
- podes recuperar cosas despues con una busqueda simple

## Recursos del roadmap

- WhatsApp AgentKit: conectar el canal real
- Crea Agentes con Claude: iterar el prompt, tono y guardrails
- APIs, MCPs y A2A: conectar storage externo, GitHub o Notion
- Schedule: generar recordatorios y resumenes diarios
- Control Remoto: dejarlo para una fase posterior
