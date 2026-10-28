# Repeated DevOps task patterns (GFM teams)

**Source note:** The original Bitbucket/GFM thread was not available in this environment. Patterns below are synthesized from **Platform Engineering (DEVOPS) Jira** tickets (especially auth/SSO work), **Confluence runbooks** (ISX UAT, Warba DMS, Decypha, Fintech), and the **`auth-service-devops-lab`** repo purpose. Use this as a study map until you have full Bitbucket access.

**Lab repo:** [umar-inam-asghar/auth-service-devops-lab](https://github.com/umar-inam-asghar/auth-service-devops-lab) (`feature/auth-service` skeleton: Flask app + Dockerfile).

---

## How these five were chosen

| Signal | What it showed |
| --- | --- |
| Last 100 DEVOPS tickets (≈365 days) | **Incident troubleshoot/restore** (~29), **Jenkins/pipelines** (~14), **monitoring/health** (~11), **deploy/release** (~10), **Docker/containers** (~9), **Nginx/SSL** (~9) |
| Auth-specific DEVOPS tickets | Repeated **Compose deploy**, **Nginx + SSO routes**, **Jenkins for Auth Service**, **troubleshoot Auth**, **SSO issuer / env configuration** |
| Runbooks | Same operator loops: `docker compose`, `nginx -t && reload`, `docker logs`, ordered restarts, `.env` / secrets on host |

The five patterns below are the **auth-service-shaped** distillation teams actually repeat—not one-off infra projects (VPN, Bedrock, Hetzner moves, etc.).

---

## Pattern 1 — Docker Compose deploy and roll-forward on a host

**What teams repeat**

- Pull a tagged image (or build on host), update `.env`, `docker compose down` / `up -d`, verify ports and health.
- Roll forward on tag (e.g. `uat-v0.0.1`) or roll back to previous image digest.
- Recreate containers after env or feature-flag changes.

**Representative team work**

- DEVOPS-1000, DEVOPS-1145 — deploy/configure Tadawuly Authentication Service; deploy tag to UAT.
- DEVOPS-1205 — recreate containers so new flags are active.
- Warba / ISX runbooks — `docker compose` lifecycle, log tailing, Postgres health via `pg_isready`.

**Why it matters for auth lab**

Auth backends and Redis/DB sidecars almost always ship as Compose stacks on EC2 before (or alongside) Kubernetes.

**EC2 lab pointer**

See **Pattern 1** in [lab-checklists.md](./lab-checklists.md).

---

## Pattern 2 — Nginx edge: vhost, TLS, reverse proxy, and path routing

**What teams repeat**

- Add or edit `server` blocks; proxy to upstream (`127.0.0.1:<port>` or container name).
- Terminate TLS (Let’s Encrypt, mounted certs, or CDN/Cloudflare in front).
- Route SSO paths (e.g. `/client`, `/auth`, API prefix) to the correct upstream.
- Validate with `nginx -t`, `systemctl reload nginx`, then curl public URL and check access/error logs.

**Representative team work**

- DEVOPS-1270, DEVOPS-1271 — deploy auth FE; configure Nginx `/client` on SSO dev host; vhost + LE SSL for auth-resources.
- Decypha / ISX runbooks — nginx config root, SSL paths, HTTP→HTTPS redirect, 502 triage via logs.

**Why it matters for auth lab**

Users hit **Nginx first**; misconfigured `proxy_pass` or headers (`X-Forwarded-*`, `Host`) break OIDC redirects and cookies.

**EC2 lab pointer**

See **Pattern 2** in [lab-checklists.md](./lab-checklists.md).

---

## Pattern 3 — Jenkins CI/CD: build, test, and promote Auth Service

**What teams repeat**

- Wire repo (Bitbucket/GitHub) → Jenkins multibranch or parameterized job.
- Stages: checkout → unit tests → Docker build/push → deploy script on target host (or trigger downstream job).
- Environment parameters (`UAT`, `DEV`), credentials for registry and SSH, post-deploy smoke step.

**Representative team work**

- DEVOPS-1132, DEVOPS-1109 — create and configure Jenkins CI/CD pipeline for Auth Service (build/test/deploy, documentation).
- DEVOPS-861, DEVOPS-1005 — create/run pipelines across environments; fix node/tooling mismatches.

**Why it matters for auth lab**

Manual SSH deploys do not scale; pipelines are the **repeatable** path your team expects for auth releases.

**EC2 lab pointer**

See **Pattern 3** in [lab-checklists.md](./lab-checklists.md). (Jenkins can run on a second EC2 instance or locally; deploy target = lab EC2.)

---

## Pattern 4 — Auth service incident triage (logs, health, dependency order)

**What teams repeat**

- Confirm symptom (502/500, login failure, token refresh errors).
- Check container/process up, port listening, recent deploy.
- Tail app logs and Nginx error log; check Redis/DB connectivity.
- Restart in **dependency order** (cache/DB → auth API → dependents), not random `restart all`.
- Document timeline and fix for Jira.

**Representative team work**

- DEVOPS-1130, DEVOPS-1112 — troubleshoot and resolve Auth Service issues.
- DEVOPS-1401 — readiness/liveness HTTP APIs for probe-friendly services.
- Fintech runbook — cold start order: Redis → auth (`8022`) → SSE/FO/BO; Nginx separate on host.

**Why it matters for auth lab**

Auth outages are high visibility; teams expect **structured triage**, not guesswork.

**EC2 lab pointer**

See **Pattern 4** in [lab-checklists.md](./lab-checklists.md).

---

## Pattern 5 — SSO / OIDC environment configuration and validation

**What teams repeat**

- Set issuer URL, client IDs, redirect URIs, CORS, cookie domain via `.env` or Spring config.
- Align public hostname (Nginx) with issuer and redirect URLs after DNS/SSL changes.
- Redeploy or restart auth after config change; validate login, logout, token refresh, wrong-client failure mode.

**Representative team work**

- DEVOPS-1329 — configure Tadawuly-UAT SSO issuer and Mubasher authentication settings.
- DEVOPS-1224, DEVOPS-1270 — deploy auth resources and FE; route SSO dev domains.

**Why it matters for auth lab**

Many “auth bugs” are **configuration drift** between env files, Nginx public URL, and IdP registration.

**EC2 lab pointer**

See **Pattern 5** in [lab-checklists.md](./lab-checklists.md).

---

## Quick reference matrix

| # | Pattern | Primary tools | Done when |
| --- | --- | --- | --- |
| 1 | Compose deploy / rollback | Docker, Compose, `.env` | New tag live; health OK; rollback tested once |
| 2 | Nginx edge | `nginx`, TLS, logs | `nginx -t` clean; HTTPS curl OK; paths hit correct upstream |
| 3 | Jenkins CI/CD | Jenkins, Dockerfile, registry | Pipeline green; artifact on host; smoke pass |
| 4 | Incident triage | `docker logs`, `journalctl`, curl | Root cause noted; ordered restart; Jira-style summary written |
| 5 | SSO / env config | `.env`, auth app config | Login + refresh work; issuer matches public URL |

---

## Related internal links (when you have access)

- [Fintech runbook](https://gfmtech.atlassian.net/wiki/spaces/EGIDINFRA/pages/2903670785/Fintech+runbook) — auth unit order and operator commands.
- [ISX UAT runbook](https://gfmtech.atlassian.net/wiki/spaces/DI/pages/2862022657/ISX+UAT+Strangler+Legacy+Portal+Runbook+2026-08-25) — Nginx + Compose operations template.
- Jira: DEVOPS-1132, DEVOPS-1130, DEVOPS-1145, DEVOPS-1329, DEVOPS-1270.

Practice schedule: [lab-checklists.md](./lab-checklists.md#8-day-practice-schedule).
