// worker.js
var worker_default = {
  async fetch(request, env) {
    const url = new URL(request.url);
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    };
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }
    if (url.pathname === "/tunnel" && request.method === "GET") {
      try {
        const data = await env.TUNNEL_KV.get("current_tunnel_url", "json");
        if (!data) {
          return new Response(JSON.stringify({
            url: null,
            message: "\u30C8\u30F3\u30CD\u30EBURL\u304C\u8A2D\u5B9A\u3055\u308C\u3066\u3044\u307E\u305B\u3093"
          }), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }
        return new Response(JSON.stringify(data), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      } catch (error) {
        return new Response(JSON.stringify({
          error: "KV\u8AAD\u307F\u53D6\u308A\u30A8\u30E9\u30FC",
          message: error.message
        }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
    }
    if (url.pathname === "/tunnel" && request.method === "POST") {
      try {
        const body = await request.json();
        const tunnelUrl = body.url;
        if (!tunnelUrl || typeof tunnelUrl !== "string") {
          return new Response(JSON.stringify({
            error: "URL\u304C\u5FC5\u8981\u3067\u3059"
          }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }
        const isValid = tunnelUrl.startsWith("https://") && tunnelUrl.includes(".trycloudflare.com") || tunnelUrl.startsWith("http://localhost:");
        if (!isValid) {
          return new Response(JSON.stringify({
            error: "\u4E0D\u6B63\u306AURL\u5F62\u5F0F\u3067\u3059"
          }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }
        const data = {
          url: tunnelUrl,
          updatedAt: (/* @__PURE__ */ new Date()).toISOString()
        };
        await env.TUNNEL_KV.put("current_tunnel_url", JSON.stringify(data));
        return new Response(JSON.stringify({
          success: true,
          ...data,
          message: "URL\u3092\u4FDD\u5B58\u3057\u307E\u3057\u305F"
        }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      } catch (error) {
        return new Response(JSON.stringify({
          error: "\u30A8\u30E9\u30FC\u304C\u767A\u751F\u3057\u307E\u3057\u305F",
          message: error.message
        }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
    }
    return new Response(JSON.stringify({
      error: "Not Found",
      message: "\u5229\u7528\u53EF\u80FD\u306A\u30A8\u30F3\u30C9\u30DD\u30A4\u30F3\u30C8: GET /tunnel, POST /tunnel"
    }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
};
export {
  worker_default as default
};
//# sourceMappingURL=worker.js.map
