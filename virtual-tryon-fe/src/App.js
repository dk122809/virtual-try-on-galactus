import React, { useState } from 'react';
import axios from 'axios';
import { Box, Container, Typography } from "@mui/material";
import Grid from '@mui/system/Grid';
import LoadingButton from '@mui/lab/LoadingButton';
import Header from './components/layout/header';
import FileUpload from './components/fileUpload';

function App() {
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedPresetImage, setSelectedPresetImage] = useState(null);
  const [responseImage, setResponseImage] = useState("/images/no-image.jpg");
  const [garmentImage, setGarmentImage] = useState(null);
  const [humanImage, setHumanImage] = useState(null);
  const [isloading, setIsLoading] = useState(false);

  const handleImageChange = (file) => {
    setSelectedImage(URL.createObjectURL(file));
    setGarmentImage(file)
  };

  const handlePresetImageSelect = (image) => {
    setSelectedPresetImage(image);
    fetch(`/images/${image}`)
      .then((response) => response.blob())
      .then((blob) => {
        setHumanImage(blob);

      })
      .catch((err) => {
        console.error('Error loading image:', err);
      });
  };

  const handleSubmit = async () => {
    if (!selectedImage || !selectedPresetImage) {
      alert('Please upload the image and select preset image!');
      return;
    }

    const formData = new FormData();
    formData.append('human', humanImage);
    formData.append('garment', garmentImage);

    try {
      setIsLoading(true);
      const response = await axios.post('http://127.0.0.1:8000/api/virtual-tryon', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          "Connection": "keep-alive"
        },
      });

      setResponseImage(response.data.imageUrl);
    } catch (error) {
      console.error('Error uploading images:', error);
    }
    setIsLoading(false);
  };

  const presetImaagesArray = [
    'men_1.png',
    'men_2.png',
    'men_3.jpg',
    'women_1.png',
    'women_2.png',
    'women_3.png',
  ];

  const commonStyles = {
    bgcolor: 'background.paper',
    m: 1.5,
    width: '10rem',
    height: '10rem',
    overflow: 'hidden',
    cursor: 'pointer',
    display: 'inline-block',
    borderRadius: '16px',
  };

  return (
    <div className="App">
      <Header />
      <Container>
        <Box sx={{ m: 5 }} />
        <Typography align='center' fontSize={60}>AI Clothes Changer</Typography>
        <Box sx={{ flexGrow: 1 }}>
          <Grid container spacing={2}>
            <Grid size={6}>
              <div className='clothSelector'>
                <div class="step">
                  1
                </div>
                <Typography fontWeight="bold">Upload an image of clothes</Typography>
                <FileUpload handleImageChange={handleImageChange} />
              </div>
              <Box sx={{ m: 5 }} />
              <div className='modelSelector'>
                <div class="step">
                  2
                </div>
                <Typography fontWeight="bold">Choose the model</Typography>
                {presetImaagesArray.map((image, index) => (
                  <Box sx={{
                    ...commonStyles,
                    border: selectedPresetImage === image ? 2 : 1,
                    borderColor: selectedPresetImage === image ? "error.main" : "secondary.main",
                  }}
                  >
                    <img
                      key={index}
                      src={`/images/${image}`}
                      alt={image}
                      onClick={() => handlePresetImageSelect(image)}
                    />
                  </Box>
                ))}
              </div>
            </Grid>
            <Grid size={6}>
              <div className='resultContainer'>
                <img
                  src={responseImage}
                />
              </div>

              <div className='submitBtn'>
                <LoadingButton variant="contained" color='secondary' fullWidth={true} loading={isloading} disabled={false} onClick={handleSubmit}>
                  Generate
                </LoadingButton>
              </div>
            </Grid>

          </Grid>
        </Box>
      </Container>
    </div>

  );
}

export default App;
