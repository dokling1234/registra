import React from "react";
import "./Footer.css";
import { assets } from "../assets/assets";

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-content">
        
        {/* About Section */}
        <div className="footer-section about-company">
          <h3>About the organization</h3>
          <p>
            ICpEP (Institute of Computer Engineers of the Philippines) is a non-profit professional organization for computer engineers in the Philippines. 
            It is registered with the Securities and Exchange Commission (SEC). ICpEP plays a key role in the field of computer engineering, managing board exams 
            for certification, representing the profession, and collaborating with higher education institutions.
          </p>

          {/* Buttons */}
          <div className="button-group">
            <a 
              href="https://www.icpepncr.org/" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="official-btn"
            >
              Visit Official Website
            </a>
            <a 
              href="https://www.icpepncr.org/contact" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="official-btn secondary"
            >
              Contact Us
            </a>
          </div>

          {/* Social Media Icons */}
          <div className="social-icons">
            <a href="https://www.facebook.com/ICpEPNCROfficial/" target="_blank" rel="noopener noreferrer">
              <img src={assets.facebook_icon} alt="Facebook Icon" className="social-icon-img" />
            </a>
            <a href="https://www.instagram.com/nuicpepse/" target="_blank" rel="noopener noreferrer">
              <img src={assets.instagram_icon} alt="Instagram Icon" className="social-icon-img" />
            </a>
            <a href="https://x.com/ICpEPse_NCR" target="_blank" rel="noopener noreferrer">
              <img src={assets.twitter_icon} alt="Twitter Icon" className="social-icon-img" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;