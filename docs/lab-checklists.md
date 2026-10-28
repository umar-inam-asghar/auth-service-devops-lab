# EC2 lab checklists — auth-service DevOps patterns

Use a **single Ubuntu 22.04 EC2** (or two: one app + one optional Jenkins). Replace placeholders:

| Placeholder | Example |
| --- | --- |
| `<EC2_PUBLIC_IP>` | `203.0.113.10` |
| `<LAB_DOMAIN>` | `auth-lab.example.com` (or `/etc/hosts` → EC2 IP) |
| `<APP_DIR>` | `/opt/auth-service-devops-lab` |
| `<IMAGE>` | `auth-service:dev` |
| `<AUTH_PORT>` | `8080` |

Base EC2 prep (once):

```bash
sudo apt update && sudo apt install -y docker.io docker-compose-v2 nginx curl jq
sudo usermod -aG docker "$USER"   # re-login
sudo mkdir -p <APP_DIR> && sudo chown "$USER":"$USER" <APP_DIR>
```

Clone lab repo on EC2:

```bash
git clone https://github.com/umar-inam-asghar/auth-service-devops-lab.git <APP_DIR>
cd <APP_DIR> && git checkout feature/auth-service   # when using skeleton branch
```

---

## Pattern 1 — Docker Compose deploy and roll-forward

**Goal:** Repeatable deploy and rollback of the auth stack on EC2.

### Checklist (one repetition)

- [ ] **1.1** Create `docker-compose.yml` in `<APP_DIR>` (services: `auth`, optional `redis`; publish `<AUTH_PORT>`).
- [ ] **1.2** Copy `.env.example` → `.env`; set `AUTH_ENABLED=true`, image tag, DB/Redis URLs (placeholders OK).
- [ ] **1.3** Build: `docker compose build` (or `docker build -t <IMAGE> .`).
- [ ] **1.4** Deploy: `docker compose up -d`.
- [ ] **1.5** Verify: `docker compose ps`; `curl -sf http://127.0.0.1:<AUTH_PORT>/health` (or app root).
- [ ] **1.6** Logs: `docker compose logs -f --tail=100 auth` (Ctrl+C when done).
- [ ] **1.7** Roll-forward: change image tag in `.env`, `docker compose pull` (if using registry), `docker compose up -d`.
- [ ] **1.8** Rollback: revert tag/digest, `docker compose up -d`; confirm previous behavior.
- [ ] **1.9** Teardown drill: `docker compose down` (optional `-v` only in lab), bring back up.

**Sample compose skeleton** (customize):

```yaml
# <APP_DIR>/docker-compose.yml
services:
  auth:
    image: ${AUTH_IMAGE:-auth-service:dev}
    build: .
    env_file: .env
    ports:
      - "127.0.0.1:<AUTH_PORT>:8080"
    restart: unless-stopped
```

---

## Pattern 2 — Nginx edge: vhost, TLS, reverse proxy

**Goal:** Public HTTPS → auth upstream on localhost/container.

### Checklist (one repetition)

- [ ] **2.1** Ensure auth listens on `127.0.0.1:<AUTH_PORT>` only (not wide-open `0.0.0.0` in prod-like lab).
- [ ] **2.2** Create `/etc/nginx/sites-available/<LAB_DOMAIN>` with:
  - `listen 80` (and `443 ssl` when using certs)
  - `location /` → `proxy_pass http://127.0.0.1:<AUTH_PORT>`
  - `proxy_set_header Host $host;` and `X-Forwarded-Proto $scheme`
- [ ] **2.3** Optional SSO paths: `location /client/ { ... }`, `location /api/auth/ { ... }` → correct upstreams.
- [ ] **2.4** Enable site: symlink to `sites-enabled`, disable default if needed.
- [ ] **2.5** TLS: use `certbot --nginx -d <LAB_DOMAIN>` **or** self-signed for lab (`/etc/nginx/ssl/` placeholders).
- [ ] **2.6** Test config: `sudo nginx -t`.
- [ ] **2.7** Reload: `sudo systemctl reload nginx`.
- [ ] **2.8** Verify: `curl -sI http://<LAB_DOMAIN>/` and `https://<LAB_DOMAIN>/` (if TLS).
- [ ] **2.9** Break/fix drill: point `proxy_pass` to wrong port, observe 502, read `/var/log/nginx/error.log`, fix, reload.

**Sample server block skeleton:**

```nginx
server {
    listen 80;
    server_name <LAB_DOMAIN>;
    location / {
        proxy_pass http://127.0.0.1:<AUTH_PORT>;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## Pattern 3 — Jenkins CI/CD build and deploy to EC2

**Goal:** Pipeline builds image and updates Compose on lab EC2 (manual approval OK in lab).

### Checklist (one repetition)

- [ ] **3.1** Install Jenkins (EC2 or local) + Docker agent or SSH agent to `<EC2_PUBLIC_IP>`.
- [ ] **3.2** Add credentials: registry (if any), SSH key for EC2, `.env` secret file (masked).
- [ ] **3.3** Create pipeline job `auth-service-lab` with parameters: `GIT_REF`, `DEPLOY_ENV=lab`.
- [ ] **3.4** Stage **Checkout** — clone `auth-service-devops-lab`.
- [ ] **3.5** Stage **Test** — `python -m pytest` or `docker compose run --rm auth pytest` (if present).
- [ ] **3.6** Stage **Build** — `docker build -t <IMAGE>:${BUILD_NUMBER} .` and tag `latest`.
- [ ] **3.7** Stage **Push** (optional) — push to GHCR/ECR placeholder registry.
- [ ] **3.8** Stage **Deploy** — SSH to EC2: `cd <APP_DIR> && export AUTH_IMAGE=<IMAGE>:${BUILD_NUMBER} && docker compose up -d`.
- [ ] **3.9** Stage **Smoke** — curl health via localhost on EC2 and via Nginx URL.
- [ ] **3.10** Fail on red smoke; archive console log; document job URL.

**Deploy script placeholder** on EC2 (`<APP_DIR>/deploy.sh`):

```bash
#!/usr/bin/env bash
set -euo pipefail
export AUTH_IMAGE="${1:?image required}"
cd <APP_DIR>
docker compose up -d --remove-orphans
curl -sf "http://127.0.0.1:<AUTH_PORT>/health"
```

---

## Pattern 4 — Auth incident triage (logs, health, restart order)

**Goal:** Structured debug when “auth is down” or login fails.

### Checklist (one repetition)

- [ ] **4.1** Record symptom + time (simulate: stop container or wrong `.env` issuer).
- [ ] **4.2** Edge check: `curl -sI https://<LAB_DOMAIN>/` — note status (502 vs 401 vs 500).
- [ ] **4.3** Nginx: `sudo tail -50 /var/log/nginx/error.log`.
- [ ] **4.4** Containers: `docker compose ps`; if down, `docker compose up -d`.
- [ ] **4.5** App logs: `docker compose logs --tail=200 auth`.
- [ ] **4.6** Port: `ss -tlnp | grep <AUTH_PORT>`.
- [ ] **4.7** Dependency order restart (lab): `docker compose restart redis` (if any) → `auth` → re-test.
- [ ] **4.8** Host resources: `df -h`, `free -h` (OOM pattern from team tickets).
- [ ] **4.9** Write 5-line incident summary (cause, fix, verification) as Jira comment practice.

**Simulated break ideas**

- Stop auth container → expect 502 at Nginx.
- Bad Redis URL in `.env` → expect crash loop in logs.
- Wrong `AUTH_ENABLED` flag → expect 503/disabled behavior from skeleton app.

---

## Pattern 5 — SSO / OIDC environment configuration

**Goal:** Public URL, app env, and IdP settings stay aligned.

### Checklist (one repetition)

- [ ] **5.1** Document public entry: `https://<LAB_DOMAIN>` (must match Nginx `server_name`).
- [ ] **5.2** In `.env`, set placeholders:
  - `OIDC_ISSUER=https://<LAB_DOMAIN>/auth/realms/lab`
  - `OIDC_CLIENT_ID=lab-client`
  - `OIDC_REDIRECT_URI=https://<LAB_DOMAIN>/client/callback`
  - `CORS_ALLOWED_ORIGINS=https://<LAB_DOMAIN>`
- [ ] **5.3** Redeploy: `docker compose up -d` after env change.
- [ ] **5.4** Validate redirect chain: curl login endpoint (or browser) — no mixed-content or wrong-host redirects.
- [ ] **5.5** Break drill: set issuer to `http://` while site is `https://` — observe failure, fix to `https://`.
- [ ] **5.6** Cookie/domain drill: note `Set-Cookie` Domain and Secure flags via `curl -v`.
- [ ] **5.7** Logout + token refresh smoke (manual or scripted curl with tokens if implemented).
- [ ] **5.8** Checklist sign-off: issuer, redirect URI, and Nginx TLS hostname all match.

---

## 8-day practice schedule

**Target:** **4 repetitions per pattern** (20 short sessions total). Each rep = one full checklist for that pattern. Mark reps in a notebook or git branch.

| Day | Session A | Session B | Patterns touched |
| --- | --- | --- | --- |
| **1** | P1 rep 1 — first Compose up from scratch | P2 rep 1 — HTTP reverse proxy only | P1×1, P2×1 |
| **2** | P1 rep 2 — roll-forward tag + rollback | P3 rep 1 — create Jenkins job skeleton (no deploy yet) | P1×2, P3×1 |
| **3** | P1 rep 3 — `.env` change + recreate containers | P4 rep 1 — triage stopped container (502) | P1×3, P4×1 |
| **4** | P2 rep 2 — add TLS (certbot or self-signed) | P5 rep 1 — set OIDC placeholders + redeploy | P2×2, P5×1 |
| **5** | P2 rep 3 — `/client` path routing drill | P4 rep 2 — bad Redis URL log triage | P2×3, P4×2 |
| **6** | P3 rep 2 — pipeline with test + build stages | P3 rep 3 — add SSH deploy + smoke stage | P3×2–3 |
| **7** | P4 rep 3 — disk/OOM check + restart order | P5 rep 2 — issuer http/https mismatch fix | P4×3, P5×2 |
| **8** | P5 rep 3 — full login/logout validation | **Capstone rep 4 for all patterns** — single end-to-end release: merge → Jenkins → Compose on EC2 → Nginx HTTPS → SSO env check → triage note | P1×4, P2×4, P3×4, P4×4, P5×3–4 |

### Rep counting guide

| Pattern | Rep 1 | Rep 2 | Rep 3 | Rep 4 |
| --- | --- | --- | --- | --- |
| **P1 Compose** | Day 1A | Day 2A | Day 3A | Day 8 capstone |
| **P2 Nginx** | Day 1B | Day 4A | Day 5A | Day 8 capstone |
| **P3 Jenkins** | Day 2B | Day 6A | Day 6B | Day 8 capstone |
| **P4 Triage** | Day 3B | Day 5B | Day 7A | Day 8 capstone |
| **P5 SSO/env** | Day 4B | Day 7B | Day 8A | Day 8 capstone (verify) |

**Day 8 capstone (all patterns):**

1. Change app or `.env` on a branch; run Jenkins pipeline to EC2.
2. Confirm Nginx HTTPS and health curl pass.
3. Intentionally break one config (team-style); triage and fix using Pattern 4 steps.
4. Confirm SSO-related env vars match public URL; write a short DEVOPS-style closure comment.

---

## Optional stretch (after 8 days)

- Add **readiness/liveness** HTTP endpoints (team ticket DEVOPS-1401 style) and probe them from Nginx or a simple cron.
- Mirror **Fintech cold-start order** on your lab: Redis → auth → dependent mock service.

Pattern definitions: [repeated-tasks-from-teams.md](./repeated-tasks-from-teams.md).
