# Server setup

One-time steps on the Linux box, then a short routine for each deploy. The
site is static, so the server needs nothing but nginx — no Node, no database,
no application server.

## 1. Directories

```bash
sudo mkdir -p /var/www/thirukkural/releases /var/www/certbot
```

Each deploy unpacks into `releases/<timestamp>/`, and a `current` symlink
points at whichever release is live. Rolling back is moving that symlink.

While you are here, confirm the basics in `/etc/ssh/sshd_config`:
`PasswordAuthentication no` if you use keys, `PermitRootLogin no`. If the box
is reachable from the internet, `fail2ban` is worth the five minutes.

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

The security headers live in their own snippet because nginx does not merge
`add_header` across levels: a location that sets its own `Cache-Control` drops
every header inherited from `server`, so each location includes the snippet.

## 3. TLS

```bash
sudo certbot --nginx -d thirukkural.xyz -d www.thirukkural.xyz
```

Renewal is handled by the `certbot.timer` systemd unit that the package
installs. Check it with `systemctl list-timers | grep certbot`.

## 4. Deploying

### On your machine

```bash
npm run package
```

This runs the production build and packs it into
`thirukkural-<timestamp>.tar.gz` — about 14 MB, from an 86 MB build — then
prints the server commands with the timestamp already filled in. Upload it
however suits you:

```bash
scp thirukkural-20260920-091824.tar.gz you@YOUR-SERVER:/tmp/
```

### On the server

```bash
RELEASE=20260920-091824      # the timestamp from the filename

sudo mkdir -p /var/www/thirukkural/releases/$RELEASE
sudo tar -xzf /tmp/thirukkural-$RELEASE.tar.gz -C /var/www/thirukkural/releases/$RELEASE
sudo chown -R www-data:www-data /var/www/thirukkural/releases/$RELEASE

sudo ln -sfn /var/www/thirukkural/releases/$RELEASE /var/www/thirukkural/current.tmp
sudo mv -Tf /var/www/thirukkural/current.tmp /var/www/thirukkural/current

rm /tmp/thirukkural-$RELEASE.tar.gz
```

The symlink swap is the deploy: until it moves, visitors keep seeing the
previous release, and the swap itself is atomic. nginx needs no reload — it
follows the symlink on the next request.

Use whichever user nginx runs as in the `chown`; `ps -o user= -C nginx | sort -u`
says which it is.

### Check it

```bash
curl -I https://thirukkural.xyz/                     # 200, Cache-Control: no-cache
curl -I https://thirukkural.xyz/kural/42/            # 200
curl -sI https://thirukkural.xyz/ | grep -i strict-transport   # headers present
curl -o /dev/null -w '%{http_code}\n' https://thirukkural.xyz/nope   # 404
curl -s https://thirukkural.xyz/ngsw.json | head -c 80           # service worker manifest
```

Readers already running the app get the new build through the service worker:
it notices the change, downloads it in the background, and the app offers
"புதிய பதிப்பு தயார்".

### Tidying old releases

Releases are kept so a rollback is instant. Prune them when there are too many:

```bash
ls -1dt /var/www/thirukkural/releases/*/ | tail -n +6 | sudo xargs -r rm -rf
```

### Rolling back

```bash
ls -1t /var/www/thirukkural/releases        # newest first
sudo ln -sfn /var/www/thirukkural/releases/PREVIOUS /var/www/thirukkural/current.tmp
sudo mv -Tf /var/www/thirukkural/current.tmp /var/www/thirukkural/current
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
