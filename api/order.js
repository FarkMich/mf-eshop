export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const {
    customer_name,
    customer_email,
    product_id,
    quantity,
    total,
    shipping_name,
    shipping_address,
    shipping_city,
    shipping_zip,
    payment_method
  } = req.body;

  // Validate required fields
  if (!customer_name || !customer_email || !product_id || !shipping_address || !shipping_city || !shipping_zip) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Check stock first
  const stockRes = await fetch(
    `${process.env.SUPABASE_URL}/rest/v1/products?id=eq.${product_id}&select=stock,name,price`,
    {
      headers: {
        'apikey': process.env.SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY}`,
      }
    }
  );

  const stockData = await stockRes.json();

  if (!stockData || stockData.length === 0) {
    return res.status(404).json({ error: 'Product not found' });
  }

  const product = stockData[0];

  if (product.stock < quantity) {
    return res.status(400).json({ error: 'Insufficient stock', available: product.stock });
  }

  // Create order
  const orderRes = await fetch(
    `${process.env.SUPABASE_URL}/rest/v1/orders`,
    {
      method: 'POST',
      headers: {
        'apikey': process.env.SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
      },
      body: JSON.stringify({
        customer_name,
        customer_email,
        product_id,
        quantity: parseInt(quantity) || 1,
        total: parseInt(total),
        shipping_name: shipping_name || customer_name,
        shipping_address,
        shipping_city,
        shipping_zip,
        payment_method: payment_method || 'card',
        status: payment_method === 'cod' ? 'pending_cod' : 'pending_payment',
      })
    }
  );

  const order = await orderRes.json();

  if (!orderRes.ok) {
    return res.status(500).json({ error: 'Failed to create order' });
  }

  // Decrease stock
  await fetch(
    `${process.env.SUPABASE_URL}/rest/v1/products?id=eq.${product_id}`,
    {
      method: 'PATCH',
      headers: {
        'apikey': process.env.SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ stock: product.stock - (parseInt(quantity) || 1) })
    }
  );

  res.status(201).json({
    success: true,
    order_id: order[0]?.id,
    payment_method,
    message: payment_method === 'cod'
      ? 'Order confirmed. You will pay on delivery.'
      : 'Order confirmed. Proceed to payment.'
  });
}
