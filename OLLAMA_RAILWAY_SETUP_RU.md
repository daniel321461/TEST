# RPG V18: домашняя Ollama через Cloudflare Access

Исходник: V17. Изменён только `app.py`. Это подготовка безопасного подключения домашней Ollama к Railway.

## Локальная проверка (Windows PowerShell)

`ollama ps` — убедитесь, что модель `qwen3:14b` использует GPU.

```powershell
$body = @{ model="qwen3:14b"; messages=@(@{role="user";content="Назови свой жанр одним предложением."}); stream=$false; reasoning_effort="none" } | ConvertTo-Json -Depth 5
(Invoke-RestMethod -Uri "http://127.0.0.1:11434/v1/chat/completions" -Method Post -ContentType "application/json" -Body $body).choices[0].message.content
```

Если флаг `reasoning_effort` вызывает ошибку, сначала уберите его и проверьте базовый API. Возможность отключения рассуждений зависит от версии Ollama.

## Постоянный Cloudflare Tunnel

Нужен свой домен, управляемый в Cloudflare. `trycloudflare.com` (Quick Tunnel) не используйте как постоянную публичную точку доступа к Ollama.

1. Cloudflare Dashboard > Networking > Tunnels > Create Tunnel, выберите Windows / cloudflared. Установите `cloudflared` как службу по показанной Cloudflare команде. Токен туннеля никому не передавайте.
2. В маршрутах туннеля: Published application > hostname `ollama.<ваш_домен>` > Service URL `http://127.0.0.1:11434`.
3. ДО раздачи адреса включите Cloudflare Zero Trust > Access > Applications > Self-hosted для этого hostname.
4. Создайте Cloudflare Access **Service Token** (Client ID и Client Secret) и **Service Auth** policy, разрешающую только этот token. Не добавляйте `Bypass`, `Everyone`, широкие `Allow`.
5. Проверьте, что неавторизованный запрос на `https://ollama.<ваш_домен>/api/tags` отклоняется Cloudflare (401/403/страница Access), а разрешённый запрос с `CF-Access-Client-Id` и `CF-Access-Client-Secret` проходит.
6. Не открывайте порт 11434 в роутере; Ollama должна слушать только `127.0.0.1`.

Документация Cloudflare: https://developers.cloudflare.com/tunnel/get-started/ и https://developers.cloudflare.com/cloudflare-one/access-controls/service-credentials/service-tokens/ .

## Railway Variables после проверки туннеля

```text
OPENAI_BASE_URL=https://ollama.<ваш_домен>/v1
OPENAI_API_KEY=ollama
OPENAI_MODEL=qwen3:14b
EXTRACT_MODEL=qwen3:14b
SUMMARY_MODEL=qwen3:14b
CF_ACCESS_CLIENT_ID=<Cloudflare Client ID>
CF_ACCESS_CLIENT_SECRET=<Cloudflare Client Secret>
LLM_MAX_CONCURRENT=1
LLM_TIMEOUT=300
SAVES_DIR=/data
```

`YANDEX_API_KEY` удалить: если она задана, V18 **всегда** выбирает Yandex, а не Ollama.

Для защиты /api/diag можно при необходимости задать `RPG_DIAG_TOKEN` (длинный случайный секрет) и отправлять его в заголовке `X-RPG-Diag-Token`. Если токен не задан, диагностика недоступна извне. Это предотвращает бесплатные неавторизованные обращения к домашней GPU через диагностический endpoint.

**Важное отличие от старых версий:** V18 использует переменную `SAVES_DIR`, а **не** `RPG_SAVES_DIR`. Если Railway Volume смонтирован по `/data`, `SAVES_DIR=/data` сохраняет файлы на томе. Перед переключением проверьте, где находятся текущие сохранения, иначе приложение не увидит старые файлы.

На Windows необходимо запретить сон ПК во время игры друзей. Сам сайт Railway будет доступен даже при выключенном ПК, но ИИ не ответит.

Отдельное предупреждение: V16/V17/V18 используют браузерный идентификатор для разделения сохранений, но не полноценную авторизацию по логину/паролю. Не путайте это с регистрацией из более старых веток приложения.
