# انتشار فرانت Atlas با Docker

این فرانت با هر تگ `release-*` به‌صورت image نسخه‌دار ساخته و روی همان سروری اجرا می‌شود که Backend Atlas روی آن است. کانتینر فرانت به شبکه‌ی Docker `atlas_default` وصل می‌شود و Nginx مسیرهای `/iam`، `/oracle` و `/health` را به سرویس Backend با نام `api:8080` پروکسی می‌کند.

آدرس فرانت:

```text
http://45.82.137.126:8580/
```

## Secretهای GitHub

در Repository فرانت این دو Secret را بساز؛ مقدارشان همان کلیدهای Deploy بک‌اند است:

```text
ATLAS_DEPLOY_SSH_PRIVATE_KEY
ATLAS_DEPLOY_SSH_HOST_KEY
```

## انتشار

```powershell
git checkout main
git pull origin main
git tag release-1.0.0
git push origin release-1.0.0
```

Workflow ابتدا `npm ci` و `npm run build` را اجرا می‌کند، سپس image با نام `atlas-frontend:<tag>` ساخته و روی سرور منتقل می‌شود. کانتینر با نام `atlas-frontend` و پورت `8580:80` اجرا می‌شود و کانتینر قدیمی `oracle` را که این پورت را گرفته حذف می‌کند.

## بررسی روی سرور

```bash
sudo docker ps --filter name=atlas-frontend
sudo docker logs atlas-frontend
curl -i http://127.0.0.1:8580/health
```

برای بازگشت دستی به image قبلی:

```bash
sudo docker rm -f atlas-frontend
sudo docker run -d --name atlas-frontend --restart unless-stopped \
  --network atlas_default -p 8580:80 atlas-frontend:previous
```

Backend باید قبل از فرانت روی شبکه‌ی `atlas_default` و سرویس `api` فعال باشد.
