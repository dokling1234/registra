
import React from "react";
import "./Footer.css"; // CSS file we'll create

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-top">
        <h1 className="footer-logo">
          Regi<span>stra</span>
        </h1>
        <nav className="footer-nav">
          <a href="/">Home</a>
          <a href="/about">About</a>
          <a href="/services">Services</a>
          <a href="/contact">Get in touch</a>
          <a href="/faqs">FAQs</a>
        </nav>
      </div>

      <hr className="footer-divider" />

      <div className="footer-bottom">
        <div className="footer-socials">
          <a href="#"><i className="fab fa-linkedin"></i></a>
          <a href="#"><i className="fab fa-instagram"></i></a>
          <a href="#"><i className="fab fa-facebook"></i></a>
        </div>
        <p className="footer-copy">
          Non Copyrighted © 2025 Upload by Registra
        </p>
      </div>
    </footer>
  );
};

export default Footer;
