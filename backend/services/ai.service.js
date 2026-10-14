const AIModel = require('../models/ai.model');
const Room = require('../models/room.model');
let OpenAIClient = null;
try {
  const OpenAI = require('openai');
  OpenAIClient = new OpenAI({ 
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: "https://openrouter.ai/api/v1", // Cambiado para usar OpenRouter
    defaultHeaders: {
      "HTTP-Referer": "https://ieslamarisma.net", // Opcional para OpenRouter
      "X-Title": "HoteIA", // Opcional para OpenRouter
    }
  });
} catch (e) {
  // Dependencia no instalada o sin clave; se usará fallback
}

// Prompt de sistema mejorado con conocimiento profundo del hotel
const getSystemPrompt = async () => {
  const rooms = await Room.getAll();
  const roomSummary = rooms.map(r => 
    `- Habitación ${r.numero_habitacion}: ${r.tipo_habitacion}, Capacidad: ${r.capacidad}, Precio: ${r.precio_noche}€/noche. ${r.descripcion}`
  ).join('\n');

  return `
Eres el recepcionista virtual inteligente de HoteIA, un hotel boutique de alta tecnología y lujo.
Tu misión es ofrecer una experiencia de usuario excepcional, respondiendo con amabilidad, precisión y profesionalidad.

CONOCIMIENTO DE HABITACIONES:
Aquí tienes el inventario actual de nuestras habitaciones:
${roomSummary}

SERVICIOS DEL HOTEL:
- WiFi: Gratuito y de alta velocidad en todo el recinto.
- Desayuno: Buffet gourmet incluido en reservas de Suite, opcional (15€) para el resto.
- Wellness: Gimnasio 24h, Piscina climatizada en la azotea y Spa (requiere reserva).
- Check-in: A partir de las 14:00. Check-out: Hasta las 12:00.
- IA: Todas las habitaciones cuentan con control domótico por voz.
- Ubicación: Centro neurálgico de la ciudad, cerca de los principales monumentos.

REGLAS DE RESPUESTA:
1. Si te preguntan por disponibilidad o precios, usa los datos de arriba.
2. Si el usuario quiere reservar, guíalo indicándole que puede ir a la sección "Buscar" o que tú mismo puedes darle opciones si te dice fechas y personas.
3. Si la pregunta no es sobre el hotel, intenta reconducir la conversación amablemente hacia los servicios de HoteIA.
4. Responde siempre en el idioma en el que te hable el usuario (español por defecto).
5. Sé conciso pero servicial. No inventes habitaciones que no estén en la lista.
`;
};

const processChatMessage = async (userId, sessionId, message) => {
  let response = "";
  const msgLower = message.toLowerCase();

  // Obtener el prompt dinámico con la info de la BD
  const systemPrompt = await getSystemPrompt();

  // OpenAI si hay clave
  if (OpenAIClient && process.env.OPENAI_API_KEY) {
    try {
      const completion = await OpenAIClient.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'google/gemini-2.0-flash-001', // Modelo recomendado en OpenRouter
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        temperature: 0.5,
      });
      response = completion.choices[0]?.message?.content?.trim() || "";
    } catch (err) {
      console.error('Error OpenAI:', err.message);
    }
  }

  // Fallback si OpenAI falla o no hay clave
  if (!response) {
    if (msgLower.includes("hola") || msgLower.includes("buenas")) {
      response = "¡Hola! Bienvenido a HoteIA. Soy tu asistente virtual. ¿Buscas habitación o tienes alguna duda sobre nuestros servicios?";
    } else if (msgLower.includes("barata") || msgLower.includes("económica")) {
      const rooms = await Room.getAll();
      const cheapest = rooms.sort((a, b) => a.precio_noche - b.precio_noche)[0];
      response = `Nuestra opción más económica es la ${cheapest.tipo_habitacion} (Hab. ${cheapest.numero_habitacion}) por solo ${cheapest.precio_noche}€ la noche. ¿Te gustaría saber más?`;
    } else if (msgLower.includes("precio") || msgLower.includes("cuánto cuesta")) {
      response = "Nuestras tarifas varían según el tipo de habitación, desde los 75€ de la Individual hasta los 300€ de nuestra Gran Suite. ¿Para cuántas personas necesitas la habitación?";
    } else if (msgLower.includes("wifi") || msgLower.includes("internet")) {
      response = "¡Por supuesto! Ofrecemos WiFi 6 de alta velocidad gratuito en todas las habitaciones y áreas comunes del hotel.";
    } else if (msgLower.includes("desayuno")) {
      response = "Ofrecemos un delicioso desayuno buffet gourmet. Está incluido en nuestras Suites y tiene un coste de 15€ para el resto de habitaciones.";
    } else {
      response = "Lo siento, en este momento no puedo procesar tu solicitud con OpenAI, pero como asistente de HoteIA te informo que puedes reservar habitaciones individuales, dobles y suites desde nuestra web. ¿Hay algo específico sobre el hotel que quieras saber?";
    }
  }

  // Guardamos en la BD para el historial del TFG
  await AIModel.saveMessage(userId, sessionId, message, response);

  return response;
};

module.exports = { processChatMessage };
