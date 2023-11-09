import React, { useEffect, useState } from 'react';
import styles from '../css/Upload.module.css';
import Axios from 'axios';
import { ProgressBar } from 'react-bootstrap';

const FormData = require('form-data');
// Manually set the Content-Type header
const config = {
  headers: {
    timeout: 10000, //10 seconds
    'Content-Type': 'multipart/form-data',
  }
};

const myURL = "http://3.106.141.114:3000/";
const mongoURL = "http://13.210.221.120/";
const userStore = "userImagesDB";
const dbVer = 2;

// Function to store image data in IndexedDB
const storeImageInIndexedDB = (imageData) => {
  const dbName = userStore;
  const dbVersion = dbVer;

  const request = indexedDB.open(dbName, dbVersion);

  request.onerror = (event) => {
    console.error('Error opening database:', event.target.error);
  };

  request.onsuccess = (event) => {
    const db = event.target.result;
    const transaction = db.transaction(['images'], 'readwrite');
    const store = transaction.objectStore('images');

    const imageRecord = {
      data: imageData,
      timestamp: getDateTime(),
    };

    const addRequest = store.add(imageRecord);

    addRequest.onsuccess = (event) => {
      console.log('Image stored indexedDB with key:', event.target.result);
    };

    addRequest.onerror = (event) => {
      console.error('Error storing image:', event.target.error);
    };
  };
};

const saveMongo = async (imageData) => {
  try {
    const timestamp = getDateTime();

    // Assuming you have an API endpoint /saveImage on your server
    const response = await fetch('http://13.210.221.120/savetodb', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: imageData,
        timestamp,
      }),
    });

    if (response.ok) {
      console.log('Image saved to server successfully');
    } else {
      console.error('Error saving image to server:', response.statusText);
    }
  } catch (error) {
    console.error('Error saving image to server:', error.message);
  }
};

// Get Date
const getDateTime = () => {
  const now = new Date();

  const day = now.getDate().toString().padStart(2, '0');
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const year = now.getFullYear();
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');

  return `${day}/${month}/${year} - ${hours}:${minutes}`;
};

const dbSetup = async () => {
  if (!('indexedDB' in window)) {
      console.log('IndexedDB is not supported in this browser.');
      return;
  }

  const dbName = userStore;
  const dbVersion = dbVer;
  const request = indexedDB.open(dbName, dbVersion);

  request.onerror = (event) => {
      console.error('Error opening database:', event.target.error);
  };

  request.onupgradeneeded = (event) => {
      const db = event.target.result;
      const store = db.createObjectStore('images', { keyPath: 'id', autoIncrement: true });
  };
};

function Upload() {
    const [searchInput, setSearchInput] = useState("");
    const [s3Files, sets3Files] = useState([]);
    const [selectedFile, setSelectedFile] = useState(null);
    const [selectedAspectRatio, setSelectedAspectRatio] = useState('');
    const [selectedSize, setSelectedSize] = useState('');
    const [sizeOptions, setSizeOptions] = useState([]);
    const [conversionProgress, setConversionProgress] = useState(0);
    const [outURL, setOutURL] = useState(null);

    useEffect(() => {
      // run once
      dbSetup();
  }, []);

    const handleSearch = (event) => {
      event.preventDefault();
      setSearchInput(event.target.value);
    };
    
    const handleGetS3 = () => {

      //test db


      // make Get to get s3 files in array
      Axios.get(myURL + "/gets3")
        .then(response => {
          console.log("recieved: ", response);
        })
        .catch(error => {
          console.log("error: ", error);
        })
    }

    const handleUserFile = () => {
      if (selectedFile !== null && selectedFile !== undefined) {

        console.log("Appended: ", selectedFile);

        const formdata = new FormData();
        formdata.append("file", selectedFile, selectedFile.originalname);
    
        // Make the POSTS request using Axios
        Axios.post(myURL + "upload", formdata, config)
        .then(response => {
          console.log("file uploaded: ", response.data);
        })
        .catch(error => {
          console.log("error: ", error);
        })
      } 
      else {
        console.log("No file selected.");
      }
    }

    const handleFileUpload = (event) => {
        event.preventDefault();
        const file = event.target.files[0];
        if(file === undefined) {
            setSelectedFile(null)
            console.log("file was removed?");
        }
        if(file !== null && file !== undefined) {
            setSelectedFile(file);
        } 
    };

    const handleAspectRatioChange = (event) => {
        const aspectRatio = event.target.value;
        setSelectedAspectRatio(aspectRatio);

        // Update the available options for the second dropdown based on the aspect ratio.
        let sizeOptions = [];
        if (aspectRatio === '1x1') {
            sizeOptions = ['100x100', '125x125', '150x150', '200x200']; 
        } else if (aspectRatio === '4x3') {
            sizeOptions = ['640x480', '800x600', '960x720', '1024x768', '1280x960', '1400x1050', '1440x1080'];
        } else if (aspectRatio === '16x9') {
            sizeOptions = ['426x240', '640x360', '854x480', '1280x720', '1920x1080'];
        }
        setSelectedSize('');
        setSizeOptions(sizeOptions);
    };

    const handleSizeChange = (event) => {
        setSelectedSize(event.target.value);
    };

    const handleConvert = () => {
        if (!selectedFile || !selectedSize) {
          console.log('No file and size selected.');
          return;
        }

        const [width, height] = selectedSize.split('x');
        // Create a new FormData object to send data to the server
        const formData = new FormData();
        formData.append('file', selectedFile, selectedFile.originalname);
        formData.append('width', width);
        formData.append('height', height);

        // Make a POST request to your server
        Axios.post(myURL + 'resize', formData, {
          ...config,
          responseType: 'arraybuffer',
          onUploadProgress: (progressEvent) => {
            const progress = (progressEvent.loaded / progressEvent.total) * 100;
            setConversionProgress(progress);
          },
        })
        .then((response) => {
          if (response.status === 200) {
            const arrayBuffer = response.data;
            // Create a Blob from the array buffer
            const blob = new Blob([arrayBuffer], { type: 'image/jpeg' });
            // Create a Blob URL
            const blobURL = URL.createObjectURL(blob);
            // save the url
            setOutURL(blobURL);
            // Reset the conversion progress to 0 when done
            setConversionProgress(0);
            // Store the image in the database
            storeImageInIndexedDB(arrayBuffer);
            //saveMongo(arrayBuffer);
          } else {
            console.error('Error during conversion: ', response.statusText);
            // Reset the conversion progress to 0 when an error occurs
            setConversionProgress(0);
          }
          })
          .catch((error) => {
            console.error('Error during conversion: ', error);
            // Reset the conversion progress to 0 when an error occurs
            setConversionProgress(0);
          });   
    };

    return (
        <div className={styles.uploadContainer}>
          <div>
            <h2>1. Search or upload the file you want to resize</h2>
            <div className={styles.inputContainer}>
              <div className={styles.search}>
                <input type="text" placeholder="Your-Image.jpeg" onChange={handleSearch} value={searchInput} />
                <button onClick={handleGetS3}>Search</button>
              </div>
              <div className={styles.upload}>
                <input type="file" name="file" accept="image/*" id="fileInput" onChange={handleFileUpload} required />
                <button onClick={handleUserFile}>Upload</button>
              </div>
            </div>  
          </div>
          
          {selectedFile && (
            <div>
              <h2>2. Select the aspect ratio</h2>
              <select value={selectedAspectRatio} onChange={handleAspectRatioChange}>
                <option value="">Select Aspect Ratio</option>
                <option value="1x1">1x1</option>
                <option value="4x3">4x3</option>
                <option value="16x9">16x9</option>
              </select>
            </div>
          )}
      
          {selectedFile && selectedAspectRatio && (
            <div>
              <h2>3. Select the size</h2>
              <select value={selectedSize} onChange={handleSizeChange}>
                <option value="">Select Size</option>
                {sizeOptions.map((size, index) => (
                  <option key={index} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </div>
          )}
      
          {selectedFile && selectedAspectRatio && selectedSize && (
      <div>
        {conversionProgress > 0 && conversionProgress < 100 ? (
          <ProgressBar padding="10px" fontSize="20px"
            now={conversionProgress}
            label={`${conversionProgress.toFixed(2)}%`}
            animated={conversionProgress > 0 && conversionProgress < 100}
          />
        ) : (
          <button className={styles.convertButton} onClick={handleConvert}>
            Convert
          </button>
        )}
      </div>
    )}
        <div className={styles.divider}>
        </div>
        <div>
          { outURL && (
          <div>
            <img src={outURL} alt="Resized" onError={(e) => console.log("Image loading error", e)}/>
            
          </div>
          )}
        </div>
        <div className={styles.divider}>
        </div>
        </div>
    );
}

export default Upload;