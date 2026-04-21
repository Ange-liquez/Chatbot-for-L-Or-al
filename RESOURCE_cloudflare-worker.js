export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders()
      });
    }

    if (request.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Method not allowed" }),
        {
          status: 405,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders()
          }
        }
      );
    }

    try {
      const { messages } = await request.json();

      if (!messages || !Array.isArray(messages)) {
        return new Response(
          JSON.stringify({ error: "Missing or invalid messages array." }),
          {
            status: 400,
            headers: {
              "Content-Type": "application/json",
              ...corsHeaders()
            }
          }
        );
      }

      const openaiResponse = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${env.OPENAI_API_KEY}`
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: messages,
            temperature: 0.7
          })
        }
      );

      const data = await openaiResponse.json();

      if (!openaiResponse.ok) {
        return new Response(
          JSON.stringify({
            error: data.error?.message || "OpenAI request failed."
          }),
          {
            status: openaiResponse.status,
            headers: {
              "Content-Type": "application/json",
              ...corsHeaders()
            }
          }
        );
      }

      const reply = data.choices?.[0]?.message?.content || "No response returned.";

      return new Response(JSON.stringify({ reply }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders()
        }
      });
    } catch (error) {
      return new Response(
        JSON.stringify({
          error: error.message || "Something went wrong."
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders()
          }
        }
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
