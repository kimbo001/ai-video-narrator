// server/index.ts
import paddleWebhook from './routes/paddleWebhook';
app.use('/api/paddle-webhook', paddleWebhook); // MUST be raw
app.use(express.json()); // other routes after
