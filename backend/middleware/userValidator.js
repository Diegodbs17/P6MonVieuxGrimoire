const Joi = require("joi");

// Schéma de validation pour l'inscription
const signupSchema = Joi.object({
    email: Joi.string().email().required().messages({
        "string.email": "L'email doit être valide.",
        "any.required": "L'email est obligatoire."
    }),
    password: Joi.string().min(1).max(30).required().messages({
        "string.min": "Le mot de passe doit contenir au moins 8 caractères.",
        "string.max": "Le mot de passe ne doit pas dépasser 30 caractères.",
        "any.required": "Le mot de passe est obligatoire."
    })
});

// Schéma de validation pour la connexion
const loginSchema = Joi.object({
    email: Joi.string().email().required().messages({
        "string.email": "L'email doit être valide.",
        "any.required": "L'email est obligatoire."
    }),
    password: Joi.string().required().messages({
        "any.required": "Le mot de passe est obligatoire."
    })
});

// Middleware générique de validation
const validateSignup = (req, res, next) => {
    console.log("Données reçues pour validation :", req.body); // 🔍 Vérifie si req.body est bien reçu

    const { error } = signupSchema.validate(req.body, { abortEarly: false });

    if (error) {
        console.error("Erreurs de validation :", error.details.map(err => err.message));
        return res.status(400).json({ errors: error.details.map(err => err.message) });
    }

    next();
};


const validateLogin = (req, res, next) => {
    console.log("Données reçues pour login :", req.body); // 🔍 Affiche les données envoyées

    const { error } = loginSchema.validate(req.body, { abortEarly: false });

    if (error) {
        console.error("Erreurs de validation :", error.details.map(err => err.message));
        return res.status(400).json({ errors: error.details.map(err => err.message) });
    }

    next();
};


module.exports = { validateSignup, validateLogin };