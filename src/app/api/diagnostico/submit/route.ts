import { NextResponse } from "next/server";
import { salvarDiagnostico } from "@/lib/diagnostico/queries";
import { nivelAlertaDaResposta, processarDiagnostico, resolverRespostas, RespostasInvalidasError } from "@/lib/diagnostico/pontuacao";
import { validarPerfil } from "@/lib/diagnostico/validacao";
import type { PerfilEmpresa, RespostaEnviada } from "@/lib/diagnostico/types";

export async function POST(request: Request) {
  let body: { perfil?: PerfilEmpresa; respostas?: RespostaEnviada[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corpo da requisição inválido." }, { status: 400 });
  }

  const perfil = body.perfil;
  const respostasEnviadas = Array.isArray(body.respostas) ? body.respostas : [];

  if (!perfil) {
    return NextResponse.json({ error: "Perfil da empresa ausente." }, { status: 400 });
  }

  const erros = validarPerfil(perfil);
  if (Object.keys(erros).length > 0) {
    return NextResponse.json({ error: "Perfil da empresa incompleto.", campos: erros }, { status: 400 });
  }

  let respostasResolvidas;
  try {
    respostasResolvidas = resolverRespostas(respostasEnviadas);
  } catch (e) {
    if (e instanceof RespostasInvalidasError) {
      return NextResponse.json({ error: e.message }, { status: 400 });
    }
    throw e;
  }

  const resultado = processarDiagnostico(respostasResolvidas);

  try {
    const id = await salvarDiagnostico(
      { perfil, resultado },
      respostasResolvidas.map((r) => ({
        codigo: r.codigo,
        pilar: r.pilar,
        opcaoIndex: r.opcaoIndex,
        pontuacao: r.pontuacao,
        nivelAlerta: nivelAlertaDaResposta(r.pontuacao),
      }))
    );
    return NextResponse.json({ id });
  } catch {
    return NextResponse.json(
      { error: "Não foi possível registrar seu diagnóstico. Tente novamente em instantes." },
      { status: 500 }
    );
  }
}
