import request from 'supertest';
import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import cors from 'cors';
import morgan from 'morgan';

// Mock the console to prevent logs from cluttering test output
const app = express();
app.get('/health', (req, res) => {
    res.status(200).send('API Gateway is healthy');
});

describe('API Gateway', () => {
    it('should return 200 and a health message from the /health endpoint', async () => {
        const response = await request(app).get('/health');
        expect(response.status).toBe(200);
        expect(response.text).toBe('API Gateway is healthy');
    });
});
