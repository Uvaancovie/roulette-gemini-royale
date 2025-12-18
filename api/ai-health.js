import mongoose from 'mongoose';
import dbConnect from './_lib/dbConnect.js';
import { setCorsHeaders, handleOptions } from './_lib/cors.js';

export default async function handler(req, res) {
  setCorsHeaders(res);
  if (handleOptions(req, res)) return;

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await dbConnect();
    
    res.json({
      apiKeyAvailable: !!process.env.VITE_GEMINI_API_KEY,
      mongooseConnected: mongoose.connection.readyState === 1
    });
  } catch (error) {
    res.json({
      apiKeyAvailable: !!process.env.VITE_GEMINI_API_KEY,
      mongooseConnected: false,
      error: error.message
    });
  }
}
