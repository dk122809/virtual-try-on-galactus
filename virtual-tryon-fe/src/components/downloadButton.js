import React from 'react';
import { Button } from "@mui/material";

function DownloadButton({ imageUrl, disabled }) {
    const handleDownload = () => {
        fetch(imageUrl, {
            method: "GET",
            headers: {},
        })
            .then((response) => response.blob())
            .then((blob) => {
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.style.display = "none";
                a.href = url;
                a.download = "image.webp"; // Set the file name
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
            })
            .catch((err) => console.error("Error downloading image:", err));
    };

    return (
        <Button
            variant="contained"
            color="primary"
            fullWidth={true}
            disabled={disabled}
            onClick={handleDownload}
        >
            Download Image
        </Button>
    );
}

export default DownloadButton;
