// index.js
const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());

const BASE_URL = "https://api.binance.com";

// Fórmula: ((últimoClose - anteriorClose) / anteriorClose) * 100
function calculateChangePercentage(current, previous) {
  return ((current - previous) / previous) * 100;
}

async function getWinners() {
  try {
    const exchangeInfo = await axios.get(`${BASE_URL}/api/v3/exchangeInfo`);
    const usdtPairs = exchangeInfo.data.symbols.filter(
      (s) => s.symbol.endsWith("USDT") && s.status === "TRADING"
    );

    const result = [];
    const klinesPromises = usdtPairs.map(async (pair) => {
      try {
        const response = await axios.get(`${BASE_URL}/api/v3/klines`, {
          params: {
            symbol: pair.symbol,
            interval: "1h",
            limit: 2,
          },
        });

        const [prevCandle, lastCandle] = response.data;
        const [,, , , closePrev] = prevCandle;
        const [,, , , closeLast, volume] = lastCandle;

        const change = calculateChangePercentage(parseFloat(closeLast), parseFloat(closePrev));

        if (change > 3 && parseFloat(volume) > 300000) {
          result.push({
            symbol: pair.symbol,
            price: parseFloat(closeLast),
            change: `${change.toFixed(2)}%`,
            volume: parseFloat(volume),
            high: parseFloat(lastCandle[2]),
            low: parseFloat(lastCandle[3]),
          });
        }
      } catch (err) {
        // ignorar errores por tokens individuales
      }
    });

    await Promise.all(klinesPromises);

    result.sort((a, b) => parseFloat(b.change) - parseFloat(a.change));
    return result.slice(0, 15);
  } catch (error) {
    console.error("Error fetching winners:", error);
    return [];
  }
}

app.get("/ganadores", async (req, res) => {
  const winners = await getWinners();
  res.json(winners);
});

app.listen(PORT, () => {
  console.log(`BoostIQ backend activo en puerto ${PORT}`);
});
