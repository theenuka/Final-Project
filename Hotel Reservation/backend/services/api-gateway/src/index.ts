import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import cors from 'cors';
import morgan from 'morgan';
import { verifyToken, requireRole } from './middleware/auth';

const app = express();

// Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5174', // Default to common dev port
    credentials: true,
}));
app.use(morgan('dev'));
app.use(express.json());

// Apply token verification middleware to all requests
app.use(verifyToken);

// Health Check
app.get('/health', (req, res) => {
    res.status(200).send('API Gateway is healthy');
});

// Proxy Routes
// Note: These target the internal Docker network service names or localhost for local dev.
// The target host will be resolved via environment variables if needed, but defaults work for Docker Compose.

// Identity Service
app.use('/api/auth', createProxyMiddleware({
    target: process.env.IDENTITY_SERVICE_URL || 'http://identity-service:7102',
    changeOrigin: true,
}));

app.use('/api/users', requireRole(['user', 'admin', 'hotel_owner']), createProxyMiddleware({
    target: process.env.IDENTITY_SERVICE_URL || 'http://identity-service:7102',
    changeOrigin: true,
}));

// Search Service (public)
app.use('/api/facilities/search', createProxyMiddleware({
    target: process.env.SEARCH_SERVICE_URL || 'http://search-service:7105',
    changeOrigin: true,
}));

app.use('/api/hotels/search', createProxyMiddleware({
    target: process.env.SEARCH_SERVICE_URL || 'http://search-service:7105',
    changeOrigin: true,
}));

// Hotel Service (public parts)
app.use('/api/hotels', createProxyMiddleware({
    target: process.env.HOTEL_SERVICE_URL || 'http://hotel-service:7103',
    changeOrigin: true,
}));

// Protected route for hotel owners and admins
app.use('/api/my-hotels', requireRole(['admin', 'hotel_owner']), createProxyMiddleware({
    target: process.env.HOTEL_SERVICE_URL || 'http://hotel-service:7103',
    changeOrigin: true,
}));


// Booking Service (protected)
app.use('/api/bookings', requireRole(['user', 'admin', 'hotel_owner']), createProxyMiddleware({
    target: process.env.BOOKING_SERVICE_URL || 'http://booking-service:7104',
    changeOrigin: true,
}));


const PORT = process.env.PORT || 7008;

app.listen(PORT, () => {
    console.log(`API Gateway running on port ${PORT}`);
});
