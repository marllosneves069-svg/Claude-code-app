# Pulse — NPS & Monthly Health Score

Plataforma interna para medir mensalmente a satisfação (NPS) e a saúde (MHS —
Monthly Health Score) da carteira de clientes de uma assessoria de marketing,
tráfego pago e vendas.

Duas experiências completamente separadas:

- **Área pública** (`/pesquisa/[token]`): formulário de satisfação, sem
  login, um link único e de uso único por cliente/mês.
- **Área administrativa** (`/admin`): dashboard, cadastro de clientes,
  criação de rodadas mensais, geração de links e acompanhamento de
  resultados. Protegida por Supabase Auth.

## Stack

- Next.js 16 (App Router) + TypeScript
- Tailwind CSS v4
- Supabase (Postgres + Auth + Row Level Security)
- Recharts

## Como funciona a segurança

- Toda a área `/admin` exige uma sessão autenticada do Supabase Auth
  (verificada em `src/middleware.ts`).
- As tabelas do banco têm RLS habilitada. Só o papel `authenticated`
  (usuários logados) e o `service_role` têm acesso — o papel `anon` não tem
  nenhuma policy, ou seja, a chave pública (anon key) não consegue ler nem
  escrever nada nessas tabelas diretamente.
- O formulário público nunca fala com o Postgres usando a anon key. Ele passa
  por rotas server-side (`src/lib/supabase/admin.ts`, usado só no servidor)
  que usam a service role key e fazem exatamente duas coisas: buscar a
  pesquisa pelo token exato, e inserir uma única resposta. Isso garante que
  um cliente nunca consiga listar outros clientes, outros tokens ou dados do
  dashboard.
- Cada link (`survey_invitations.token`) é um UUID aleatório — nunca um ID
  sequencial — e só pode gerar uma resposta: há uma constraint `unique` em
  `responses.invitation_id`, então mesmo em caso de duplo clique/concorrência
  só a primeira resposta é aceita (a segunda recebe HTTP 409).

## Configuração

### 1. Crie um projeto no Supabase

Em [supabase.com](https://supabase.com), crie um projeto e copie, em
**Project Settings → API**: a URL do projeto, a `anon public key` e a
`service_role key`.

### 2. Rode a migration

No SQL Editor do Supabase (ou via Supabase CLI), execute o conteúdo de
`supabase/migrations/0001_init.sql`. Isso cria todas as tabelas, os enums,
os índices e as policies de RLS.

### 3. Configure as variáveis de ambiente

```bash
cp .env.example .env.local
```

Preencha `.env.local` com os valores do seu projeto Supabase.

### 4. Crie o primeiro usuário administrador

No Supabase Dashboard → **Authentication → Users → Add user**, crie um
usuário com e-mail e senha. Qualquer usuário autenticado tem acesso total à
área administrativa (é uma ferramenta interna de uso único pela equipe da
assessoria — não há papéis/permissões diferenciados no MVP).

### 5. Instale as dependências e rode localmente

```bash
npm install
npm run dev
```

Acesse `http://localhost:3000/admin/login`.

### 6. (Opcional) Popule dados de demonstração

Gera 15 clientes fictícios e 6 meses de histórico (NPS, MHS, alertas,
clientes saudáveis/atenção/risco) para você já visualizar o dashboard
funcionando:

```bash
npm run seed
```

Todo dado de demonstração fica marcado com `is_demo = true` em `clients` e
`surveys`, e pode ser removido a qualquer momento com:

```bash
npm run seed:clear
```

## Fluxo ponta a ponta (MVP)

```
Admin cadastra cliente
        ↓
Admin cria a pesquisa do mês (Pesquisas → Nova pesquisa mensal)
        ↓
Sistema gera 1 link único (UUID) por cliente selecionado
        ↓
Admin copia o link/mensagem e envia ao cliente (WhatsApp, e-mail, etc.)
        ↓
Cliente abre o link, é identificado automaticamente, responde 11 perguntas
        ↓
Resposta é salva (bloqueia novas respostas para aquele link)
        ↓
NPS e MHS são calculados automaticamente
        ↓
Dashboard e histórico do cliente são atualizados
```

## Estrutura do questionário

11 perguntas fixas (`src/lib/questions.ts`), copiadas para `survey_questions`
a cada nova rodada mensal (assim uma mudança futura no catálogo não altera
pesquisas já respondidas):

1. NPS (0–10)
2–9. Oito dimensões de satisfação (1–5, com rosto/ícone visual) — usadas no
   cálculo do MHS
10. Retenção/dependência percebida (1–5, escala invertida — "muito
    desapontado" é o melhor cenário) — **não** entra no MHS, vira o card
    "Índice de retenção" e um alerta próprio
11. Feedback aberto

## Cálculos

- **NPS** (`src/lib/metrics.ts#calculateNps`): metodologia padrão
  (%promotores − %detratores), 9–10 promotor, 7–8 passivo, 0–6 detrator.
- **MHS** (`#calculateMhs`): média das perguntas 2–9, convertida para 0–100
  com `((média − 1) / 4) × 100`. Já recebe pesos por pergunta (`weight` em
  `survey_questions`), hoje todos = 1, prontos para pesos diferentes no
  futuro sem mudança de schema.
- **Status de saúde** (`#mhsPercentageToHealth`) e limites de alerta
  (detrator, baixa retenção) são configuráveis em **Configurações**, gravados
  na tabela `settings` (chave `health_thresholds`), com fallback para os
  valores padrão do enunciado (Saudável ≥ 80, Atenção ≥ 60, Risco < 60).
- **Alertas** (`src/lib/queries.ts#getDashboardData`): NPS detrator, MHS em
  zona de risco, queda de NPS/MHS vs. mês anterior e baixa retenção usam os
  limites acima. "Feedback crítico" (item do enunciado sem uma métrica
  numérica associada) usa uma heurística simples de palavras-chave em
  português sobre o texto aberto — não é análise de sentimento, é um sinal
  aproximado para triagem manual.

## Scripts

| Comando            | Descrição                                   |
| ------------------ | -------------------------------------------- |
| `npm run dev`       | Ambiente de desenvolvimento                  |
| `npm run build`     | Build de produção                            |
| `npm run lint`      | ESLint                                       |
| `npm run seed`      | Popula dados de demonstração                 |
| `npm run seed:clear`| Remove os dados de demonstração              |

## Limitações conhecidas / próximos passos

- A página **Relatórios** é um placeholder — hoje as evoluções mensais,
  distribuição de NPS e médias por dimensão já vivem no Dashboard.
- Não há envio automático de WhatsApp/e-mail — os links são copiados
  manualmente (botões "Copiar link", "Copiar mensagem" e "Copiar todos").
- Sem papéis/permissões diferenciados na área administrativa (qualquer
  usuário autenticado tem acesso total), como esperado para uma ferramenta
  interna de uso único pela equipe.

---

# Diagnóstico Empresarial 360

Segunda aplicação hospedada neste mesmo repositório, completamente
independente do Pulse (fluxo, banco de dados e propósito diferentes).
Voltada a empresários dos segmentos de brindes personalizados, gráficas,
comunicação visual e personalizados: o visitante responde a um diagnóstico
estruturado sobre a empresa e recebe uma análise de maturidade baseada em
dados, com arquitetura pronta para evoluir para interpretação por IA.

Rotas:

- `/diagnostico` — landing page (pública)
- `/diagnostico/aplicacao` — wizard completo (perfil da empresa + 6 pilares)
- `/diagnostico/resultado/[id]` — tela de resultado de um diagnóstico salvo

## Banco de dados próprio

Esta aplicação usa um **projeto Supabase separado** do usado pelo Pulse.
Crie um segundo projeto em [supabase.com](https://supabase.com), rode
`supabase/migrations/0001_diagnostico_360_init.sql` nele e preencha, em
`.env.local`:

```
DIAGNOSTICO_SUPABASE_URL=...
DIAGNOSTICO_SUPABASE_SERVICE_ROLE_KEY=...
NEXT_PUBLIC_DIAGNOSTICO_CTA_URL=...   # WhatsApp ou página de agendamento
```

Assim como no Pulse, o `anon` role não tem nenhuma policy — o wizard público
fala com o Postgres exclusivamente via `src/lib/supabase/diagnostico-admin.ts`
(service role, server-only), usado apenas para inserir um diagnóstico e
buscar um diagnóstico por id exato.

## Jornada

Landing → Perfil da empresa → Marketing → Comercial → Pessoas → Operação e
Produção → Financeiro → Gestão → Processamento → Resultado → CTA de
agendamento. Uma barra de progresso acompanha o preenchimento e é possível
avançar/voltar sem perder respostas (o estado do wizard fica em
`localStorage` até o envio final).

## Pontuação (`src/lib/diagnostico/`)

- 36 perguntas (6 por pilar), cada uma com 5 alternativas valendo
  `0 / 2 / 5 / 8 / 10` pontos (nunca exibidos ao usuário).
- `NOTA_PILAR = (soma das 6 respostas / 60) × 100`; `NOTA_GERAL` é a média
  das seis notas de pilar. Classificação: **Crítico** (0–39), **Atenção**
  (40–59), **Em desenvolvimento** (60–79), **Estruturado** (80–100).
- Respostas 0 ou 2 viram **alerta crítico**; respostas 5 viram **ponto de
  atenção** (`src/lib/diagnostico/pontuacao.ts`).
- O gargalo principal/segundo/terceiro **não** é apenas a menor nota: um
  motor de regras de cruzamento entre pilares (`src/lib/diagnostico/regras.ts`)
  eleva a prioridade de um pilar quando padrões específicos aparecem (ex.:
  Marketing alto + Comercial baixo → possível vazamento comercial). Novas
  regras são só um item a mais nessa lista, sem mudança de schema.

## Conteúdo ainda placeholder

Por pedido explícito desta primeira fase, o enunciado e as alternativas das
36 perguntas (`src/lib/diagnostico/perguntas.ts`) são gerados
estruturalmente ("Pergunta MKT01 — conteúdo a ser definido", "Alternativa A"
… "Alternativa E") — a escala de pontuação e o motor de regras já estão
completos e funcionais, mas o conteúdo de negócio real de cada pergunta
ainda precisa ser escrito. Para adicionar o conteúdo definitivo de uma
pergunta, edite apenas `enunciado` e os `label` das opções do item
correspondente nesse arquivo. Da mesma forma, a seção "O que os dados
indicam" na tela de resultado está reservada para a futura interpretação
por IA.
