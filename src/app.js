'use strict';

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { authRouter } from './routes/auth.routes.js';
import { userRouter } from './routes/user.routes.js'
import { errorMiddleware } from './middlewares/errorMiddleware';

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: process.env.CLIENT_HOST,
  credentials: true,
}));

app.use(authRouter);
app.use(userRouter);

app.use(errorMiddleware);

app.get('/favicon.ico', (req, res) => {
  res.end();
})

app.get('/', (req, res) => {
  res.send('Hello World')
})

app.listen(3005, () => {
  console.log('Server is running')
})
