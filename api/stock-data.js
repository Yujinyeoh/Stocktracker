// Vercel Serverless Function for Stock Data
// Handles both Finnhub (quotes/profile) and Tiingo (historical) to keep API keys secure

export default async function handler(req, res) {
  // Enable CORS for your frontend
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { symbol, type, startDate, endDate } = req.query;

    if (!symbol) {
      return res.status(400).json({ error: 'Symbol is required' });
    }

    // Get API keys from environment variables (secure!)
    const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;
    const TIINGO_API_KEY = process.env.TIINGO_API_KEY;

    // Route to appropriate API based on 'type' parameter
    let apiUrl;

    switch (type) {
      case 'quote':
        // Finnhub: Real-time quote
        if (!FINNHUB_API_KEY) {
          return res.status(500).json({ error: 'Finnhub API key not configured' });
        }
        apiUrl = `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB_API_KEY}`;
        break;

      case 'profile':
        // Finnhub: Company profile
        if (!FINNHUB_API_KEY) {
          return res.status(500).json({ error: 'Finnhub API key not configured' });
        }
        apiUrl = `https://finnhub.io/api/v1/stock/profile2?symbol=${symbol}&token=${FINNHUB_API_KEY}`;
        break;

      case 'history':
        // Tiingo: Historical data
        if (!TIINGO_API_KEY) {
          return res.status(500).json({ error: 'Tiingo API key not configured' });
        }
        const end = endDate || new Date().toISOString().split('T')[0];
        const start = startDate || new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        apiUrl = `https://api.tiingo.com/tiingo/daily/${symbol}/prices?startDate=${start}&endDate=${end}&token=${TIINGO_API_KEY}`;
        break;

      default:
        return res.status(400).json({ error: 'Invalid type. Use: quote, profile, or history' });
    }

    // Fetch data from the appropriate API
    const response = await fetch(apiUrl);

    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`);
    }

    const data = await response.json();

    // Return the data
    return res.status(200).json(data);

  } catch (error) {
    console.error('Error fetching stock data:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch stock data',
      message: error.message 
    });
  }
}
