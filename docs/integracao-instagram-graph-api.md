# Integração do Feed do Instagram — Instagram Graph API

> Status atual: a seção "Acompanhe no Instagram" da home usa um **grid estático
> (placeholder)**. Este documento mapeia o que é preciso para trocar por um feed
> **ao vivo** via Instagram Graph API, sem alterar o design já validado.

Local no código:
- HTML: seção `#instagram` em `index.html` (marcação já preparada para render dinâmico)
- CSS: `assets/css/home.css` (bloco "FEED DO INSTAGRAM")
- i18n: chaves `instagram.*` em `assets/js/shared/i18n.js`

---

## 1. Por que Graph API

A **Instagram Basic Display API foi desativada pela Meta no fim de 2024**. Para exibir
o feed real hoje é necessário a **Instagram Graph API**, que exige:

- Conta do Instagram do tipo **Business** ou **Creator** (não pode ser perfil pessoal);
- Conta **vinculada a uma Página do Facebook**;
- Um **App na Meta** (Facebook Developers) e um **token de acesso**.

---

## 2. Arquitetura planejada (lado do desenvolvimento)

Mesmo padrão das integrações existentes (`get-animals`, `get-events`):

1. **Edge Function `get-instagram`** (Supabase):
   - Guarda o token como *secret* (nunca vai para o frontend);
   - Chama `GET /{ig-business-account-id}/media?fields=id,caption,media_type,media_url,permalink,thumbnail_url,timestamp&limit=6`;
   - Faz **cache** (30–60 min) para respeitar os limites de taxa da API;
   - Retorna JSON já normalizado para o frontend.
2. **Renovação do token**: rotina automática (cron / GitHub Action) antes dos ~60 dias,
   OU uso de token de **System User** (Meta Business), que não expira.
3. **Frontend**: substituir os `<li>` estáticos do grid por render dinâmico consumindo
   a `get-instagram`, com skeleton loader (igual ao grid de animais).
4. **CORS**: adicionar o domínio de homologação/produção ao `ALLOWED_ORIGINS` da função.

---

## 3. O que precisamos do cliente (requisitos do token)

Existem dois caminhos. **O caminho A é o recomendado** (mais seguro e o token não expira).

### Caminho A — Conceder acesso à nossa equipe (recomendado)
O cliente:
1. Garante que **@institutoluisamelloficial** é conta **Business/Creator** e está
   **vinculada a uma Página do Facebook** do Instituto.
2. Adiciona nossa equipe no **Meta Business Suite** (business.facebook.com) como
   **parceiro/pessoa com acesso** à Página e à conta do Instagram, **ou** como
   **desenvolvedor/administrador** do App na Meta.
3. Pronto — nós criamos o App, geramos um **token de System User (não expira)** e
   configuramos tudo. O cliente **não precisa manipular tokens**.

### Caminho B — Cliente gera e nos envia o token (60 dias)
Caso prefiram gerar por conta própria, seguir o passo a passo da seção 4 e nos
enviar os dados da seção 5. Nós cuidamos da renovação a cada 60 dias (desde que
recebamos também App ID e App Secret).

---

## 4. Passo a passo para gerar o token (Caminho B)

1. **Converter a conta** para profissional: no app do Instagram →
   *Configurações → Conta → Mudar para conta profissional* (Business ou Creator).
2. **Vincular a uma Página do Facebook** do Instituto:
   nas configurações da conta profissional do Instagram, ou pela Página do Facebook →
   *Configurações → Contas vinculadas → Instagram*.
3. Acessar **developers.facebook.com**, logar com a conta do Facebook que administra a
   Página e criar um **App** do tipo **Empresa (Business)**.
4. No painel do App, adicionar o produto **Instagram Graph API** (Facebook Login).
5. Abrir o **Graph API Explorer** (developers.facebook.com/tools/explorer):
   - Selecionar o App;
   - Gerar um **token de usuário** concedendo as permissões:
     `instagram_basic`, `pages_show_list`, `pages_read_engagement`, `business_management`.
   - (Esse token inicial é de curta duração, ~1h.)
6. **Descobrir o ID da conta Instagram Business**:
   - `GET /me/accounts` → copiar o **Page ID** da Página do Instituto;
   - `GET /{page-id}?fields=instagram_business_account` → copiar o
     **instagram_business_account.id**.
7. **Trocar por um token de longa duração (60 dias)**:
   - `GET /oauth/access_token?grant_type=fb_exchange_token&client_id={APP_ID}&client_secret={APP_SECRET}&fb_exchange_token={TOKEN_CURTO}`
   - O retorno traz o `access_token` de longa duração.

---

## 5. O que enviar para a nossa equipe (Caminho B)

Enviar por **canal seguro** (ver seção 6):

- [ ] **App ID**
- [ ] **App Secret**
- [ ] **Token de acesso de longa duração** (gerado no passo 7)
- [ ] **ID da conta Instagram Business** (`instagram_business_account.id`)
- [ ] **Page ID** da Página do Facebook vinculada

---

## 6. Segurança e LGPD

- O token concede **leitura das publicações** da conta — trate-o como uma senha.
- **Não** enviar token/App Secret por canais abertos (post público, comentário,
  mensagem em grupo). Usar cofre de senha, mensagem direta criptografada ou
  transferência combinada previamente.
- Serão exibidas apenas publicações **públicas** do próprio perfil do Instituto.
- Podemos revogar/rotacionar o token a qualquer momento pelo painel da Meta.

---

## 7. Decisões de design a confirmar com o cliente

- Nº de posts exibidos (6 / 8 / 9);
- Formato: quadrado (atual) ou proporção original;
- Exibir legenda / data / curtidas? (curtidas e comentários exigem permissões extras
  e nem sempre estão disponíveis);
- Incluir vídeos/Reels ou apenas imagens;
- Cabeçalho com @handle + botão "Seguir" (o botão já existe).
