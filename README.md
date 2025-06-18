# BoostIQ Core - Backend

Este backend escanea tokens ganadores en Binance imitando la sección real de "Ganadores" y "Novedad".

### Endpoint

`GET /reales`

Devuelve tokens con:

- Subida > 3% en 15 min
- Volumen entre 100k y 1.2M USDT
- Ordenado por cambio más alto
- Actualizado cada 30s

### Deploy en Render (Gratis)

1. Subí estos archivos a GitHub
2. Entra a https://render.com
3. Crear Web Service → Node
4. Start command: `npm start`

URL final: `https://tuservicio.onrender.com/reales`

⚡ Conectalo al frontend Bolt para BoostIQ Dashboard.