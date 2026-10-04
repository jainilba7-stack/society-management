require('dotenv').config();
const app = require('./src/app');
const connectDB = require('./src/config/db');

const PORT = process.env.PORT || 5000;

// Connect to MongoDB Atlas and start server
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`🏢 Society Management System Backend API Running`);
    console.log(`🌐 URL: http://localhost:${PORT}`);
    console.log(`====================================================`);
  });
});
