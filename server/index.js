// server/index.js
import express from 'express';
import dotenv from 'dotenv';
import routes from './routes/index.js';

// load .env (contains DATABASE_URL, PADDLE_* keys, etc.)
dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

/*  health-check  */
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

/*  api routes  */
app.use('/api', routes);

/*  catch-all 404  */
app.use((_req, res) => res.status(404).json({ message: 'Not found' }));

/*  central error handler  */
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ message: 'Internal server error' });
});

app.listen(PORT, () =>
  console.log(`Webhook server listening on http://localhost:${PORT}`)
);
