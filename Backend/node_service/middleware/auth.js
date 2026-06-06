import jwt from 'jsonwebtoken';

const SECRET_KEY = "qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM0987654321";

export function authenticateToken(req, res, next) {
  const token = req.headers['token'] || req.headers['Token'];

  if (!token) {
    return res.status(401).json({ code: 401, message: 'Authentication token is missing' });
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    req.user = {
      email: decoded.username, // Spring Boot sets 'username' as the email
      role: decoded.role
    };
    next();
  } catch (err) {
    return res.status(403).json({ code: 403, message: 'Token is invalid or expired' });
  }
}
