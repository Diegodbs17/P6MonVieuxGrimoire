const Joi = require("joi");

const bookSchema = Joi.object({
    title: Joi.string().min(3).max(100).required(),
    author: Joi.string().min(3).max(100).required(),
    year: Joi.number().integer().min(1000).max(new Date().getFullYear()).required(),
    genre: Joi.string().min(3).max(50).required(),
    ratings: Joi.array().items(
        Joi.object({
            userId: Joi.string().required(),
            grade: Joi.number().integer().min(0).max(5).required(),
        })
    ).optional(),
    imageUrl: Joi.string().uri().optional(),
    userId: Joi.string().optional(),
    averageRating: Joi.number().min(0).max(5).optional()
});

const ratingSchema = Joi.object({
    userId: Joi.string().required(),
    rating: Joi.number().integer().min(0).max(5).required(),
});

const validateBook = (req, res, next) => {
    const bookData = req.body.book ? JSON.parse(req.body.book) : req.body;
    console.log("Données reçues pour validation :", bookData);

    const { error } = bookSchema.validate(bookData, { abortEarly: false });

    if (error) {
        console.error("Erreurs de validation :", error.details.map(err => err.message));
        return res.status(400).json({ errors: error.details.map(err => err.message) });
    }

    next();
};

const validateRating = (req, res, next) => {
    const { error } = ratingSchema.validate(req.body, { abortEarly: false });

    if (error) {
        return res.status(400).json({ errors: error.details.map(err => err.message) });
    }

    next();
};

module.exports = { validateBook, validateRating };