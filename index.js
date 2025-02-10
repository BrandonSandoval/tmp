require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const { S3Client, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { Upload } = require('@aws-sdk/lib-storage');

const app = express();
const PORT = 5000;
app.use(bodyParser.json());

// Middleware
app.use(bodyParser.json());
app.use('/uploads', express.static(path.join(__dirname, '/uploads'))); 

// Configure AWS S3
const s3 = new S3Client({
    region: process.env.BUCKET_REGION,
    credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY,
        secretAccessKey: process.env.S3_SECRET_KEY,
    },
});

const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 16 * 1024 * 1024 } });


// MongoDB Connection
mongoose
    .connect(process.env.MONGO_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch((err) => console.error('MongoDB connection error:', err));

// Define a schema and model for image metadata
const imageSchema = new mongoose.Schema({
    filename: String,
    url: String,
    s3Key: String,
    uploadDate: { type: Date, default: Date.now },
});

const Image = mongoose.model('Image', imageSchema);

// Routes
app.post('/upload', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const fileName = `uploads/${Date.now()}_${req.file.originalname}`;

        
        const uploadParams = {
            client: s3,
            params: {
                Bucket: process.env.BUCKET_NAME,
                Key: fileName,
                Body: req.file.buffer,
                ContentType: req.file.mimetype,
                // ACL: 'public-read',
            },
        };

        const uploadTask = new Upload(uploadParams);
        const uploadResult = await uploadTask.done();

        // Get the uploaded S3 URL
        const imageUrl = uploadResult.Location; 

        // Save metadata in MongoDB
        const newImage = new Image({ filename: req.file.originalname, url: imageUrl, s3Key: fileName });
        await newImage.save();

        res.status(201).json({ message: 'Image uploaded successfully', image: newImage });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to upload image' });
    }
});

app.get('/images/:id', async (req, res) => {
    try {
        const image = await Image.findById(req.params.id);
        if (!image) return res.status(404).json({ error: 'Image not found' });

        // Redirect directly to the S3 URL
        res.redirect(image.url);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch image' });
    }
});


app.delete('/images/:id', async (req, res) => {
    try {
        const image = await Image.findById(req.params.id);
        if (!image) return res.status(404).json({ error: 'Image not found' });

        await s3.send(new DeleteObjectCommand({ Bucket: process.env.BUCKET_NAME, Key: image.s3Key }));

        await Image.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: 'Image deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to delete image' });
    }
});

app.put('/images/:id', upload.single('image'), async (req, res) => {
    try {
        const { id } = req.params;
        if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

        const existingImage = await Image.findById(id);
        if (!existingImage) return res.status(404).json({ error: 'Image not found' });

        // Delete old image from S3
        await s3.send(new DeleteObjectCommand({ Bucket: process.env.BUCKET_NAME, Key: existingImage.s3Key }));

        // Upload new image to S3
        const newS3Key = `uploads/${Date.now()}_${req.file.originalname}`;
        const uploadTask = new Upload({
            client: s3,
            params: {
                Bucket: process.env.BUCKET_NAME,
                Key: newS3Key,
                Body: req.file.buffer,
                ContentType: req.file.mimetype,
                // ACL: 'public-read',
            },
        });

        const uploadResult = await uploadTask.done();
        const newImageUrl = uploadResult.Location;

        // Update MongoDB record
        const updatedImage = await Image.findByIdAndUpdate(id, { filename: req.file.originalname, url: newImageUrl, s3Key: newS3Key }, { new: true });

        res.status(200).json({ message: 'Image updated successfully', image: updatedImage });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to update image' });
    }
});

app.get('/', (req, res) => {
    res.send('Welcome to the Image Upload Server!');
});


// Validating for file size
app.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: 'File size exceeds the 16 MB limit' });
        }
    }
    next(err);
  });
  

// Start Server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
