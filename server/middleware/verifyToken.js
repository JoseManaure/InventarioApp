const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET;

function verifyToken(req, res, next) {

  console.log("---------------------");
  console.log("Authorization:");
  console.log(req.headers.authorization);

  const bearer = req.headers.authorization;

  const token = bearer?.startsWith("Bearer ")
    ? bearer.split(" ")[1]
    : bearer;

  console.log("TOKEN:");
  console.log(token);

  if (!token) {
    console.log("NO HAY TOKEN");
    return res.status(401).json({
      error: "Token requerido"
    });
  }

  try {

    const decoded = jwt.verify(token, JWT_SECRET);

    console.log("JWT DECODIFICADO");
    console.log(decoded);

    req.user = decoded;

    next();

  } catch (err) {

    console.log("ERROR JWT");
    console.log(err);

    return res.status(401).json({
      error: "Token inválido"
    });

  }

}

module.exports = verifyToken;