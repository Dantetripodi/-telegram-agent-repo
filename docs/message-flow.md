# Flujo de mensajes

## Flujo base

1. entra un mensaje por WhatsApp o por el endpoint local
2. el agente normaliza el texto
3. detecta links y contexto
4. clasifica la entrada
5. arma un resumen corto
6. genera tags
7. guarda el item
8. responde con confirmacion corta

## Reglas conversacionales del MVP

- respuestas cortas
- no inventar contexto que no aparezca en el mensaje
- si hay link, priorizar guardarlo con contexto
- si detecta repo GitHub, marcarlo como `resource/repo`
- si no entiende, guardar como `note`

## Respuesta ideal del agente

- confirma que guardo algo
- dice bajo que categoria lo guardo
- si hay un link, menciona que lo registro
- si detecta siguiente accion, la propone

## Ejemplos

### Ejemplo 1

Entrada:

`Guardame este repo para usar su auth despues https://github.com/acme/auth-starter`

Salida:

`Listo, lo guarde como recurso tipo repo. Tags: github, auth. Siguiente paso sugerido: revisar si la autenticacion te sirve para reutilizarla.`

### Ejemplo 2

Entrada:

`Idea: hacer un producto simple para ordenar repos guardados`

Salida:

`Listo, lo guarde como idea. Resumen: producto simple para ordenar repos guardados.`

### Ejemplo 3

Entrada:

`Recordame hablar con Nico el viernes por el deploy`

Salida:

`Listo, lo guarde como seguimiento. Tengo pendiente hablar con Nico por el deploy el viernes.`
