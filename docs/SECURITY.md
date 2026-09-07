# Security Model & Threat Assessment

Landfill is engineered specifically for **single-owner, self-hosted private deployments**. It minimizes attack surface by deliberately omitting complex enterprise identity features (e.g., user registrations, permission matrices, email reset links) in favor of a lean, hardened single-tenant security architecture.

---

## 1. Single-Owner Threat Model

Landfill operates under the assumption that **exactly one trusted administrator owns the instance**.

```
┌─────────────────────────────────────────────────────────────┐
│                       Trust Boundary                        │
│                                                             │
│  [ Untrusted Network / Browser ]                            │
│                 │                                           │
│                 ▼  (TLS / Same-Origin / Rate-Limiting)      │
│  [ Caddy Edge Proxy ] ───► [ Express API + Auth Middleware ]│
│                                      │                      │
│                                      ▼                      │
│                           [ SQLite (scrypt + WAL) ]         │
│                           [ Local Disk Storage ]            │
└─────────────────────────────────────────────────────────────┘
```

### Threat Vectors & Mitigations

| Threat Vector                         | Mitigation Strategy                                                                                                                                          |
| :------------------------------------ | :----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Credential Brute-Forcing**          | Progressive rate-limiting and delay throttling on `/api/auth/login` and `/api/auth/setup`. Memory-hard **scrypt** key derivation.                            |
| **Session Hijacking / XSS Theft**     | Session tokens stored exclusively in `HttpOnly`, `SameSite=Strict` cookies. Tokens are hashed with SHA-256 in the database.                                  |
| **Cross-Site Request Forgery (CSRF)** | Enforced `SameSite=Strict` cookies and mandatory `Origin` / `Referer` header validation (`requireSameOrigin` middleware) on all state-changing HTTP methods. |
| **Path Traversal Attacks**            | Disk storage filenames use generated UUIDs rather than user-supplied filenames. All chunk session directories use sanitized path basenames.                  |
| **Stale / Abandoned Sessions**        | Dual-window session expiration: 7 days rolling idle timeout + 30 days absolute hard expiration.                                                              |
| **Accidental Network Exposure**       | Docker Compose binds by default strictly to `127.0.0.1`. Plain HTTP over external networks is strongly discouraged.                                          |

---

## 2. First-Run Bootstrap Setup

When Landfill boots for the first time with an uninitialized database:

1. The API generates a cryptographically random, ephemeral 32-character hexadecimal setup token.
2. The setup token is printed exclusively to the **API process terminal (stdout)**:
   ```text
   ================================================================
   [Auth] Owner setup required!
   [Auth] Use this one-time setup code in the web browser:
   [Auth] 3f9a7b1c4e2d8a0f9b8c7d6e5a4b3c2d
   ================================================================
   ```
3. The owner inputs this code into the browser during initial setup to define the permanent password (minimum 12 characters).
4. **Ephemerality**: The setup code is stored only in API memory. It is invalidated immediately once setup completes, or when the process restarts.

---

## 3. Cryptographic Storage & Session Management

### Password Hashing (scrypt)

Landfill uses Node.js native `crypto.scrypt` with security parameters:

- **Cost parameter ($N$)**: `32768` ($2^{15}$)
- **Block size ($r$)**: `8`
- **Parallelization ($p$)**: `1`
- **Key Length**: 64 bytes (512 bits)
- **Salt**: 32 bytes of cryptographically random data generated via `crypto.randomBytes()`.

Stored format in SQLite `owner_credentials`:

```text
scrypt$N=32768,r=8,p=1$<hex_salt>$<hex_derived_key>
```

### Session Architecture

1. **Token Generation**: On successful authentication, the server generates a 32-byte (256-bit) cryptographically secure random token.
2. **Database Hashing**: The raw token is sent to the client; only the **SHA-256 hash** of the token is persisted in SQLite `auth_sessions`.
3. **Rolling & Absolute Lifetime**:
   - `expires_at`: Updated to `Date.now() + 7 days` on every authenticated request (`last_seen_at` rolling update).
   - `absolute_expires_at`: Fixed at `Date.now() + 30 days` at creation. Once reached, the session is invalidated regardless of recent activity.
4. **Session Cookie Directives**:
   - `HttpOnly`: JavaScript cannot access `document.cookie`.
   - `SameSite=Strict`: The cookie is never sent along with cross-site requests.
   - `Path=/api`: Cookie scope is limited to API routes.
   - `Secure`: Set to `true` when running over HTTPS (or automatically detected via `COOKIE_SECURE=auto`).

---

## 4. Cross-Site Mutation Defense (`requireSameOrigin`)

All mutating requests (`POST`, `PUT`, `PATCH`, `DELETE`) pass through the `requireSameOrigin` middleware:

1. Checks the incoming `Origin` or `Referer` header against the expected `Host` / `X-Forwarded-Host` header.
2. If the origin does not match the server host, the request is rejected immediately with `403 Forbidden` (`Origin mismatch`).
3. Non-browser API clients (such as custom curl scripts) must supply matching host headers.

---

## 5. Host-Only Admin Recovery (`auth:reset`)

If the instance owner forgets their password, Landfill provides a safe, host-only credential reset utility:

```sh
# Inside Docker container
docker compose exec api npm run auth:reset --workspace @landfill/api -- --yes

# Or on bare-metal / local development
npm run auth:reset --workspace @landfill/api -- --yes
```

### Recovery Behavior:

- Clears `owner_credentials` and purges all active rows from `auth_sessions`.
- **Preserves all files, folders, and storage blobs intact**.
- On API restart, generates a brand new one-time bootstrap setup code in stdout for re-initialization.

---

## 6. Reverse Proxy & Network Hardening Guide

Because Landfill does not bundle native ACME/Let's Encrypt TLS certificates, it should be deployed behind a secure reverse proxy when accessed beyond `localhost`.

### Caddyfile Example (with Automatic HTTPS)

```caddy
drive.example.com {
    reverse_proxy 127.0.0.1:8080 {
        header_up X-Forwarded-Proto {scheme}
        header_up X-Forwarded-Host {host}
    }
}
```

### Nginx Example (with SSL Termination)

```nginx
server {
    listen 443 ssl http2;
    server_name drive.example.com;

    ssl_certificate /etc/letsencrypt/live/drive.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/drive.example.com/privkey.pem;

    client_max_body_size 500M;

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
    }
}
```
