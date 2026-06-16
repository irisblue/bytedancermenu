const headers = {
  "content-type": "text/plain; charset=utf-8",
  "access-control-allow-origin": "*",
};

Deno.serve(() => new Response("workspace-menu ok", { headers }));
