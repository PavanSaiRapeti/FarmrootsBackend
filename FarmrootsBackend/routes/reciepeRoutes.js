const express = require('express');
const router = express.Router();
const { Recipe, Product, Post, Blog } = require('../models/AllCollection');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const auth = require('../middleware/auth');

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
});

const generationConfig = {
  temperature: 1,
  topP: 0.95,
  topK: 64,
  maxOutputTokens: 8192,
  responseMimeType: "text/plain",
};

const generateResponse = async (input) => {
  try {
    const chatSession = model.startChat({
      generationConfig,
      history: [],
    });

    const result = await chatSession.sendMessage(input);
    return result.response.text();
  } catch (error) {
    throw error;
  }
};

const convertArrayToString = (array) => {
    if (!Array.isArray(array) || array.length === 0) {
      console.error('Input must be a non-empty array');
      return '';
    }
    return array.join(', ');
  };


// Recipe Routes
router.post('/generateReciepe', async (req, res) => {
    console.log("====> triggered recipe route");
    try {
        console.log("====> triggered recipe route", req.body);
        const ingredients = req.body;
        if (ingredients?.length === 0) {
            return res.status(400).json({ error: 'No ingredients provided' });
        }
        const ingredientsString = convertArrayToString(ingredients);
        const recipeMessage = `i have ${ingredientsString} give me atleast 5 recipes in a json format like this ${Recipe} with a how much time it takes to prepare and how many people it serves add  nutrition: {
      calories,
      protein
      carbohydrates",
      fat
    }`;
        const recipeResponse = await generateResponse([recipeMessage]);
        console.log('generated recipe===>',recipeResponse);

        if(recipeResponse){
          const cleanedJsonString = recipeResponse?.replace(/```json\n|\n```/g, '');
          const parsedResponse = JSON.parse(cleanedJsonString);
          console.log('generated recipe===>',parsedResponse);
          res.status(200).json({ recipes: parsedResponse , ai: true });
        }else{
          res.status(200).json({ recipes: [] , ai: false });
        }
    } catch (error) {
        console.error('Error fetching recipes:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});


router.get('/otherRecipes', async (req, res) => {
    try {
        const otherRecipes = await Recipe.find().limit(10);
        res.status(200).json({ recipes: otherRecipes });
        console.log('other recipes===>',otherRecipes);
    } catch (error) {
        console.error('Error fetching other recipes:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});


// Product Routes
router.get('/products', async (req, res) => {
  try {
    const requestId = req.headers['request-id'];
    const productsDb = await Product.find().sort({ createdAt: -1 });
        const filteredProducts = productsDb.map(post => {
            const { userId, ...rest } = post.toObject();
            if(userId === parseInt(requestId)){
                return {...rest, isMyProduct: true};
            }
            return {...rest, isMyProduct: false};
        });

    res.json(filteredProducts);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create a new product
router.post('/products', async (req, res) => {
  try {
    const userId = req.headers['request-id'];
    console.log('===>userId',userId);
    const { name, description, price, quantity, image, location } = req.body;
    console.log('===>userId', name, description, price, quantity, image, location ,userId );
    const newProduct = new Product({ name, description, price, quantity, image, location, userId: parseInt(userId)});
    await newProduct.save();
    res.status(201).json(newProduct);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update a product
router.put('/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, quantity, image, location } = req.body;
    const updatedProduct = await Product.findByIdAndUpdate(id, { name, description, price, quantity, image, location }, { new: true });
    res.json(updatedProduct);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete a product
router.delete('/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await Product.findByIdAndDelete(id);
    res.status(204).end();
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});



// Post Routes
router.post('/posts', async (req, res) => {
  try {
      const { user, description, image, avatar, userId } = req.body;
      console.log('==>content', req.body);

      // Validate request body
      if (!user || !description || !image || !avatar) {
          return res.status(400).json({ error: 'All fields are required' });
      }

      // Use the authenticated user's ID
      const newPost = new Post({ user, description, image, avatar, userId: parseInt(userId) });
      await newPost.save();
      res.status(201).json({ post: newPost });
  } catch (error) {
      console.error('Error creating post:', error);
      res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/posts', async (req, res) => {
    try {
        const requestId = req.headers['request-id'];
        console.log('===>requestId',requestId);
        const postsDb = await Post.find().sort({ createdAt: -1 }).select('user description image avatar createdAt userId');
        const filteredPosts = postsDb.map(post => {
            const { userId, ...rest } = post.toObject();
            if(userId === parseInt(requestId)){
                return {...rest, isMyPost: true};
            }
            return {...rest, isMyPost: false};
        });

        // Sort posts by creation date in descending order and select specific fields without _id and id
        res.status(200).json({ posts: filteredPosts });
    } catch (error) {
        console.error('Error fetching feed posts:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.delete('/posts/:postId', async (req, res) => {
    try {
        const postId = req.params.postId;
        await Post.findByIdAndDelete(postId);
        res.status(200).json({ message: 'Post deleted successfully' });
    } catch (error) {
        console.error('Error deleting post:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});


// Get all blogs
router.get('/blogs', async (req, res) => {
  try {
    const requestId = req.headers['request-id'];
    const blogsDb = await Blog.find().sort({ createdAt: -1 });
    const filteredBlogs = blogsDb.map(post => {
        const { userId , ...rest } = post.toObject();
        if(userId === parseInt(requestId)){
            return {...rest, isMyBlog: true};
        }
        return {...rest, isMyBlog: false};
    });
    res.json(filteredBlogs);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create a new blog
router.post('/blogs', async (req, res) => {
  try {
    const requestId = req.headers['request-id'];
    const { title, content, author } = req.body;
    const newBlog = new Blog({ title, content, author, userId: parseInt(requestId) });
    await newBlog.save();
    res.status(201).json(newBlog);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update a blog
router.put('/blogs/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content } = req.body;
    const updatedBlog = await Blog.findByIdAndUpdate(id, { title, content }, { new: true });
    res.json(updatedBlog);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete a blog
router.delete('/blogs/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await Blog.findByIdAndDelete(id);
    res.status(204).end();
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add a comment to a blog
  router.post('/blogs/:id/comments', async (req, res) => {
  try {
    const { id } = req.params;
    const { user, text } = req.body;
    const blog = await Blog.findById(id);
    blog.comments.push({ user, text });
    await blog.save();
    res.status(201).json(blog);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});



module.exports = router;

