# PeaceLife Home Assistant

This folder contains a minimal Home Assistant Docker Compose setup.

## Start

Install Docker Desktop first, then run:

```powershell
cd E:\Project\Ohters\PeaceLife\home-assistant
docker compose up -d
```

Open:

```text
http://localhost:8123
```

After creating your Home Assistant account, create a Long-Lived Access Token:

```text
Profile -> Security -> Long-Lived Access Tokens
```

Paste the Home Assistant URL and token into the PeaceLife device panel.

## PeaceLife Defaults

Use this Home Assistant URL on the same computer:

```text
http://localhost:8123
```

For iPad access from the same LAN, use:

```text
http://你的电脑局域网IP:8123
```

## Notes

Midea/MSmartHome air conditioners usually need a Home Assistant integration or a fallback IR blaster. After the AC appears in Home Assistant, copy its entity id, for example:

```text
climate.bedroom_ac
```
