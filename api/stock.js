export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  const { id } = req.query;

  if (!id) return res.status(400).json({ error: 'Product ID required' });

  const response = await fetch(
    `${process.env.SUPABASE_URL}/rest/v1/products?id=eq.${id}&select=id,stock,name`,
    {
      headers: {
        'apikey': process.env.SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY}`,
      }
    }
  );

  const data = await response.json();

  if (!data || data.length === 0) {
    return res.status(404).json({ error: 'Product not found' });
  }

  res.status(200).json({ stock: data[0].stock, name: data[0].name });
}
