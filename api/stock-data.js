// Vercel Serverless Function for Tiingo Historical Data
// Finnhub works directly from browser, this handles Tiingo to avoid CORS

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
    const { symbol, startDate, endDate } = req.query;

    if (!symbol) {
      return res.status(400).json({ error: 'Symbol is required' });
    }

    // Get Tiingo API key from environment variable
    const TIINGO_API_KEY = process.env.TIINGO_API_KEY;

    if (!TIINGO_API_KEY) {
      return res.status(500).json({ error: 'Tiingo API key not configured' });
    }

    // Default to last 3 months if dates not provided
    const end = endDate || new Date().toISOString().split('T')[0];
    const start = startDate || new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Build Tiingo API URL
    const apiUrl = `https://api.tiingo.com/tiingo/daily/${symbol}/prices?startDate=${start}&endDate=${end}&token=${TIINGO_API_KEY}`;

    // Fetch historical data from Tiingo
    const response = await fetch(apiUrl);

    if (!response.ok) {
      throw new Error(`Tiingo API responded with status: ${response.status}`);
    }

    const data = await response.json();

    // Return the data
    return res.status(200).json(data);

  } catch (error) {
    console.error('Error fetching Tiingo historical data:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch historical data',
      message: error.message 
    });
  }
}
