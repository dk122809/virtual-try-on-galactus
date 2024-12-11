import express from 'express';
import multer from 'multer';
import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import cors from "cors"
dotenv.config();

const app = express();
app.use(cors())

const upload = multer({ storage: multer.memoryStorage() });

const __dirname = path.dirname(new URL(import.meta.url).pathname);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.post('/api/virtual-tryon', upload.fields([
    { name: 'human', maxCount: 1 },
    { name: 'garment', maxCount: 1 }
]), async (req, res) => {
    try {

        const formData = new FormData();
        formData.append('clothing_image', req.files['garment'][0].buffer, 'garment.jpg');
        formData.append('avatar_image', req.files['human'][0].buffer, 'human.jpg');

        const headers = {
            'x-rapidapi-host': process.env.RAPIDAPI_HOST,
            'x-rapidapi-key': process.env.API_KEY,
            ...formData.getHeaders()
        };

        console.log(formData)

        const response = await axios.post(process.env.RAPID_URL, formData, {
            headers: headers,
            responseType: 'arraybuffer'
        });

        if (response.headers['content-type'].startsWith('image/')) {
            const imageBuffer = Buffer.from(response.data);
            const imageName = `output_${Date.now()}.webp`;
            const __dirname = path.dirname(new URL(import.meta.url).pathname);
            const imagePath = path.join(__dirname, 'uploads', imageName);

            if (!fs.existsSync(path.join(__dirname, 'uploads'))) {
                fs.mkdirSync(path.join(__dirname, 'uploads'));
            }

            fs.writeFileSync(imagePath, imageBuffer);

            const imageUrl = `${req.protocol}://${req.get('host')}/uploads/${imageName}`;

            res.json({
                success: true,
                imageUrl: imageUrl
            });
        } else {
            res.status(400).json({
                success: false,
                error: 'Unexpected response format from the external API'
            });
        }
    } catch (error) {
        console.error('Error forwarding the request:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to process virtual try-on request'
        });
    }
});

// Start the server
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
