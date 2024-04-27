'use strict';

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { authRouter } from './src/routes/auth.routes';
import { userRouter } from './src/routes/user.routes'
import { errorMiddleware } from './src/middlewares/errorMiddleware';

const PORT = process.env.SERVER_PORT || 3002;
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

app.listen(PORT, () => {
  console.log('Server is running')
})
