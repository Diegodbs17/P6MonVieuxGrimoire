const Book = require('../models/book');
const fs = require('fs');

exports.createBook = (req, res, next) => {
    const bookObject = JSON.parse(req.body.book);
    delete bookObject._id;
    delete bookObject._userId;
    const book = new Book({
        ...bookObject,
        userId: req.auth.userId,
        imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
    });
  
    book.save()
    .then(() => { res.status(201).json({message: 'Livre enregistré !'})})
    .catch(error => { res.status(400).json( { error })})
};

exports.ratingBook = (req, res, next) => {
    const { userId, rating } = req.body; // On récupère l'ID de l'utilisateur et la note envoyée

    if (!userId || !rating || rating < 0 || rating > 5) {
        return res.status(400).json({ message: "Note invalide (doit être entre 0 et 5)" });
    }

    Book.findOne({ _id: req.params.id })
        .then(book => {
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
            book.averageRating = sumRatings / totalRatings;

            return book.save()
                .then(updatedBook => res.status(200).json(updatedBook))
                .catch(error => res.status(500).json({ message: "Erreur lors de l'enregistrement", error }));
        })
        .catch(error => res.status(500).json({ message: "Erreur serveur", error }));
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

exports.modifyBook = (req, res, next) => {
    const bookObject = req.file ? {
        ...JSON.parse(req.body.thing),
        imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
    } : { ...req.body };
  
    delete bookObject._userId;
    Book.findOne({_id: req.params.id})
        .then((book) => {
            if (book.userId != req.auth.userId) {
                res.status(401).json({ message : 'Not authorized'});
            } else {
                Book.updateOne({ _id: req.params.id}, { ...bookObject, _id: req.params.id})
                .then(() => res.status(200).json({message : 'Objet modifié!'}))
                .catch(error => res.status(401).json({ error }));
            }
        })
        .catch((error) => {
            res.status(400).json({ error });
        });
};

exports.deleteBook = (req, res, next) => {
    Book.findOne({ _id: req.params.id})
        .then(book => {
            if (book.userId != req.auth.userId) {
                res.status(401).json({message: 'Not authorized'});
            } else {
                const filename = book.imageUrl.split('/images/')[1];
                fs.unlink(`images/${filename}`, () => {
                    Book.deleteOne({_id: req.params.id})
                        .then(() => { res.status(200).json({message: 'Objet supprimé !'})})
                        .catch(error => res.status(401).json({ error }));
                });
            }
        })
        .catch( error => {
            res.status(500).json({ error });
        });
};