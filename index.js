// index.js
const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());

const fetchMarketData = async (interval, minChange, minVolume) => {
  try {
    const { data } = await axios.get('https://api.binance.com/api/v3/ticker/24hr');
    const usdtPairs = data.filter(t => t.symbol.endsWith('USDT'));

    const tokens = usdtPairs.map(token => {
      const lastPrice = parseFloat(token.lastPrice);
      const open = parseFloat(token.openPrice);
      const percentChange = ((lastPrice - open) / open) * 100;
      const volumeUSDT = parseFloat(token.quoteVolume);
      return {
        symbol: token.symbol,
        lastPrice,
        percentChange,
        volumeUSDT,
        high: parseFloat(token.highPrice),
        low: parseFloat(token.lowPrice)
      };
    });

    return tokens
      .filter(t => t.percentChange > minChange && t.volumeUSDT > minVolume)
      .sort((a, b) => b.percentChange - a.percentChange);

  } catch (err) {
    console.error('Error al escanear Binance:', err.message);
    return [];
  }
};

app.get('/tendencia-hora', async (req, res) => {
  const result = await fetchMarketData('1h', 3, 300000);
  res.json(result);
});

app.get('/tendencia', async (req, res) => {
  const result = await fetchMarketData('24h', 10, 500000);
  res.json(result);
});

app.listen(PORT, () => {
  console.log(`BoostIQ backend activado en puerto ${PORT}`);
});
