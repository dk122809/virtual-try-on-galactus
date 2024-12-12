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

let __dirname = path.dirname(new URL(import.meta.url).pathname);
__dirname = __dirname.replace(/\\/g, '/'); // Use forward slashes for consistency
__dirname = __dirname.replace(/^\/C:/, 'C:'); // Remove any leading slash before C:
console.log(__dirname)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const getRapidApiKey = (keyIndex) => {
    return process.env[`API_KEY${keyIndex}`];
};

let errorOnApiCall = 0;
async function generateSegmentedCloth(req, headers) {
    try {
        const formData = new FormData();
        formData.append('clothing_image', req.files['garment'][0].buffer, 'garment.jpg');
        formData.append('avatar_image', req.files['human'][0].buffer, 'human.jpg');

        const _headers = {
            ...headers,
            ...formData.getHeaders()
        };

        const response = await axios.post(process.env.RAPID_URL, formData, {
            headers: _headers,
            responseType: 'arraybuffer'
        });

        if (response.headers['content-type'].startsWith('image/')) {
            const imageBuffer = Buffer.from(response.data);
            const imageName = `output_${Date.now()}.webp`;
            const __dirname = path.dirname(new URL(import.meta.url).pathname).replace(/\\/g, '/').replace(/^\/C:/, 'C:');
            let imagePath = path.join(__dirname, 'uploads', imageName);

            if (!fs.existsSync(path.join(__dirname, 'uploads'))) {
                fs.mkdirSync(path.join(__dirname, 'uploads'));
            }
            // imagePath = imagePath.replace(/\\/g, '\\\\');

            // // Remove duplicate 'C:\\' at the start of the path
            // imagePath = imagePath.replace(/^C:\\+/, 'C:\\');
            // imagePath = imagePath.replace(/^\\\\C:\\+/, 'C:\\')
            console.log(imagePath);
            fs.writeFileSync(imagePath, imageBuffer);

            const imageUrl = `${req.protocol}://${req.get('host')}/uploads/${imageName}`;

            return {
                code: 200,
                success: true,
                imageUrl: imageUrl
            }
        } else {
            return {
                code: 400,
                success: false,
                error: 'Unexpected response format from the external API'
            }
        }
    } catch (error) {
        errorOnApiCall += 1;
        if (errorOnApiCall <= 2) {
            const headers = {
                'x-rapidapi-host': process.env.RAPIDAPI_HOST,
                'x-rapidapi-key': getRapidApiKey(errorOnApiCall),
            }
            // No infinite loop please
            return await generateSegmentedCloth(req, headers)
        }
        console.log(error.message);
    }

}

app.post('/api/virtual-tryon', upload.fields([
    { name: 'human', maxCount: 1 },
    { name: 'garment', maxCount: 1 }
]), async (req, res) => {
    try {
        const headers = {
            'x-rapidapi-host': process.env.RAPIDAPI_HOST,
            'x-rapidapi-key': getRapidApiKey(errorOnApiCall),
        }
        const data = await generateSegmentedCloth(req, headers);
        res.status(data?.code || 400).json({
            ...data
        });
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