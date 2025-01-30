const express = require('express');

const app = express();

const mongoose = require('mongoose');

app.use(express.json());

mongoose.connect('mongodb+srv://diegs:GameHart17@cluster0.wj4zs.mongodb.net/',
    { useNewUrlParser: true,
      useUnifiedTopology: true })
    .then(() => console.log('Connexion à MongoDB réussie !'))
    .catch(() => console.log('Connexion à MongoDB échouée !'));

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content, Accept, Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    next();
});

app.post('/api/books', (req, res, next) => {
    console.log(req.body);
    res.status(201).json({
      message: 'Livre crée'
    });
});

app.get('/api/books', (req, res, next) => {
    const books = [
        {
            "id": "1",
            "userId" : "clc4wj5lh3gyi0ak4eq4n8syr",
            "title" : "Milwaukee Mission",
            "author": "Elder Cooper",
            "imageUrl" : "https://placehold.co/206x260",
            "year" : 2021,
            "genre" : "Policier",
            "ratings" : [{
              "userId" : "1",
              "grade": 5
            },
              {
                "userId" : "1",
                "grade": 5
              },
              {
                "userId" : "clc4wj5lh3gyi0ak4eq4n8syr",
                "grade": 5
              },
              {
                "userId" : "1",
                "grade": 5
              }],
            "averageRating": 3
        },
        {
            "id": "2",
            "userId" : "clbxs3tag6jkr0biul4trzbrv",
            "title" : "Book for Esther",
            "author": "Alabaster",
            "imageUrl" : "https://placehold.co/206x260",
            "year" : 2022,
            "genre" : "Paysage",
            "ratings" : [{
              "userId" : "clbxs3tag6jkr0biul4trzbrv",
              "grade": 4
            },
              {
                "userId" : "1",
                "grade": 5
              },
              {
                "userId" : "1",
                "grade": 5
              },
              {
                "userId" : "1",
                "grade": 5
              }],
            "averageRating": 4.2
        },
    ];
    res.status(200).json(books);
});

module.exports = app;