import jwt from 'jsonwebtoken';
import User from './models/User.js';
import dbConnect from './dbConnect.js';

/**
 * Authentication middleware for Vercel serverless functions
 * Returns user object if authenticated, or sends error response
 */
export async function requireAuth(req, res) {
  await dbConnect();

  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    res.status(401).json({ error: "Authentication required" });
    return null;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      res.status(401).json({ error: "User not found" });
      return null;
    }
    
    return user;
  } catch (error) {
    res.status(401).json({ error: "Invalid token" });
    return null;
  }
}
