module.exports = (req, res, next) => {
    if (!req.user.empresa) {
        return res.status(403).json({
            error: "Este módulo requiere empresa"
        });
    }
    next();
};