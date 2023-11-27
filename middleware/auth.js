const jwt = require("jsonwebtoken");
function auth(req, res, next) {
  try {
    const token = req.header("x-auth-token");
    if (!token) {
      return res.status(401).send("no token provided");
    }
    const decoded_token = jwt.verify(token, process.env.FITX_SECRET_KEY);
    req.user = decoded_token;
      next();    
  } catch (error) {
    res.status(400).send({error: error.message});
  }
}

module.exports = auth;
