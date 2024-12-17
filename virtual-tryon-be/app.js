import express from 'express';
import multer from 'multer';
import axios from 'axios';
import dotenv from 'dotenv';
import cors from "cors";
import jwt from "jsonwebtoken";
dotenv.config();

const app = express();
app.use(cors())

const upload = multer({ storage: multer.memoryStorage() });

const getAkSK = (keyIndex) => {
    console.log(keyIndex)
    return {
        ak: process.env[`ACCESS_KEY${keyIndex}`],
        sk: process.env[`SECRET_KEY${keyIndex}`],
    }
}

function encodeJwtToken(ak, sk) {
    const payload = {
        iss: ak,
        exp: Math.floor(Date.now() / 1000) + 1800,
        nbf: Math.floor(Date.now() / 1000) - 5
    };

    const token = jwt.sign(payload, sk, { algorithm: 'HS256' });
    return token;
}

let errorOnApiCall = 0;
async function generateSegmentedCloth(req, ak, sk) {
    try {
        const token = encodeJwtToken(ak, sk)
        const body = {
            cloth_image: req.files['garment'][0].buffer.toString('base64'),
            human_image: req.files['human'][0].buffer.toString('base64'),
            model_name: "kolors-virtual-try-on-v1-1"
        }

        let config = {
            method: 'post',
            maxBodyLength: Infinity,
            url: process.env.KLING_API_BASE_URL,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            data: JSON.stringify(body)
        };

        const response = await axios.request(config)

        if (response?.status === 200) {
            console.log('Waiting for 20 seconds before calling the second API...');

            // Wait for 20 seconds
            await new Promise(resolve => setTimeout(resolve, 20000));

            let _config = {
                method: 'get',
                maxBodyLength: Infinity,
                url: `${process.env.KLING_API_BASE_URL}/${response?.data?.request_id}`,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            };
            const _response = await axios.request(_config)

            console.log(_response?.data?.data?.task_result?.images?.[0]?.url)
            return {
                code: 200,
                success: true,
                imageUrl: _response?.data?.data?.task_result?.images?.[0]?.url
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
            const { ak, sk } = getAkSK(errorOnApiCall)
            // No infinite loop please
            return await generateSegmentedCloth(req, ak, sk)
        }

    }

}

app.post('/api/virtual-tryon', upload.fields([
    { name: 'human', maxCount: 1 },
    { name: 'garment', maxCount: 1 }
]), async (req, res) => {
    try {
        const ak = process.env.ACCESS_KEY0;
        const sk = process.env.SECRET_KEY0;
        const data = await generateSegmentedCloth(req, ak, sk);
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