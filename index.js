const express = require('express');
const axios = require('axios');
const app = express();

const PORT = process.env.PORT || 3000;

app.get('/reales', async (req, res) => {
    try {
        const symbolsRes = await axios.get('https://api.binance.com/api/v3/exchangeInfo');
        const symbols = symbolsRes.data.symbols
            .filter(s => s.quoteAsset === 'USDT' && s.status === 'TRADING')
            .map(s => s.symbol);

        const resultados = [];

        for (const symbol of symbols) {
            try {
                const klinesRes = await axios.get(`https://api.binance.com/api/v3/klines`, {
                    params: {
                        symbol,
                        interval: '15m',
                        limit: 2
                    }
                });

                const [prev, last] = klinesRes.data.slice(-2);

                const anteriorClose = parseFloat(prev[4]);
                const ultimoClose = parseFloat(last[4]);
                const volumen = parseFloat(last[7]);

                const cambio = ((ultimoClose - anteriorClose) / anteriorClose) * 100;

                if (cambio > 3 && volumen > 100000 && volumen < 1200000) {
                    resultados.push({
                        token: symbol,
                        price: ultimoClose.toFixed(6),
                        change15m: cambio.toFixed(2),
                        volume: volumen.toFixed(0)
                    });
                }
            } catch (e) {
                continue;
            }
        }

        resultados.sort((a, b) => parseFloat(b.change15m) - parseFloat(a.change15m));

        res.json(resultados.slice(0, 10)); // Top 10 tokens
    } catch (error) {
        res.status(500).json({ error: 'Error al procesar datos de Binance.' });
    }
});

app.listen(PORT, () => {
    console.log(`BoostIQ Core corriendo en puerto ${PORT}`);
});