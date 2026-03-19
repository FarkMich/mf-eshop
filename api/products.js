export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  const response = await fetch(
    `${process.env.SUPABASE_URL}/rest/v1/products?select=*&order=created_at.asc`,
    {
      headers: {
        'apikey': process.env.SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      }
    }
  );

  const data = await response.json();

  if (!response.ok) {
    return res.status(500).json({ error: 'Failed to fetch products' });
  }

  res.status(200).json(data);
}
