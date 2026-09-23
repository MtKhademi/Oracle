# انتشار Oracle با Docker

با هر تگ `release-*`، GitHub Actions کد همان تگ را داخل یک Docker image با نام `oracle:<tag>` می‌سازد، image را با SSH به سرور `45.82.137.126` منتقل می‌کند و کانتینر `oracle` را روی پورت ۸۰ بالا می‌آورد. imageها با تگ نسخه روی خود سرور نگه داشته می‌شوند؛ برای این مسیر به registry یا حساب GHCR نیاز نیست.

## ۱. آماده‌سازی یک‌بارهٔ Ubuntu 24.04

Docker Engine را مطابق [راهنمای رسمی نصب روی Ubuntu](https://docs.docker.com/engine/install/ubuntu/) نصب کنید و با `sudo docker version` بررسی کنید. سپس با حساب مدیریتی خودتان از طریق SSH روی سرور اجرا کنید:

```sh
id oracle-deploy >/dev/null 2>&1 || sudo adduser --disabled-password --gecos '' oracle-deploy
sudo usermod -aG docker oracle-deploy
sudo install -d -o oracle-deploy -g oracle-deploy -m 700 /home/oracle-deploy/.ssh
```

عضویت در گروه `docker` به این حساب دسترسی هم‌سطح root می‌دهد؛ کلید این حساب را فقط برای انتشار نگه دارید. اگر تنظیمات نسخهٔ قبلی را انجام داده‌اید و Nginx خود سرور پورت ۸۰ را گرفته است، روی این سرور اختصاصی آن را متوقف کنید تا کانتینر بتواند پورت ۸۰ را بگیرد:

```sh
sudo systemctl disable --now nginx
```

روی رایانهٔ خودتان یک کلید مخصوص انتشار بسازید (بدون passphrase تا Action بدون ورودی اجرا شود):

```sh
ssh-keygen -t ed25519 -C oracle-github-actions -f ~/.ssh/oracle_deploy -N ''
```

محتوای `~/.ssh/oracle_deploy.pub` را در فایل `/home/oracle-deploy/.ssh/authorized_keys` روی سرور بگذارید. برای مثال، روی سرور کلید عمومی واقعی خود را جایگزین متن نمونه کنید:

```sh
printf '%s\n' 'ssh-ed25519 AAAA... oracle-github-actions' | sudo tee /home/oracle-deploy/.ssh/authorized_keys >/dev/null
sudo chown oracle-deploy:oracle-deploy /home/oracle-deploy/.ssh/authorized_keys
sudo chmod 600 /home/oracle-deploy/.ssh/authorized_keys
```

کلید خصوصی (`~/.ssh/oracle_deploy`) را فقط در secret مخزن GitHub با نام `ORACLE_SSH_PRIVATE_KEY` قرار دهید. مسیر: **Settings → Secrets and variables → Actions → New repository secret**. اگر از قبل کلید انتشار را برای PR قبلی تنظیم کرده‌اید، همان را نگه دارید.

برای ثبت کلید واقعی *خود سرور* در secret دوم، روی همان سرور اجرا کنید:

```sh
awk '{print "45.82.137.126 " $1 " " $2}' /etc/ssh/ssh_host_ed25519_key.pub
```

خروجی یک‌خطی را در secret مخزن به نام `ORACLE_SSH_HOST_KEY` بگذارید. در فایروال سرور و پنل ابرآروان، ورودی TCP پورت‌های `80` و `22` را مجاز کنید. اتصال و دسترسی به Docker را از رایانهٔ خودتان امتحان کنید:

```sh
ssh -i ~/.ssh/oracle_deploy oracle-deploy@45.82.137.126 'docker info >/dev/null && echo ready'
```

## ۲. انتشار هر نسخه

پس از ادغام PR در `main`، روی آخرین commit یک تگ یکتا بسازید و پوش کنید:

```sh
git checkout main
git pull origin main
git tag release-2026092301
git push origin release-2026092301
```

اجرای workflow را در **Actions → Deploy Oracle** ببینید. پس از موفقیت، برنامه در `http://45.82.137.126/` باز می‌شود. برای نسخهٔ بعدی تگ تازه بسازید. بررسی نسخه و لاگ روی سرور:

```sh
docker ps --filter name=oracle
docker images oracle
docker logs oracle
```

برای بازگشت به یک image موجود روی سرور، به جای `release-2026092301` تگ نسخهٔ قبلی را وارد کنید:

```sh
docker rm -f oracle
docker run -d --name oracle --restart unless-stopped -p 80:80 oracle:release-2026092301
```

دارایی‌های ثبت‌شده فقط در `localStorage` مرورگر هستند؛ تعویض image یا کانتینر داده‌ها را در مرورگر حذف نمی‌کند. سرور فعلاً دامنه و TLS ندارد و آدرس IP با HTTP سرو می‌شود؛ برای ثبت اطلاعات مالی واقعی در مرورگر، ابتدا دامنه و HTTPS راه‌اندازی کنید.
