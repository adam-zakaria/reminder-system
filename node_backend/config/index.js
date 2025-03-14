require('dotenv').config();  // Loads environment variables from .env

module.exports = {
    port: process.env.PORT || 3000,
    db: {
        host: process.env.PG_HOST,
        user: process.env.PG_USER,
        password: process.env.PG_PASSWORD,
        database: process.env.PG_DATABASE,
        dialect: process.env.PG_DIALECT || 'postgres',
        pool: {
            max: 5,
            min: 0,
            acquire: 30000,
            idle: 10000
        }
    },
    openai: {
        apiKey: process.env.OPENAI_API_KEY, // OpenAI API Key
    },
    jwt: {
        secret: process.env.JWT_SECRET || 'your_jwt_secret_key',
        expiresIn: '1h',  // You can adjust expiration settings
    }
};
