import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';

function FileUpload({ handleImageChange }) {
    const [files, setFiles] = useState([]);
    const { getRootProps, getInputProps } = useDropzone({
        accept: {
            'image/*': []
        },
        onDrop: acceptedFiles => {
            handleImageChange(acceptedFiles[0])
            setFiles(acceptedFiles.map(file => Object.assign(file, {
                preview: URL.createObjectURL(file)
            })));
        }
    });

    const thumbs = files.map(file => (
        <div className='thumb' key={file.name}>
            <div className="thumbInner">
                <img
                    src={file.preview}
                    onLoad={() => { URL.revokeObjectURL(file.preview) }}
                />
            </div>
        </div>
    ));

    return (
        <section className="fileUpload">
            <div {...getRootProps({ className: 'dropzone' })}>
                <input {...getInputProps()} />
                <p>Drag 'n' drop some files here, or click to select files</p>
            </div>
            <aside className='thumbsContainer'>
                {thumbs}
            </aside>
        </section>
    );
}

export default FileUpload;