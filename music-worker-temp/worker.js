export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };
    
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }
    
    if (url.pathname === '/tunnel' && request.method === 'GET') {
      try {
        const data = await env.TUNNEL_KV.get('current_tunnel_url', 'json');
        
        if (!data) {
          return new Response(JSON.stringify({
            url: null,
            message: 'トンネルURLが設定されていません'
          }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        
        return new Response(JSON.stringify(data), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } catch (error) {
        return new Response(JSON.stringify({
          error: 'KV読み取りエラー',
          message: error.message
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }
    
    if (url.pathname === '/tunnel' && request.method === 'POST') {
      try {
        const body = await request.json();
        const tunnelUrl = body.url;
        
        if (!tunnelUrl || typeof tunnelUrl !== 'string') {
          return new Response(JSON.stringify({
            error: 'URLが必要です'
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        
        const isValid = 
          (tunnelUrl.startsWith('https://') && tunnelUrl.includes('.trycloudflare.com')) ||
          tunnelUrl.startsWith('http://localhost:');
        
        if (!isValid) {
          return new Response(JSON.stringify({
            error: '不正なURL形式です'
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        
        const data = {
          url: tunnelUrl,
          updatedAt: new Date().toISOString()
        };
        
        await env.TUNNEL_KV.put('current_tunnel_url', JSON.stringify(data));
        
        return new Response(JSON.stringify({
          success: true,
          ...data,
          message: 'URLを保存しました'
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } catch (error) {
        return new Response(JSON.stringify({
          error: 'エラーが発生しました',
          message: error.message
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }
    
    return new Response(JSON.stringify({
      error: 'Not Found',
      message: '利用可能なエンドポイント: GET /tunnel, POST /tunnel'
    }), { 
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
};
