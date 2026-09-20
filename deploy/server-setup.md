# Server setup

One-time steps on the Linux box. After this, deploying is `npm run deploy`.

## 1. Directories and a deploy user

```bash
sudo adduser --disabled-password --gecos "" deploy
sudo mkdir -p /var/www/thirukkural/releases /var/www/certbot
sudo chown -R deploy:deploy /var/www/thirukkural
```

Add your workstation's public key to `/home/deploy/.ssh/authorized_keys`. The
deploy user needs no sudo: it only writes inside `/var/www/thirukkural`.

Restrict what that key can do, so a leaked deploy key cannot open a shell —
prefix the line in `authorized_keys` with:

```
restrict,pty ssh-ed25519 AAAA...
```

`restrict` turns off agent and port forwarding, X11 and user rc; `pty` is kept
because `deploy.sh` runs a short `bash -s` block over ssh to swap the symlink.

While you are there, confirm the basics in `/etc/ssh/sshd_config`:
`PasswordAuthentication no`, `PermitRootLogin no`. If the box is reachable from
the internet, `fail2ban` is worth the five minutes.

## 2. nginx

```bash
sudo cp deploy/security-headers.conf /etc/nginx/snippets/thirukkural-security-headers.conf
sudo cp deploy/nginx.conf /etc/nginx/sites-available/thirukkural.xyz
sudo ln -s /etc/nginx/sites-available/thirukkural.xyz /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

`nginx -t` will fail until the TLS certificate exists, so on a fresh box run
certbot first (step 3) or comment out the `listen 443` blocks for the first
reload.

## 3. TLS

```bash
sudo certbot --nginx -d thirukkural.xyz -d www.thirukkural.xyz
```

Renewal is handled by the `certbot.timer` systemd unit that the package
installs. Check it with `systemctl list-timers | grep certbot`.

## 4. First deploy

From your workstation:

```bash
cp deploy/.env.example deploy/.env   # then edit DEPLOY_HOST
npm run deploy
```

## 5. Retiring the old stack

The app no longer calls an API — the whole corpus is compiled into the site.
Once the new build is serving:

```bash
# Confirm nothing is still hitting the API:
sudo grep -c '/api/' /var/log/nginx/thirukkural.access.log

sudo systemctl stop tomcat
sudo systemctl disable tomcat
```

Take a final `mysqldump` of the database and keep it somewhere private before
removing the MySQL user, so the corpus can be regenerated if it ever needs to
be. Keep the dump out of this repository.

Until Tomcat is off, make sure it and MySQL are not reachable from outside the
box — they only ever needed to talk to nginx on localhost:

```bash
sudo ss -ltnp | grep -E '8080|3306'   # expect 127.0.0.1, not 0.0.0.0
```

Remove the old `location /api { proxy_pass ... }` block from the nginx config
at the same time — the new config here does not include one.

## 6. Optional: Cloudflare in front

The site is entirely static and cacheable, so putting the domain behind
Cloudflare's free tier gives readers outside India a local edge cache and takes
the bandwidth off this server. Proxy the A record, set SSL mode to "Full
(strict)", and leave the origin config as it is.
