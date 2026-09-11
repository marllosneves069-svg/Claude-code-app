import {
  FATURAMENTO_MENSAL_OPCOES,
  FUNCAO_PRINCIPAL_OPCOES,
  INVESTIMENTO_ANUNCIOS_OPCOES,
  LEADS_MENSAIS_OPCOES,
  MODELO_OPERACIONAL_OPCOES,
  QUANTIDADE_PESSOAS_OPCOES,
  QUANTIDADE_VENDEDORES_OPCOES,
  SEGMENTOS,
  TEMPO_EMPRESA_OPCOES,
  TICKET_MEDIO_OPCOES,
  UF_OPCOES,
} from "@/lib/diagnostico/perfilOpcoes";
import type { ErrosPerfil } from "@/lib/diagnostico/validacao";
import type { PerfilEmpresa } from "@/lib/diagnostico/types";

type Campo = keyof PerfilEmpresa;

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      {children}
      {error && <span className="mt-1 block text-xs font-medium text-[var(--danger)]">{error}</span>}
    </label>
  );
}

function SectionCard({
  titulo,
  descricao,
  children,
}: {
  titulo: string;
  descricao: string;
  children: React.ReactNode;
}) {
  return (
    <div className="card p-5 sm:p-6">
      <h3 className="text-base font-semibold text-[var(--foreground)]">{titulo}</h3>
      <p className="mt-1 mb-5 text-sm text-[var(--muted)]">{descricao}</p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{children}</div>
    </div>
  );
}

export function PerfilStep({
  perfil,
  erros,
  onChange,
}: {
  perfil: Partial<PerfilEmpresa>;
  erros: ErrosPerfil;
  onChange: (campo: Campo, valor: string) => void;
}) {
  function inputProps(campo: Campo) {
    return {
      className: "input",
      value: perfil[campo] ?? "",
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
        onChange(campo, e.target.value),
    };
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-semibold text-[var(--foreground)] sm:text-2xl">Identificação e perfil da empresa</h2>
        <p className="mt-1.5 text-sm text-[var(--muted)]">
          Essas informações ajudam a interpretar corretamente os resultados do seu diagnóstico.
        </p>
      </div>

      <SectionCard titulo="Seus dados" descricao="Para identificarmos você e sua empresa.">
        <Field label="Seu nome" error={erros.nome}>
          <input {...inputProps("nome")} placeholder="Nome completo" />
        </Field>
        <Field label="Nome da empresa" error={erros.empresa}>
          <input {...inputProps("empresa")} placeholder="Razão social ou nome fantasia" />
        </Field>
        <Field label="WhatsApp" error={erros.whatsapp}>
          <input {...inputProps("whatsapp")} placeholder="(00) 00000-0000" />
        </Field>
        <Field label="E-mail" error={erros.email}>
          <input {...inputProps("email")} type="email" placeholder="voce@empresa.com" />
        </Field>
        <Field label="Cidade" error={erros.cidade}>
          <input {...inputProps("cidade")} placeholder="Cidade" />
        </Field>
        <Field label="Estado" error={erros.estado}>
          <select {...inputProps("estado")}>
            <option value="">Selecione</option>
            {UF_OPCOES.map((uf) => (
              <option key={uf} value={uf}>
                {uf}
              </option>
            ))}
          </select>
        </Field>
      </SectionCard>

      <SectionCard titulo="Sobre o seu negócio" descricao="Perfil operacional e comercial da empresa.">
        <Field label="Segmento" error={erros.segmento}>
          <select {...inputProps("segmento")}>
            <option value="">Selecione</option>
            {SEGMENTOS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </Field>
        {perfil.segmento === "outro" && (
          <Field label="Qual segmento?" error={erros.segmentoOutro}>
            <input {...inputProps("segmentoOutro")} placeholder="Descreva seu segmento" />
          </Field>
        )}
        <Field label="Tempo de empresa" error={erros.tempoEmpresa}>
          <select {...inputProps("tempoEmpresa")}>
            <option value="">Selecione</option>
            {TEMPO_EMPRESA_OPCOES.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Faturamento médio mensal" error={erros.faturamentoMensal}>
          <select {...inputProps("faturamentoMensal")}>
            <option value="">Selecione</option>
            {FATURAMENTO_MENSAL_OPCOES.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Quantidade de pessoas na equipe" error={erros.quantidadePessoas}>
          <select {...inputProps("quantidadePessoas")}>
            <option value="">Selecione</option>
            {QUANTIDADE_PESSOAS_OPCOES.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Quantidade de vendedores" error={erros.quantidadeVendedores}>
          <select {...inputProps("quantidadeVendedores")}>
            <option value="">Selecione</option>
            {QUANTIDADE_VENDEDORES_OPCOES.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Leads mensais" error={erros.leadsMensais}>
          <select {...inputProps("leadsMensais")}>
            <option value="">Selecione</option>
            {LEADS_MENSAIS_OPCOES.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Investimento mensal em anúncios" error={erros.investimentoAnuncios}>
          <select {...inputProps("investimentoAnuncios")}>
            <option value="">Selecione</option>
            {INVESTIMENTO_ANUNCIOS_OPCOES.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Ticket médio" error={erros.ticketMedio}>
          <select {...inputProps("ticketMedio")}>
            <option value="">Selecione</option>
            {TICKET_MEDIO_OPCOES.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Modelo operacional" error={erros.modeloOperacional}>
          <select {...inputProps("modeloOperacional")}>
            <option value="">Selecione</option>
            {MODELO_OPERACIONAL_OPCOES.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </Field>
      </SectionCard>

      <SectionCard titulo="Sua rotina" descricao="Como você tem gasto seu tempo à frente da empresa.">
        <div className="sm:col-span-2">
          <Field label="Qual função mais ocupa seu tempo atualmente?" error={erros.funcaoPrincipal}>
            <select {...inputProps("funcaoPrincipal")}>
              <option value="">Selecione</option>
              {FUNCAO_PRINCIPAL_OPCOES.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <div className="sm:col-span-2">
          <Field label="Na sua opinião, qual é hoje o maior problema da sua empresa?" error={erros.maiorProblema}>
            <textarea
              {...inputProps("maiorProblema")}
              rows={4}
              placeholder="Descreva com suas palavras..."
              className="input resize-none"
            />
          </Field>
        </div>
      </SectionCard>
    </div>
  );
}
