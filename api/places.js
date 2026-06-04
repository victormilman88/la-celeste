export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  
  const { input, place_id, origins, destinations } = req.query;
  const KEY = process.env.GOOGLE_MAPS_KEY;

  try {
    if (place_id) {
      // Geocode by place_id
      const url = `https://maps.googleapis.com/maps/api/geocode/json?place_id=${place_id}&key=${KEY}`;
      const r = await fetch(url);
      const data = await r.json();
      res.json(data);
    } else if (origins && destinations) {
      // Distance Matrix - real road distance
      const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(origins)}&destinations=${encodeURIComponent(destinations)}&mode=driving&key=${KEY}`;
      const r = await fetch(url);
      const data = await r.json();
      res.json(data);
    } else if (input) {
      // Autocomplete
      const encoded = encodeURIComponent(input + ' Pelotas RS Brasil');
      const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encoded}&components=country:br&types=address&key=${KEY}`;
      const r = await fetch(url);
      const data = await r.json();
      res.json(data);
    } else {
      res.status(400).json({ error: 'Missing parameters' });
    }
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
}
