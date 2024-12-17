import express from 'express';
import multer from 'multer';
import axios from 'axios';
import dotenv from 'dotenv';
import cors from "cors";
import { v2 as cloudinary } from 'cloudinary';
import streamifier from 'streamifier';
dotenv.config();

const app = express();
app.use(cors())

const upload = multer({ storage: multer.memoryStorage() });
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_KEY,
    api_secret: process.env.CLOUDINARY_SECRET,
});

const getAkSK = (keyIndex) => {
    console.log(keyIndex)
    return process.env[`KLING_API_KEY${keyIndex}`];
}

async function uploadImageToCloudinary(buffer, folder) {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            { folder },
            (error, result) => {
                if (error) return reject(error);
                resolve(result.secure_url);
            }
        );
        streamifier.createReadStream(buffer).pipe(stream);
    });
}

async function uploadImage(image) {
    const uploadResult = await cloudinary.uploader
        .upload(
            image
        )
        .catch((error) => {
            console.log(error);
        });
    return uploadResult
}

let errorOnApiCall = 0;
async function generateSegmentedCloth(req, api_key) {
    try {
        const garmentImageUrl = await uploadImageToCloudinary(
            req.files["garment"][0].buffer,
            "garments"
        );
        const humanImageUrl = await uploadImageToCloudinary(
            req.files["human"][0].buffer,
            "humans"
        );
        const { garment_type } = req.body;

        let data = {
            "model": "kling",
            "task_type": "ai_try_on",
            "input": {
                "model_input": humanImageUrl,
                "batch_size": 1
            }
        };
        if (garment_type === "Top") {
            data.input.upper_input = garmentImageUrl;
        } else if (garment_type === "Bottom") {
            data.input.lower_input = garmentImageUrl;
        } else {
            data.input.dress_input = garmentImageUrl;
        }

        let config = {
            method: 'post',
            maxBodyLength: Infinity,
            url: 'https://api.piapi.ai/api/v1/task',
            headers: {
                'x-api-key': api_key,
                'Content-Type': 'application/json'
            },
            data: JSON.stringify(data)
        };

        const response = await axios.request(config)

        if (response?.status === 200) {
            console.log('Waiting for 80 seconds before calling the second API...');

            // Wait for 20 seconds
            await new Promise(resolve => setTimeout(resolve, 80000));
            console.log("calling api")

            let _config = {
                method: 'get',
                maxBodyLength: Infinity,
                url: `https://api.piapi.ai/api/v1/task/${response?.data?.data?.task_id}`,
                headers: {
                    'x-api-key': api_key
                }
            };
            const _response = await axios.request(_config)

            const uploadResult = await uploadImage(_response?.data?.data?.output?.works?.[0]?.image?.resource_without_watermark)

            console.log(_response?.data?.data?.output?.works?.[0]?.image?.resource_without_watermark)
            return {
                code: 200,
                success: true,
                imageUrl: uploadResult?.url
            }
        } else {
            return {
                code: 400,
                success: false,
                error: 'Unexpected response format from the external API'
            }
        }
    } catch (error) {
        console.log(error);
        errorOnApiCall += 1;
        if (errorOnApiCall <= 2) {
            const api_key = getAkSK(errorOnApiCall)
            // No infinite loop please
            return await generateSegmentedCloth(req, api_key)
        }

    }

}

app.post('/api/virtual-tryon', upload.fields([
    { name: 'human', maxCount: 1 },
    { name: 'garment', maxCount: 1 }
]), async (req, res) => {
    try {
        const api_key = process.env.KLING_API_KEY0
        const data = await generateSegmentedCloth(req, api_key);
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