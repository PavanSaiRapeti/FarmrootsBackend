const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    userId: {
        type: Number,
        unique: true
    },
    first: {
        type: String,
    },
    last: {
        type: String,
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    }
});

const counterSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    value: {
        type: Number,
        default: 0
    }
});

const ingredientSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    quantity: {
        type: Number,
        required: true
    }
}, {
    timestamps: true
});
const recipeSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    categories: {
        type: Map,
        of: [String]
    },
    ingredients: [{
        type: String,
        required: true
    }],
    instructions: [{
        type: String,
        required: true
    }],
    nutrition: {
        calories: {
            type: Number,
            required: true
        },
        protein: {
            type: String,
            required: true
        },
        carbohydrates: {
            type: String,
            required: true
        },
        fat: {
            type: String,
            required: true
        }
    }
});
const productSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true },
    image: { type: String, required: false },
    location: { type: String, required: false },
    userId: { type: Number, required: true },
    createdAt: { type: Date, default: Date.now },
  });

const postSchema = new mongoose.Schema({
    user: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    image: {
        type: String,
        required: true
    },
    avatar: {
        type: String,
        required: true
    },
    userId: {
        type: Number,
        required: true
    }
}, {
    timestamps: true
});

const blogSchema = new mongoose.Schema({
    userId: {
        type: Number,
        required: true
    },
    title: { type: String, required: true },
    content: { type: String, required: true },
    author: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    comments: [
      {
        user: { type: String, required: true },
        text: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],
  });
  
const Blog = mongoose.model('Blogs', blogSchema);
const Post = mongoose.model('Posts', postSchema);
const Product = mongoose.model('Products', productSchema);
const Recipe = mongoose.model('Recipe', recipeSchema);
const Ingredient = mongoose.model('Ingredient', ingredientSchema);
const User = mongoose.model('User', userSchema);
const Counter = mongoose.model('Counter', counterSchema);

module.exports = {
    User,
    Ingredient,
    Recipe,
    Product,
    Post,  
    Blog ,
    Counter
};