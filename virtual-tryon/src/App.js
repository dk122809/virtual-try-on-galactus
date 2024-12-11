import React, { useState } from 'react';
import axios from 'axios';
import { Box } from "@mui/material";
import { styled } from '@mui/material/styles';
import Button from '@mui/material/Button';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import Grid from '@mui/system/Grid';
import LoadingButton from '@mui/lab/LoadingButton';

function App() {
  const [selectedImage, setSelectedImage] = useState(null); // For file input image
  const [selectedPresetImage, setSelectedPresetImage] = useState(null); // For preset image selection
  const [responseImage, setResponseImage] = useState(null); // For the image from API response
  const [isloading, setIsLoading] = useState(false);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(URL.createObjectURL(file)); // Preview the uploaded image
    }
  };

  const VisuallyHiddenInput = styled('input')({
    clip: 'rect(0 0 0 0)',
    clipPath: 'inset(50%)',
    height: 1,
    overflow: 'hidden',
    position: 'absolute',
    bottom: 0,
    left: 0,
    whiteSpace: 'nowrap',
    width: 1,
  });

  const handlePresetImageSelect = (image) => {
    setSelectedPresetImage(image); // Set the selected preset image
  };

  const handleSubmit = async () => {
    // Make sure we have both images selected
    if (!selectedImage || !selectedPresetImage) {
      alert('Please upload the image and select preset image!');
      return;
    }
    
    // Form data to send to backend
    const formData = new FormData();
    formData.append('selectedImage', selectedImage); // set the uploaded image in the form
    formData.append('selectedPresetImage', selectedPresetImage); // set the selected preset image in the form

    console.log("formData---", formData);
    console.log("selectedImage---", selectedImage);
    console.log("selectedPresetImage---", selectedPresetImage);
    try {
      setIsLoading(true);
      // Make an API request to your backend
      const response = await axios.post('http://your-backend-api-url', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Assuming the API returns an image URL in the response
      setResponseImage(response.data.imageUrl); // Update the state with the response image URL
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
    m: 1,
    width: '5rem',
    height: '5rem',
    overflow: 'hidden',
    cursor: 'pointer',
    display: 'inline-block',
    borderRadius: '16px',
  };

  const uploadImageStyle = {
    bgcolor: 'background.paper',
    m: 1,
    width: '200px',
    height: '150px',
    overflow: 'hidden',
    cursor: 'pointer',
    display: 'inline-block',
    borderRadius: '16px',
    border: 2,
    borderColor: 'text.primary'
  };

  return (
    <div className="App">
      <h1>Image Selector</h1>
      <Box sx={{ flexGrow: 1 }}>
        <Grid container spacing={2}>
          <Grid size={5}>
            <div id="select-image-button">
              <label>Select an image to upload:</label>
              <Button
                component="label"
                role={undefined}
                variant="contained"
                tabIndex={-1}
                startIcon={<CloudUploadIcon />}
              >
                Upload files
                <VisuallyHiddenInput
                  type="file"
                  onChange={handleImageChange}
                  multiple
                />
              </Button>
            </div>
            {selectedImage && (
              <Box sx={{
                ...uploadImageStyle,
              }}>
                <img src={selectedImage} alt="Selected" width="200" height="150" />
              </Box>
            )}
          </Grid>
          <Grid size={7}>
            <div id="preset-image-section">
              <label>Select a preset image:</label>
              <div>
                {presetImaagesArray.map((image, index) => (
                  <Box sx={{
                    ...commonStyles,
                    border: selectedPresetImage === image ? 2 : 1,
                    borderColor: selectedPresetImage === image ? "primary.main" : "text.primary",
                  }}
                  >
                    <img
                      key={index}
                      src={`/images/${image}`}
                      alt={image}
                      width="100"
                      height="100"
                      onClick={() => handlePresetImageSelect(image)}
                    />
                  </Box>
                ))}
              </div>
            </div>
          </Grid>
        </Grid>
        <Grid
          container
          direction="row"
          sx={{
            justifyContent: "space-evenly",
            alignItems: "center",
          }}
        >
          <LoadingButton variant="contained" loading={isloading} disabled={false} onClick={handleSubmit}>
            Submit
          </LoadingButton>
        </Grid>
      </Box>

      {responseImage && (
        <div>
          <h2>Image from API Response</h2>
          <img src={responseImage} alt="API Response" />
        </div>
      )}
    </div>
  );
}

export default App;
