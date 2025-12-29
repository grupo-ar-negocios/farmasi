/// <reference lib="deno.ns" />
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

Deno.serve(async (req) => {
  try {
    const url = new URL(req.url);
    const userId = url.searchParams.get("userId");

    if (!userId) {
      return new Response("User ID is required", { status: 400 });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const { error } = await supabaseAdmin
      .from("profiles")
      .update({ is_approved: true })
      .eq("id", userId);

    if (error) throw error;

    return new Response(
      `
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <script src="https://cdn.tailwindcss.com"></script>
          <title>Usuário Aprovado</title>
        </head>
        <body class="bg-slate-50 flex items-center justify-center min-h-screen p-6">
          <div class="max-w-md w-full bg-white p-10 rounded-[2.5rem] shadow-xl shadow-slate-200/50 text-center border border-slate-100">
            <div class="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 class="text-2xl font-black text-slate-900 uppercase tracking-tighter mb-4">Acesso Liberado!</h1>
            <p class="text-slate-500 font-bold text-sm leading-relaxed mb-8">
              O usuário foi aprovado com sucesso e já pode acessar o sistema FARMASI.
            </p>
            <div class="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
              SISTEMA DE GESTÃO FARMASI
            </div>
          </div>
        </body>
      </html>
      `,
      { headers: { "Content-Type": "text/html; charset=UTF-8" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    });
  }
});
