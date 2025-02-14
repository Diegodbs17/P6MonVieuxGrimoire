const Book = require('../models/book');
const fs = require('fs').promises;
const sharp = require('sharp');
const path = require('path');
sharp.cache(false);

exports.createBook = async (req, res, next) => {
    try {
        const bookObject = JSON.parse(req.body.book);
        delete bookObject._id;
        delete bookObject._userId;

        if (!req.file) {
            return res.status(400).json({ message: "Image requise" });
        }

        console.log('Fichier reçu pour optimisation:', req.file);

        const originalFilePath = req.file.path;
        const optimizedFilename = `${Date.now()}-optimized.webp`;
        const optimizedFilePath = path.join('images', optimizedFilename);

        await sharp(originalFilePath)
            .webp({ quality: 80 })
            .toFile(optimizedFilePath);

        console.log('Image optimisée enregistrée:', optimizedFilePath);

        try {
            await fs.unlink(originalFilePath);
            console.log('Image d\'origine supprimée avec succès');
        } catch (err) {
            console.error('Erreur lors de la suppression de l\'image d\'origine:', err);
        }

        const book = new Book({
            ...bookObject,
            userId: req.auth.userId,
            imageUrl: `${req.protocol}://${req.get('host')}/images/${optimizedFilename}`
        });

        await book.save();
        console.log('Livre enregistré avec image optimisée !');
        res.status(201).json({ message: 'Livre enregistré avec image optimisée !' });

    } catch (error) {
        console.error('Erreur lors de la création du livre:', error);
        res.status(500).json({ error: "Erreur lors de la création du livre", details: error });
    }
};

exports.ratingBook = async (req, res, next) => {
    const { userId, rating } = req.body;

    if (!userId || rating === undefined || rating < 0 || rating > 5) {
        return res.status(400).json({ message: "Note invalide (doit être entre 0 et 5)" });
    }

    try {
        const book = await Book.findOne({ _id: req.params.id });

        if (!book) {
            return res.status(404).json({ message: "Livre non trouvé" });
        }

        const alreadyRated = book.ratings.find(r => r.userId === userId);
        if (alreadyRated) {
            return res.status(400).json({ message: "Vous avez déjà noté ce livre" });
        }

        book.ratings.push({ userId, grade: rating });

        const totalRatings = book.ratings.length;
        const sumRatings = book.ratings.reduce((sum, r) => sum + r.grade, 0);
        book.averageRating = Math.round((sumRatings / totalRatings) * 10) / 10;

        const updatedBook = await book.save();
        return res.status(200).json(updatedBook);

    } catch (error) {
        console.error('Erreur serveur:', error);
        return res.status(500).json({ message: "Erreur serveur", error });
    }
};

exports.getOneBook = (req, res, next) => {
    Book.findOne({ _id: req.params.id })
    .then(book => res.status(200).json(book))
    .catch(error => res.status(404).json({ error }));
};

exports.getAllBook = (req, res, next) => {
    Book.find()
    .then(books => res.status(200).json(books))
    .catch(error => res.status(400).json({ error }));
};

exports.getBestRating = (req, res, next) => {
    Book.find().sort({ ratings: -1 }).limit(3)
    .then(books => res.status(200).json(books))
    .catch(error => res.status(400).json({ error }));
};

exports.modifyBook = async (req, res, next) => {
    try {
        const bookObject = req.file ? { ...JSON.parse(req.body.book) } : { ...req.body };
        delete bookObject._userId;

        const book = await Book.findOne({ _id: req.params.id });

        if (!book) {
            return res.status(404).json({ message: 'Livre non trouvé' });
        }

        if (book.userId != req.auth.userId) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        if (req.file) {
            const filename = `${Date.now()}-optimized.webp`;
            const outputPath = path.join('images', filename);

            await sharp(req.file.path)
                .webp({ quality: 80 })
                .toFile(outputPath);

            await fs.unlink(req.file.path);

            if (book.imageUrl) {
                const oldFilename = book.imageUrl.split('/images/')[1];
                await fs.unlink(`images/${oldFilename}`);
            }

            bookObject.imageUrl = `${req.protocol}://${req.get('host')}/images/${filename}`;
        }

        await Book.updateOne({ _id: req.params.id }, { ...bookObject, _id: req.params.id });
        res.status(200).json({ message: 'Livre modifié avec image optimisée !' });
    } catch (error) {
        console.error('Erreur lors de la modification du livre:', error);
        res.status(400).json({ error: "Erreur lors de la modification du livre", details: error });
    }
};

exports.deleteBook = async (req, res, next) => {
    try {
        const book = await Book.findOne({ _id: req.params.id });

        if (!book) {
            return res.status(404).json({ message: 'Livre non trouvé' });
        }

        if (book.userId != req.auth.userId) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        const filename = book.imageUrl.split('/images/')[1];
        await fs.unlink(`images/${filename}`);

        await Book.deleteOne({ _id: req.params.id });

        res.status(200).json({ message: 'Livre supprimé !' });
    } catch (error) {
        console.error('Erreur lors de la suppression du livre:', error);
        res.status(500).json({ error: 'Erreur serveur lors de la suppression du livre', details: error });
    }
};