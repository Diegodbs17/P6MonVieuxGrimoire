const express = require('express');
const app = express();
const mongoose = require('mongoose');

const bookRoutes = require("./routes/books")
const userRoutes = require('./routes/user');

mongoose.connect('mongodb+srv://diegs:GameHart17@cluster0.wj4zs.mongodb.net/',
    { useNewUrlParser: true,
      useUnifiedTopology: true })
    .then(() => console.log('Connexion à MongoDB réussie !'))
    .catch(() => console.log('Connexion à MongoDB échouée !'));

app.use(express.json());

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content, Accept, Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    next();
});

app.use('/api/books', bookRoutes)
app.use('/api/auth', userRoutes);

// app.post("/api/auth/signup", (req, res) => {
//     const body = req.body
//     res.send("Sign Up")
// });

// app.post("/api/auth/login", (req, res) => {
//     const body = req.body
//     res.send({
//         UserId: "123",
//         token: "token"
//     });
// });

module.exports = app;