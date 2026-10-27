// Local / standalone entry point. On Vercel the `smksubang-api` service loads src/app.js directly.
import app from './app.js';

const port = Number(process.env.PORT) || 4000;
app.listen(port, () => console.log(`API listening on :${port}`));
