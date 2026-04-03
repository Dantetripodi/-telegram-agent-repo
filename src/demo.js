import { ingestMessage } from "./agent.js";
import { getItems } from "./storage.js";

const samples = [
  {
    text: "Guardar este repo para reutilizar despues en un dashboard admin https://github.com/example/admin-kit"
  },
  {
    text: "Idea: hacer un mini producto para ordenar todos los links que me mando por whatsapp"
  },
  {
    text: "Recordame hablar con Nico el viernes por el deploy"
  }
];

for (const sample of samples) {
  const result = await ingestMessage(sample);
  console.log("\nEntrada:");
  console.log(sample.text);
  console.log("Respuesta:");
  console.log(result.reply);
}

const items = await getItems();
console.log(`\nItems guardados: ${items.length}`);
