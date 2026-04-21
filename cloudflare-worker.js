export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders()
      });
    }

    if (request.method !== "POST") {
      return jsonResponse({ error: "Method not allowed" }, 405);
    }

    try {
      const { messages } = await request.json();

      if (!Array.isArray(messages) || messages.length === 0) {
        return jsonResponse({ error: "Missing or invalid messages array." }, 400);
      }

      if (!env.OPENAI_API_KEY) {
        return jsonResponse({ error: "OPENAI_API_KEY is missing in Worker settings." }, 500);
      }

      const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages,
          temperature: 0.7
        })
      });

      const data = await openaiResponse.json();

      if (!openaiResponse.ok) {
        return jsonResponse(
          { error: data?.error?.message || "OpenAI request failed." },
          openaiResponse.status
        );
      }

      const reply = data?.choices?.[0]?.message?.content;

      if (!reply) {
        return jsonResponse({ error: "No reply returned from OpenAI." }, 500);
      }

      return jsonResponse({ reply }, 200);
    } catch (error) {
      return jsonResponse(
        { error: error.message || "Something went wrong." },
        500
      );
    }
  }
};

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  };
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders()
    }
  });
}
