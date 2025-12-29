import "jsr:@supabase/functions-js/edge-runtime.d.ts";

Deno.serve(async (req) => {
    try {
        const payload = await req.json();
        console.log("Payload recebido:", JSON.stringify(payload));

        const newUserEmail = payload.record.email;
        const userId = payload.record.id;
        const adminEmail = "grupoar.negocios@gmail.com";

        // We expect a RESEND_API_KEY environment variable in Supabase
        const resendKey = Deno.env.get("RESEND_API_KEY");
        const projectUrl = Deno.env.get("SUPABASE_URL");

        console.log("Configurações:", {
            hasResendKey: !!resendKey,
            projectUrl,
            newUserEmail,
            userId
        });

        if (!resendKey) {
            console.error("RESEND_API_KEY not found. Please set it in Supabase dashboard.");
            return new Response("Missing API Key", { status: 500 });
        }

        const approvalUrl = `${projectUrl}/functions/v1/approve-user?userId=${userId}`;

        const res = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${resendKey}`,
            },
            body: JSON.stringify({
                from: "FARMASI <onboarding@resend.dev>",
                to: [adminEmail],
                subject: "Novo Cadastro Pendente - FARMASI",
                html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #f1f5f9; border-radius: 20px;">
            <h1 style="color: #800020; text-transform: uppercase; letter-spacing: -1px;">Novo Cadastro</h1>
            <p>O usuário <strong>${newUserEmail}</strong> acabou de se cadastrar no sistema.</p>
            <p style="margin: 30px 0;">
              <a href="${approvalUrl}" style="background-color: #800020; color: white; padding: 15px 30px; text-decoration: none; border-radius: 12px; font-weight: bold; text-transform: uppercase; font-size: 12px; letter-spacing: 1px;">
                SIM, APROVAR USUÁRIO
              </a>
            </p>
            <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 30px 0;">
            <p style="font-size: 10px; color: #94a3b8; text-transform: uppercase; letter-spacing: 2px;">SISTEMA DE GESTÃO FARMASI</p>
          </div>
        `,
            }),
        });

        const data = await res.json();
        return new Response(JSON.stringify(data), {
            headers: { "Content-Type": "application/json" },
            status: 200,
        });
    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
            headers: { "Content-Type": "application/json" },
            status: 400,
        });
    }
});
