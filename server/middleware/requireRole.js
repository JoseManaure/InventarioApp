module.exports = (...rolesPermitidos) => {

    return (req, res, next) => {

        if (!req.user) {
            return res.status(401).json({
                error: "No autenticado"
            });
        }

        if (!rolesPermitidos.includes(req.user.role)) {
            return res.status(403).json({
                error: "No tienes permisos"
            });
        }

        next();
    };
};