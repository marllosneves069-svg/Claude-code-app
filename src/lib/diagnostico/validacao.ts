import { SEGMENTOS } from "./perfilOpcoes";
import type { PerfilEmpresa } from "./types";

const CAMPOS_TEXTO_OBRIGATORIOS: Exclude<keyof PerfilEmpresa, "segmentoOutro" | "segmento">[] = [
  "nome",
  "empresa",
  "whatsapp",
  "email",
  "cidade",
  "estado",
  "tempoEmpresa",
  "faturamentoMensal",
  "quantidadePessoas",
  "quantidadeVendedores",
  "leadsMensais",
  "investimentoAnuncios",
  "ticketMedio",
  "modeloOperacional",
  "funcaoPrincipal",
  "maiorProblema",
];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type ErrosPerfil = Partial<Record<keyof PerfilEmpresa, string>>;

/** Compartilhada entre o formulário (client) e a API (server) para manter a mesma regra nos dois lados. */
export function validarPerfil(perfil: Partial<PerfilEmpresa>): ErrosPerfil {
  const erros: ErrosPerfil = {};

  for (const campo of CAMPOS_TEXTO_OBRIGATORIOS) {
    if (!perfil[campo] || String(perfil[campo]).trim() === "") {
      erros[campo] = "Campo obrigatório.";
    }
  }

  if (perfil.email && !EMAIL_REGEX.test(perfil.email)) {
    erros.email = "Informe um e-mail válido.";
  }

  if (!perfil.segmento || !SEGMENTOS.some((s) => s.id === perfil.segmento)) {
    erros.segmento = "Selecione um segmento.";
  }

  if (perfil.segmento === "outro" && (!perfil.segmentoOutro || perfil.segmentoOutro.trim() === "")) {
    erros.segmentoOutro = "Descreva o segmento.";
  }

  return erros;
}

export function perfilValido(perfil: Partial<PerfilEmpresa>): boolean {
  return Object.keys(validarPerfil(perfil)).length === 0;
}
