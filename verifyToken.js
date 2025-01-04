const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    // Get token from cookies
    const token = req.cookies.token;

    // If no token is found, return an authentication error
    if (!token) {
        return res.status(401).json("You are not authenticated");
    }

    // Verify the token
    jwt.verify(token, process.env.SECRET, async (err, data) => {
        if (err) {
            console.error("Token verification failed:", err); // Log the error
            return res.status(403).json("Token is not valid");
        }

        // Attach the user data from the token payload to the request object
        req.userId = data._id;

        // Proceed to the next middleware/route handler
        next();
    });
};

module.exports = verifyToken;
