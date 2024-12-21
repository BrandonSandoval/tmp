const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const dotenv = require('dotenv');
const fs = require('fs');

dotenv.config();

const app = express();
const PORT = 5000;

// Middleware
app.use(bodyParser.json());
app.use('/uploads', express.static(path.join(__dirname, '/uploads'))); // Serve uploaded images

// MongoDB Connection
mongoose
    .connect(process.env.MONGO_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch((err) => console.error('MongoDB connection error:', err));

// Define a schema and model for image metadata
const imageSchema = new mongoose.Schema({
  filename: String,
  contentType: String,
  // Store the binary data as a Buffer
  imageData: Buffer, 
  uploadDate: { type: Date, default: Date.now },
});

const Image = mongoose.model('Image', imageSchema);

const storage = multer.memoryStorage();

const upload = multer({ storage });

// Routes
app.post('/upload', upload.single('image'), async (req, res) => {
  try {
      if (!req.file) {
          return res.status(400).json({ error: 'No file uploaded' });
      }

      const { originalname, mimetype, buffer } = req.file;

      // Create a new image document
      const newImage = new Image({
          filename: originalname,
          contentType: mimetype,
          imageData: buffer,
      });

      // Save to MongoDB
      await newImage.save();

      res.status(201).json({
          message: 'Image uploaded successfully',
          image: {
              id: newImage._id,
              filename: newImage.filename,
              contentType: newImage.contentType,
          },
      });
  } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to upload image' });
  }
});

app.get('/images/:id', async (req, res) => {
  try {
      const { id } = req.params;

      // Find the image by ID
      const image = await Image.findById(id);
      if (!image) {
          return res.status(404).json({ error: 'Image not found' });
      }

      // Set the content type and send the image
      res.set('Content-Type', image.contentType);
      res.send(image.imageData);
  } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to fetch image' });
  }
});

app.delete('/images/:id', async (req, res) => {
  try {
      const { id } = req.params;

      // Find the image by ID
      const image = await Image.findById(id);
      if (!image) {
          return res.status(404).json({ error: 'Image not found' });
      }

      // Delete the image document from MongoDB
      await Image.findByIdAndDelete(id);

      res.status(200).json({ message: 'Image deleted successfully' });
  } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to delete image' });
  }
});

app.put('/images/:id', upload.single('image'), async (req, res) => {
  try {
      const { id } = req.params;

      if (!req.file) {
          return res.status(400).json({ error: 'No file uploaded' });
      }

      const { originalname, mimetype, buffer } = req.file;

      // Find the image by ID and update the binary data
      const updatedImage = await Image.findByIdAndUpdate(
          id,
          {
              filename: originalname,
              contentType: mimetype,
              imageData: buffer,
          },
           // Return the updated document
          { new: true }
      );

      if (!updatedImage) {
          return res.status(404).json({ error: 'Image not found' });
      }

      res.status(200).json({
          message: 'Image updated successfully',
          image: updatedImage,
      });
  } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to update image' });
  }
});

app.get('/', (req, res) => {
    res.send('Welcome to the Image Upload Server!');
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
