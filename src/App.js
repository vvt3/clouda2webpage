import Header from './components/Header';
import Upload from "./components/Upload";
import Footer from "./components/Footer";
import History from "./components/History";

import styles from "./css/App.module.css";

function App() {
  return (
    <div className={styles.mainContainer}>
      <Header />
      <Upload />
      <History />
      {/*<Footer />*/}
    </div>
  );
}

export default App;
