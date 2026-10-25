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

## Dashboard de Performance (Meta Ads + Tiny)

`/admin/performance` cruza o funil do **Meta Ads** com os pedidos do **Tiny
(Olist)** de uma loja, no mesmo formato do relatório enviado ao cliente. O
botão **Copiar relatório** gera o texto pronto para colar no WhatsApp.

### Configuração

1. Rode `supabase/migrations/0002_performance.sql` no SQL Editor do Supabase.
2. Preencha no `.env.local` (e nas variáveis do deploy): `META_ACCESS_TOKEN`,
   `META_AD_ACCOUNT_ID`, `TINY_API_TOKEN` e `CRON_SECRET` (veja `.env.example`).
   - **Meta**: token de *usuário do sistema* do Business Manager com permissão
     `ads_read` e acesso à conta de anúncios.
   - **Tiny**: token da API v2 (Configurações → Outras configurações → Token API).
3. Rode a primeira carga (90 dias por padrão) pela linha de comando, porque o
   limite de requisições do Tiny deixa o backfill lento:

   ```bash
   npm run sync            # Meta + Tiny
   npm run sync -- tiny    # só um dos dois
   ```

### Atualização dos dados

- **Diária**: `vercel.json` agenda `GET /api/cron/sync` às 06h (horário de
  Brasília). A Vercel envia `Authorization: Bearer $CRON_SECRET`
  automaticamente; fora da Vercel, qualquer agendador que mande esse header
  funciona.
- **Manual**: botão **Atualizar agora** no dashboard.
- O Meta é sempre re-sincronizado nos últimos 7 dias (a atribuição muda
  depois). O Tiny é incremental (pedidos alterados desde o último sync). Se o
  tempo da função acabar, o sync fica como "parcial" e o próximo continua de
  onde parou. Todo sync fica registrado em `sync_runs`.
- As tabelas novas são só leitura para usuários logados; quem grava é o sync,
  com a service role key.

### Definição de cada métrica

| Métrica | Fonte / cálculo |
| --- | --- |
| Pessoas alcançadas | Alcance do Meta no período inteiro (alcance não pode ser somado dia a dia; se a API falhar, mostra "≈" com a soma diária) |
| Impressões, cliques no link | Meta (`impressions`, `inline_link_clicks`) |
| Entraram em contato/form nativo | Conversas por mensagem iniciadas + leads de formulário instantâneo |
| Investimento | Gasto do Meta, **sem imposto** |
| Imposto | Gasto × taxa (12,15% padrão, editável em Configurações). Só informativo |
| Compraram / faturamento | **Todos** os pedidos do Tiny do período (Em aberto, Aprovado, Preparando envio, Faturado, Enviado, Entregue etc.), exceto Cancelado, pela data do pedido — bate com a aba "todos" de Pedidos de venda menos os cancelados |
| Orçamentos em aberto / valor parado | Dos pedidos acima, os que estão com situação "Em aberto" (situação atual). Também contam como venda |
| Custo por contato/orçamento/venda | Investimento ÷ quantidade |
| Taxa de conversão | Compraram ÷ contatos |
| ROAS | Faturamento do Tiny ÷ investimento |
| Ticket médio | Faturamento ÷ compras |

Os deltas comparam com o período anterior de mesmo tamanho. A tabela de
campanhas mostra também o "ROAS Meta" (valor de compra atribuído pelo pixel),
para comparar com o ROAS real do Tiny.

## Scripts

| Comando            | Descrição                                   |
| ------------------ | -------------------------------------------- |
| `npm run dev`       | Ambiente de desenvolvimento                  |
| `npm run build`     | Build de produção                            |
| `npm run lint`      | ESLint                                       |
| `npm run seed`      | Popula dados de demonstração                 |
| `npm run seed:clear`| Remove os dados de demonstração              |
| `npm run sync`      | Sincroniza Meta Ads + Tiny (backfill/manual) |

## Limitações conhecidas / próximos passos

- A página **Relatórios** é um placeholder — hoje as evoluções mensais,
  distribuição de NPS e médias por dimensão já vivem no Dashboard.
- Não há envio automático de WhatsApp/e-mail — os links são copiados
  manualmente (botões "Copiar link", "Copiar mensagem" e "Copiar todos").
- Sem papéis/permissões diferenciados na área administrativa (qualquer
  usuário autenticado tem acesso total), como esperado para uma ferramenta
  interna de uso único pela equipe.
