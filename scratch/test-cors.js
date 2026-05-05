const express = require('express');
const cors = require('cors');

const app = express();

app.use(
  cors({
    origin: (origin, callback) => {
      const allowedOrigins = [
        "http://localhost:3000",
        "https://grosur.vercel.app",
      ];
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

app.use((err, req, res, next) => {
  res.status(500).json({ error: err.message });
});

app.get('/api/test', (req, res) => res.send('ok'));

app.listen(3333, () => console.log('started'));
