import React from 'react';
import styles from '../css/Header.module.css';
import icon from '../public/images/rmIcon.png'

function Header() {
  return (
    <header className={styles.header}>
      <img src={icon} alt="Icon" className={styles.icon} />
      <h1>Resize Master</h1>
    </header>
  );
}

export default Header;