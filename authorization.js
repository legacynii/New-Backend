const jwt = require('jsonwebtoken');
const ACCESS_TOKEN_SECRET = '123HGFDDFF87653WREFDVKJHGSDF987653WRE';
const REFRESH_TOKEN_SECRET = 'dsfdghg98764354jkhgfdsfghyygygt567kjhbvdfg';

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (token == null) {
    console.error("Null token");
    return res.status(401).json({ error: 'null token' });
  }

  jwt.verify(token, ACCESS_TOKEN_SECRET, (error, user) => {
    if (error) {
      console.error(error.message);
      return res.status(403).json({ error: error.message });
    }
    req.user = user;
    next();
  });
}

module.exports = { authenticateToken };
