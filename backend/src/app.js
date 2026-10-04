const express = require('express');
const cors = require('cors');
const path = require('path');
const errorHandler = require('./middlewares/errorHandler');

// Route Imports
const authRoutes = require('./routes/authRoutes');
const blockRoutes = require('./routes/blockRoutes');
const flatRoutes = require('./routes/flatRoutes');
const residentRoutes = require('./routes/residentRoutes');
const maintenanceRoutes = require('./routes/maintenanceRoutes');
const electricityRoutes = require('./routes/electricityRoutes');
const announcementRoutes = require('./routes/announcementRoutes');
const complaintRoutes = require('./routes/complaintRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const reportRoutes = require('./routes/reportRoutes');
const activityLogRoutes = require('./routes/activityLogRoutes');

const app = express();

// Enable CORS & Body Parsing
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Mount Static Frontend Directory
const frontendPath = path.join(__dirname, '../../frontend');
app.use(express.static(frontendPath));

// API Endpoint Routes
app.use('/api/auth', authRoutes);
app.use('/api/blocks', blockRoutes);
app.use('/api/flats', flatRoutes);
app.use('/api/residents', residentRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/electricity', electricityRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/activity-logs', activityLogRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Society Management System API is running smoothly' });
});

// Fallback route for SPA / HTML navigation
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// Error Handling Middleware
app.use(errorHandler);

module.exports = app;
