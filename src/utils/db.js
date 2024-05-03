import { Sequelize } from "sequelize";
import 'dotenv/config';

export const client = new Sequelize(process.env.DB_URL, {
  dialect: 'postgres',
  dialectOptions: {
    ssl: {
      rejectUnauthorized: false
    }
  },
  logging: false,
  migrations: [],
  subscribers: [],
});