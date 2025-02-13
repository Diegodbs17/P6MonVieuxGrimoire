const Book = require('../models/book');
const fs = require('fs');
const sharp = require('sharp');
const path = require('path');

exports.createBook = (req, res, next) => {
    const bookObject = JSON.parse(req.body.book);
    delete bookObject._id;
    delete bookObject._userId;

    if (!req.file) {
        return res.status(400).json({ message: "Image requise" });
    }

    console.log('Fichier reçu pour optimisation:', req.file);

    const originalFilePath = req.file.path; // Chemin de l'image d'origine
    const optimizedFilename = `${Date.now()}-optimized.webp`; // Nom du fichier optimisé
    const optimizedFilePath = path.join('images', optimizedFilename); // Chemin où l'image optimisée sera sauvegardée

    // Optimisation de l'image avec Sharp, en utilisant le fichier stocké en diskStorage
    sharp(originalFilePath)
        .resize(500, 500, { fit: 'inside' }) // Redimensionner à max 500x500 sans déformer
        .webp({ quality: 80 }) // Convertir en WebP avec qualité 80
        .toFile(optimizedFilePath)  // Enregistrer l'image optimisée sur le disque
        .then(() => {
            // Une fois l'image optimisée créée, nous pouvons procéder à la sauvegarde du livre
            fs.unlink(originalFilePath, (err) => {
                if (err) {
                    console.error('Erreur lors de la suppression de l\'image d\'origine:', err);
                } else {
                    console.log('Image d\'origine supprimée avec succès');
                }
            });

            const book = new Book({
                ...bookObject,
                userId: req.auth.userId,
                imageUrl: `${req.protocol}://${req.get('host')}/images/${optimizedFilename}`
            });

            // Sauvegarde du livre dans la base de données
            book.save()
                .then(() => {
                    console.log('Livre enregistré avec image optimisée !');
                    res.status(201).json({ message: 'Livre enregistré avec image optimisée !' });
                })
                .catch(error => {
                    console.error('Erreur lors de l\'enregistrement du livre:', error);
                    res.status(400).json({ error });
                });
        })
        .catch(error => {
            console.error('Erreur lors de l\'optimisation de l\'image:', error);
            res.status(500).json({ error: "Erreur lors de l'optimisation de l'image", details: error });
        });
};

exports.ratingBook = (req, res, next) => {
    const { userId, rating } = req.body;

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
    const bookObject = req.file ? { ...JSON.parse(req.body.book) } : { ...req.body };

    delete bookObject._userId;

    Book.findOne({ _id: req.params.id })
        .then(book => {
            if (book.userId != req.auth.userId) {
                return res.status(401).json({ message: 'Not authorized' });
            }

            if (req.file) {
                const filename = `${Date.now()}-optimized.webp`;
                const outputPath = path.join('images', filename);

                sharp(req.file.path)
                    .resize(500, 500, { fit: 'inside' })
                    .webp({ quality: 80 })
                    .toFile(outputPath)
                    .then(() => {
                        fs.unlink(req.file.path, () => {
                            if (book.imageUrl) {
                                const oldFilename = book.imageUrl.split('/images/')[1];
                                fs.unlink(`images/${oldFilename}`, () => {});
                            }

                            bookObject.imageUrl = `${req.protocol}://${req.get('host')}/images/${filename}`;

                            Book.updateOne({ _id: req.params.id }, { ...bookObject, _id: req.params.id })
                                .then(() => res.status(200).json({ message: 'Livre modifié avec image optimisée !' }))
                                .catch(error => res.status(400).json({ error }));
                        });
                    })
                    .catch(error => res.status(500).json({ message: "Erreur lors de l'optimisation de l'image", error }));
            } else {
                Book.updateOne({ _id: req.params.id }, { ...bookObject, _id: req.params.id })
                    .then(() => res.status(200).json({ message: 'Livre modifié !' }))
                    .catch(error => res.status(400).json({ error }));
            }
        })
        .catch(error => res.status(400).json({ error }));
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
                        .then(() => { res.status(200).json({message: 'Livre supprimé !'})})
                        .catch(error => res.status(401).json({ error }));
                });
            }
        })
        .catch( error => {
            res.status(500).json({ error });
        });
};