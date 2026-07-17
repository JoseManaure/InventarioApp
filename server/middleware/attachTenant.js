const User = require("../models/User");

const attachTenant = async (req, res, next) => {
    try {

        const user = await User.findById(req.user._id);

        if (!user.empresa) {
            return res.status(400).json({
                error: "Usuario sin empresa"
            });
        }

        req.empresaId = user.empresa;
        next();

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error tenant middleware" });
    }
};

module.exports = attachTenant;