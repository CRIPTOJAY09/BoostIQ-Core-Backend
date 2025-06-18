const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 10000;
const BASE_URL = 'https://api.binance.com';

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'BoostIQ Backend funcionando correctamente',
    timestamp: new Date().toISOString()
  });
});

async function fetchTokens(interval) {
  try {
    console.log('Obteniendo información de tokens...');
    const { data } = await axios.get(`${BASE_URL}/api/v3/exchangeInfo`);
    const usdtPairs = data.symbols.filter(s => s.quoteAsset === 'USDT' && s.status === 'TRADING');
    
    console.log(`Procesando ${usdtPairs.length} pares USDT...`);
    
    const tokens = await Promise.all(
      usdtPairs.map(async pair => {
        try {
          const { data } = await axios.get(`${BASE_URL}/api/v3/klines`, {
            params: {
              symbol: pair.symbol,
              interval,
              limit: 2
            }
          });
          
          const [prev, curr] = data;
          const anteriorClose = parseFloat(prev[4]);
          const ultimoClose = parseFloat(curr[4]);
          const cambio = ((ultimoClose - anteriorClose) / anteriorClose) * 100;
          const volumen = parseFloat(curr[7]);
          const high = parseFloat(curr[2]);
          const low = parseFloat(curr[3]);
          
          return {
            simbolo: pair.symbol,
            precio: ultimoClose,
            cambio: Number(cambio.toFixed(2)),
            volumen,
            high,
            low
          };
        } catch (error) {
          console.error(`Error procesando ${pair.symbol}:`, error.message);
          return null;
        }
      })
    );
    
    const validTokens = tokens.filter(Boolean);
    console.log(`Tokens procesados exitosamente: ${validTokens.length}`);
    return validTokens;
    
  } catch (err) {
    console.error('Error al escanear Binance:', err.message);
    return [];
  }
}

app.get('/tendencia', async (req, res) => {
  try {
    console.log('Endpoint /tendencia solicitado');
    const tokens = await fetchTokens('1h');
    const ganadores = tokens
      .filter(t => t.cambio > 10 && t.volumen > 500000)
      .sort((a, b) => b.cambio - a.cambio)
      .slice(0, 10);
    
    console.log(`Encontrados ${ganadores.length} tokens ganadores`);
    res.json(ganadores);
  } catch (error) {
    console.error('Error en /tendencia:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.get('/tendencia-hora', async (req, res) => {
  try {
    console.log('Endpoint /tendencia-hora solicitado');
    const tokens = await fetchTokens('1h');
    const ganadores = tokens
      .filter(t => t.cambio > 3 && t.volumen > 300000)
      .sort((a, b) => b.cambio - a.cambio)
      .slice(0, 10);
    
    console.log(`Encontrados ${ganadores.length} tokens con tendencia por hora`);
    res.json(ganadores);
  } catch (error) {
    console.error('Error en /tendencia-hora:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error no manejado:', err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Backend activo en puerto ${PORT}`);
  console.log(`🌐 Health check disponible en: http://localhost:${PORT}/`);
});
