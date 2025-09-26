# SSDR Billing & Intake Audit

## 1. Sumário executivo

- **Cobertura**: 6 OK | 1 PARCIAL | 2 FALTANDO
- **Top 3 riscos/bloqueadores**:
  1. Backend de billing incompleto: falta dependência `stripe`, variáveis `STRIPE_*` no config/infra, migração sem colunas de billing e feature gates não aplicadas nas rotas. Isso impede checkout/webhook funcionais e viola o DoD. 
  2. Frontend de billing contorna `apiClient` e não define tipos dedicados, tornando impossível compartilhar interceptadores/autenticação e deixando o tratamento de erro 402 sem CTA. 
  3. Documentação não cobre Stripe CLI, cartões de teste nem variáveis `STRIPE_*`, dificultando a reprodução local do fluxo de billing.

## 2. Tabela de aderência

| Área | Expectativa | Status | Evidência |
| --- | --- | --- | --- |
| Auth & Guard | `/auth/token`, token em `localStorage`, ProtectedRoute, logout e interceptor 401 | OK | Backend `/auth/token` gera JWT fake【F:api/app/routers/auth.py†L15-L44】, `AuthContext` persiste/limpa token e registra handler 401【F:src/context/AuthContext.tsx†L29-L74】, `ProtectedRoute` redireciona【F:src/components/ProtectedRoute.tsx†L10-L18】, layout expõe logout【F:src/components/Layout.tsx†L27-L118】.
| Auth & Guard | CORS + `VITE_API_BASE` documentado | OK | CORS usa origens do Vite【F:api/app/main.py†L21-L35】, README e `.env.example` mencionam `VITE_API_BASE`【F:README.md†L23-L31】【F:.env.example†L37-L41】.
| Pipeline Intake | UI cobre `uploading → parsing → validating → validated/published`, toasts, 10 MB e extensão | OK | Status e toasts encadeados incluem "parsing"【F:src/pages/Upload.tsx†L32-L308】; backend valida extensão e 10 MB【F:api/app/routers/intakes.py†L33-L46】.
| Pipeline Intake | Chamadas `POST /intakes/upload|validate|publish` com vazios/toasts | OK | Upload/validate/publish chamam API com toasts e empty state【F:src/pages/Upload.tsx†L103-L355】.
| Exports | `/exports/{template}` + download + erros UX | OK | Front gera export e trata erros/downloads【F:src/pages/Exports.tsx†L75-L318】; backend cria ZIP e disponibiliza download【F:api/app/routers/exports.py†L26-L196】.
| ApiClient + Tipagem | `src/lib/api.ts` centralizado + tipos Requests/Customers/Settings | OK | Api client único com handlers e métodos para Requests/Customers/Settings【F:src/lib/api.ts†L12-L195】; tipos presentes em `src/types/*`【F:src/types/request.ts†L1-L7】.
| RLS/Segurança | `set_current_tenant` por request + `rls.sql` | OK | Dependência injeta tenant com `set_current_tenant`【F:api/app/deps.py†L15-L37】; `rls.sql` define função e policies【F:api/app/rls.sql†L1-L78】.
| DX | `.gitignore`, README quickstart, docs | OK | `.gitignore` ignora bytecode【F:.gitignore†L1-L18】; README referencia guia; docs presentes【F:README.md†L20-L66】【F:docs/local-development.md†L1-L109】.
| Billing backend | Stripe deps/config/env/router/webhook/migração/gates | FALTANDO | Falta `stripe` no `pyproject`【F:api/pyproject.toml†L8-L22】; config usa `STRIPE_API_KEY` mas `.env`/Compose não expõem `STRIPE_*`【F:api/app/config.py†L31-L39】【F:.env.example†L1-L41】【F:infra/docker-compose.yml†L52-L105】; migração inicial não cria colunas `stripe_customer_id`, etc.【F:api/alembic/versions/001_initial_schema.py†L23-L105】; feature gates não são usados nas rotas【F:api/app/services/feature_gates.py†L8-L149】【F:api/app/routers/exports.py†L26-L158】.
| Billing frontend | Cliente tipado usando `apiClient.request`, tipos em `src/types/billing.ts`, UI upgrade/portal | PARCIAL | UI (Settings, `BillingStatusCard`, `PlanSelector`) existe【F:src/pages/Settings.tsx†L1-L181】【F:src/components/ui/billing-status.tsx†L1-L120】, mas cliente usa `fetch` com `apiClient['baseUrl']` e tipos embutidos【F:src/lib/billingApi.ts†L1-L79】.
| Documentação Stripe | README + docs citam Stripe CLI, cartões de teste, `STRIPE_*` | FALTANDO | Nenhuma menção a Stripe/CLI/variáveis no README ou guia【F:README.md†L1-L108】【F:docs/local-development.md†L1-L109】.

## 3. Patches propostos (itens PARCIAL/FALTANDO)

> **Nota**: diffs abaixo não foram aplicados; servem como roteiro de correção.

### 3.1 Billing backend completo

```diff
diff --git a/api/pyproject.toml b/api/pyproject.toml
@@
-[tool.poetry.dependencies]
+[tool.poetry.dependencies]
 python = "^3.11"
 fastapi = "^0.104.1"
@@
 rq = "^1.15.1"
+stripe = "^6.5.0"
+
@@
-diff --git a/api/app/config.py b/api/app/config.py
+diff --git a/api/app/config.py b/api/app/config.py
@@
-    # Stripe
-    STRIPE_API_KEY: str = "sk_test_..."
-    STRIPE_WEBHOOK_SECRET: str = "whsec_..."
+    # Stripe
+    STRIPE_SECRET_KEY: str = "sk_test_..."
+    STRIPE_WEBHOOK_SECRET: str = "whsec_..."
     STRIPE_PRICE_POC: str = "price_poc_monthly"
     STRIPE_PRICE_PRO_T1: str = "price_pro_t1_monthly"
     STRIPE_PRICE_PRO_T2: str = "price_pro_t2_monthly"
     STRIPE_PRICE_PRO_T3: str = "price_pro_t3_monthly"
     STRIPE_PRICE_SETUP: str = "price_setup_onetime"
     STRIPE_TAX_ENABLED: bool = True
+    STRIPE_BILLING_RETURN_BASE: str = "http://localhost:5173"
@@
-settings = Settings()
+settings = Settings()
+
+# Ensure Stripe secrets are present when billing is enabled
+if not settings.STRIPE_SECRET_KEY:
+    raise RuntimeError("STRIPE_SECRET_KEY must be configured")
```

```diff
diff --git a/.env.example b/.env.example
@@
 # Development
 DEBUG=false
 LOG_LEVEL=INFO
 # Frontend (Vite)
 VITE_API_BASE=http://localhost:8000
+
+# Billing / Stripe
+STRIPE_SECRET_KEY=sk_test_your_key
+STRIPE_WEBHOOK_SECRET=whsec_your_secret
+STRIPE_PRICE_POC=price_poc_monthly
+STRIPE_PRICE_PRO_T1=price_pro_t1_monthly
+STRIPE_PRICE_PRO_T2=price_pro_t2_monthly
+STRIPE_PRICE_PRO_T3=price_pro_t3_monthly
+STRIPE_PRICE_SETUP=price_setup_onetime
+STRIPE_BILLING_RETURN_BASE=http://localhost:5173
```

```diff
diff --git a/infra/docker-compose.yml b/infra/docker-compose.yml
@@
     environment:
       POSTGRES_URI: postgresql+psycopg2://app:pass@db:5432/ssdr
       REDIS_URL: redis://redis:6379
@@
       JWT_SECRET: change_me_in_production
       ALLOWED_ORIGINS: http://localhost:5173,http://frontend:5173
+      STRIPE_SECRET_KEY: ${STRIPE_SECRET_KEY}
+      STRIPE_WEBHOOK_SECRET: ${STRIPE_WEBHOOK_SECRET}
+      STRIPE_PRICE_POC: ${STRIPE_PRICE_POC}
+      STRIPE_PRICE_PRO_T1: ${STRIPE_PRICE_PRO_T1}
+      STRIPE_PRICE_PRO_T2: ${STRIPE_PRICE_PRO_T2}
+      STRIPE_PRICE_PRO_T3: ${STRIPE_PRICE_PRO_T3}
+      STRIPE_PRICE_SETUP: ${STRIPE_PRICE_SETUP}
+      STRIPE_BILLING_RETURN_BASE: ${STRIPE_BILLING_RETURN_BASE}
@@
     environment:
       POSTGRES_URI: postgresql+psycopg2://app:pass@db:5432/ssdr
       REDIS_URL: redis://redis:6379
@@
-      S3_BUCKET: ssdr-evidences
+      S3_BUCKET: ssdr-evidences
+      STRIPE_SECRET_KEY: ${STRIPE_SECRET_KEY}
```

```diff
diff --git a/api/app/routers/billing.py b/api/app/routers/billing.py
@@
-from ..config import settings
+from ..config import settings
+import uuid
@@
-# Configure Stripe
-stripe.api_key = settings.STRIPE_API_KEY
+# Configure Stripe
+stripe.api_key = settings.STRIPE_SECRET_KEY
@@
-    success_url = request.success_url or "http://localhost:5173/settings?billing=success"
-    cancel_url = request.cancel_url or "http://localhost:5173/settings?billing=cancel"
+    base_url = settings.STRIPE_BILLING_RETURN_BASE.rstrip("/")
+    success_url = request.success_url or f"{base_url}/settings?billing=success"
+    cancel_url = request.cancel_url or f"{base_url}/settings?billing=cancel"
@@
-        tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
+        tenant = db.query(Tenant).filter(Tenant.id == uuid.UUID(tenant_id)).first()
@@
-        return {"ok": True, "message": "Event already processed"}
+        return {"ok": True, "message": "Event already processed"}
```

```diff
diff --git a/api/alembic/versions/001_initial_schema.py b/api/alembic/versions/001_initial_schema.py
@@
-    op.create_table('tenant',
-        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
-        sa.Column('name', sa.Text(), nullable=False),
-        sa.Column('plan', sa.Text(), nullable=False),
-        sa.Column('is_controller', sa.Boolean(), nullable=True),
-        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
+    op.create_table('tenant',
+        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
+        sa.Column('name', sa.Text(), nullable=False),
+        sa.Column('plan', sa.Text(), nullable=False, server_default='free'),
+        sa.Column('is_controller', sa.Boolean(), nullable=True),
+        sa.Column('stripe_customer_id', sa.Text(), nullable=True),
+        sa.Column('stripe_subscription_id', sa.Text(), nullable=True),
+        sa.Column('billing_status', sa.Text(), nullable=False, server_default='inactive'),
+        sa.Column('trial_until', sa.DateTime(timezone=True), nullable=True),
+        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
         sa.PrimaryKeyConstraint('id')
     )
```

```diff
diff --git a/api/app/routers/exports.py b/api/app/routers/exports.py
@@
-from ..services.audit import log_audit_event
+from ..services.audit import log_audit_event
+from ..services.feature_gates import get_feature_gate
@@
-    # Generate unique export ID
+    # Enforce plan limits before generating
+    feature_gate = get_feature_gate(db)
+    feature_gate.enforce_export_limit(current_user.tenant)
+
+    # Generate unique export ID
```

### 3.2 Billing frontend alinhado ao ApiClient

```diff
diff --git a/src/lib/api.ts b/src/lib/api.ts
@@
-  private async request<T = unknown>(
+  public async request<T = unknown>(
     path: string,
     init: RequestInit = {},
     options: RequestOptions = {}
   ): Promise<T> {
```

```diff
diff --git a/src/types/billing.ts b/src/types/billing.ts
+export interface PlanLimit {
+  active_requests: number;
+  exports_per_day: number;
+  storage_gb: number;
+}
+
+export interface Plan {
+  id: string;
+  name: string;
+  price: string;
+  price_id: string;
+  features: string[];
+  limits: PlanLimit;
+}
+
+export interface BillingUsage {
+  active_requests: number;
+  exports_this_month: number;
+  storage_gb: number;
+}
+
+export interface BillingStatus {
+  plan: string;
+  billing_status: string;
+  stripe_customer_id?: string;
+  stripe_subscription_id?: string;
+  trial_until?: string;
+  usage: BillingUsage;
+}
+
+export interface CheckoutResponse {
+  checkout_url: string;
+  session_id: string;
+}
+
+export interface PortalResponse {
+  portal_url: string;
+}
```

```diff
diff --git a/src/lib/billingApi.ts b/src/lib/billingApi.ts
-import { apiClient } from "./api";
-
-export interface Plan {
-  id: string;
-  name: string;
-  price: string;
-  price_id: string;
-  features: string[];
-  limits: {
-    active_requests: number;
-    exports_per_day: number;
-    storage_gb: number;
-  };
-}
-
-export interface BillingStatus {
-  plan: string;
-  billing_status: string;
-  stripe_customer_id?: string;
-  stripe_subscription_id?: string;
-  trial_until?: string;
-  usage: {
-    active_requests: number;
-    exports_this_month: number;
-    storage_gb: number;
-  };
-}
-
-export interface CheckoutResponse {
-  checkout_url: string;
-  session_id: string;
-}
-
-export interface PortalResponse {
-  portal_url: string;
-}
+import { apiClient } from "./api";
+import type {
+  BillingStatus,
+  Plan,
+  CheckoutResponse,
+  PortalResponse,
+} from "@/types/billing";
 
 class BillingApiClient {
-
-  async getPlans(): Promise<{plans: Plan[]}> {
-    const response = await fetch(`${apiClient['baseUrl']}/billing/plans`, {
-      headers: { 'Authorization': `Bearer ${localStorage.getItem('ssdr_token')}` }
-    });
-    return response.json();
-  }
-
-  async getBillingStatus(): Promise<BillingStatus> {
-    const response = await fetch(`${apiClient['baseUrl']}/billing/status`, {
-      headers: { 'Authorization': `Bearer ${localStorage.getItem('ssdr_token')}` }
-    });
-    return response.json();
-  }
-
-  async createCheckoutSession(priceId: string, mode: "subscription" | "payment" = "subscription"): Promise<CheckoutResponse> {
-    const response = await fetch(`${apiClient['baseUrl']}/billing/checkout`, {
-      method: "POST",
-      headers: {
-        'Authorization': `Bearer ${localStorage.getItem('ssdr_token')}`,
-        'Content-Type': 'application/json'
-      },
-      body: JSON.stringify({
-        price_id: priceId,
-        mode,
-        success_url: `${window.location.origin}/settings?billing=success`,
-        cancel_url: `${window.location.origin}/settings?billing=cancel`
-      })
-    });
-    return response.json();
-  }
-
-  async createPortalSession(): Promise<PortalResponse> {
-    const response = await fetch(`${apiClient['baseUrl']}/billing/portal`, {
-      headers: { 'Authorization': `Bearer ${localStorage.getItem('ssdr_token')}` }
-    });
-    return response.json();
-  }
+  async getPlans(): Promise<{ plans: Plan[] }> {
+    return apiClient.request<{ plans: Plan[] }>("/billing/plans");
+  }
+
+  async getBillingStatus(): Promise<BillingStatus> {
+    return apiClient.request<BillingStatus>("/billing/status");
+  }
+
+  async createCheckoutSession(
+    priceId: string,
+    mode: "subscription" | "payment" = "subscription",
+  ): Promise<CheckoutResponse> {
+    return apiClient.request<CheckoutResponse>(
+      "/billing/checkout",
+      {
+        method: "POST",
+        body: JSON.stringify({
+          price_id: priceId,
+          mode,
+          success_url: `${window.location.origin}/settings?billing=success`,
+          cancel_url: `${window.location.origin}/settings?billing=cancel`,
+        }),
+      },
+    );
+  }
+
+  async createPortalSession(): Promise<PortalResponse> {
+    return apiClient.request<PortalResponse>("/billing/portal");
+  }
 }
 
 export const billingApi = new BillingApiClient();
```

### 3.3 Documentação Stripe

```diff
diff --git a/README.md b/README.md
@@
-### 3. Apply migrations & seed demo data
+### 3. Apply migrations, seed demo data e configure Stripe (modo test)
@@
 poetry run alembic upgrade head
 psql "$POSTGRES_URI" -f seed/demo_seed.sql   # requires psql installed locally
+# Stripe (modo test)
+stripe login
+stripe listen --forward-to localhost:8000/billing/webhook
```

```diff
diff --git a/docs/local-development.md b/docs/local-development.md
@@
-## 6. Prepare the backend
+## 6. Prepare the backend & Stripe test mode
@@
 poetry run alembic upgrade head
+
+# Stripe test mode
+export STRIPE_SECRET_KEY=sk_test_...
+export STRIPE_WEBHOOK_SECRET=whsec_...
+stripe listen --forward-to localhost:8000/billing/webhook
+stripe trigger checkout.session.completed
@@
-## 7. Run the frontend
+## 7. Run the frontend
```

## 4. Critérios de Aceite (DoD) – Billing

Para dar como concluído:

1. `poetry run alembic upgrade head` aplica as colunas de billing e tabelas auxiliares sem erro.
2. `GET /billing/plans` e `GET /billing/status` autenticados retornam payloads tipados.
3. `POST /billing/checkout` devolve `checkout_url` Stripe válido (modo test).
4. `POST /billing/portal` retorna `portal_url` quando `stripe_customer_id` existe.
5. Webhook com assinatura Stripe válida (via `stripe listen`) atualiza `tenant.billing_status = 'active'` pós checkout e ignora eventos duplicados.
6. Feature gates retornam 402 ao exceder limites (ex.: criação de export) e o frontend mostra CTA de upgrade.
7. `.env.example`, `docker-compose.yml` e `config.py` expõem todas as variáveis `STRIPE_*` requeridas.
8. Frontend usa `apiClient.request(...)`, tipos vivem em `src/types/billing.ts` e `npm run build` passa.

## 5. Roteiro de teste local

1. `cp .env.example .env` e preencha `STRIPE_*` com chaves de teste.
2. `cd infra && docker compose up -d`.
3. `cd ../api && poetry install && poetry run alembic upgrade head`.
4. `stripe login` e `stripe listen --forward-to localhost:8000/billing/webhook`.
5. `cd .. && npm install && npm run dev`.
6. Acesse `http://localhost:5173/login`, autentique com `admin@demo.local / admin123`.
7. Na tela de Settings, faça upgrade disparando `POST /billing/checkout`; conclua o checkout com cartão 4242-4242-4242-4242.
8. Verifique o log do webhook e confirme `billing_status = active` via `GET /billing/status`.
9. Gere exports até receber 402 e valide que o frontend exibe CTA de upgrade.

## 6. Backlog sugerido (não-bloqueante)

- Automatizar CI (lint, build, alembic check, tests).
- Calcular métricas reais de storage/exports para alimentar feature gates.
- Histórico de exports e tela de auditoria.
- OAuth/SSO (fase futura após autenticação real).
- Observabilidade (metrics/logs) para billing e pipeline de intake.

