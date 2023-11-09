import React, { useEffect, useState } from 'react';
import styles from '../css/Upload.module.css';

const userStore = "userImagesDB";

function History() {
  const [imageData, setImageData] = useState([]);

  const fetchDB = () => {
    const dbName = userStore;
    const request = indexedDB.open(dbName);

    request.onsuccess = (event) => {
      const db = event.target.result;
      const objectStore = db.transaction(['images'], 'readonly').objectStore('images');

      objectStore.getAll().onsuccess = (event) => {
        const data = event.target.result;
        // Sort and reverse the data
        const sortedData = data.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).reverse();
        setImageData(sortedData);
      };
    };

    request.onerror = (event) => {
      console.error('Error opening database:', event.target.error);
      console.log(`Database "${dbName}" not found.`);
    };
  };

  const handleRefresh = () => {
    // Fetch the latest data
    fetchDB();
    console.log("Data Refreshed");
  };

  const clearDatabase = () => {
    const dbName = userStore;
    const request = indexedDB.open(dbName);
  
    request.onsuccess = (event) => {
      const db = event.target.result;
      const objectStore = db.transaction(['images'], 'readwrite').objectStore('images');
  
      const clearRequest = objectStore.clear();
  
      clearRequest.onsuccess = () => {
        console.log('Database has been cleared.');
        // Fetch and display data after clearing the database
        fetchDB();
      };
  
      clearRequest.onerror = (event) => {
        console.error('Error clearing database:', event.target.error);
      };
    };
  
    request.onerror = (event) => {
      console.error('Error opening database:', event.target.error);
      console.log(`Database "${dbName}" not found.`);
    };
  };

  useEffect(() => {
    // Fetch data when the component mounts
    fetchDB();
  }, []); // Empty dependency only runs once on mount

  return (
    <div className={styles.historyContainer}>
      <h2>Image History</h2>
      <button onClick={handleRefresh}>Refresh</button>
      <div className={styles.tableContainer}>
        <table>
          <thead>
            <tr>
              <th>Image</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {imageData.map((item) => (
              <tr key={item.id}>
                <td>
                  <a href={URL.createObjectURL(new Blob([item.data], { type: 'image/jpeg' }))} target="_blank" rel="noopener noreferrer">
                    View Image
                  </a>
                </td>
                <td>{item.timestamp}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button onClick={clearDatabase}>Clear Database</button>
    </div>
  );
}

export default History;