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

## 2. nginx

```bash
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

Take a final `mysqldump` of the `Thirukkural` database and keep it with the
repository before removing the MySQL user, so the corpus can be regenerated
from source if it ever needs to be.

Remove the old `location /api { proxy_pass ... }` block from the nginx config
at the same time — the new config here does not include one.

## 6. Optional: Cloudflare in front

The site is entirely static and cacheable, so putting the domain behind
Cloudflare's free tier gives readers outside India a local edge cache and takes
the bandwidth off this server. Proxy the A record, set SSL mode to "Full
(strict)", and leave the origin config as it is.
