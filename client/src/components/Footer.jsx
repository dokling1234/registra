import React from "react";
import "./Footer.css"; // CSS file we'll create
import { assets } from "../assets/assets";

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-section contact-info">
          <div className="contact-item">
          <img src={assets.location_icon} alt="Location Icon" className="footer-icon" />
            <p>41 Jhocson St. <br />Manila, Philippines</p>
          </div>
          <div className="contact-item">
          <img src={assets.phone_icon1} alt="Phone Icon" className="footer-icon" />
            <p>+639 123 123 123</p>
          </div>
          <div className="contact-item">
          <img src={assets.email_icon} alt="Email Icon" className="footer-icon" />
            <p>support@registra.com</p>
          </div>
        </div>

        <div className="footer-section about-company">
          <h3>About the company</h3>
          <p>
          ICpEP (Institute of Computer Engineers of the Philippines) is a non-profit professional organization for computer engineers in the Philippines. It is registered with the Securities and Exchange Commission (SEC). ICpEP plays a key role in the field of computer engineering, managing board exams for certification, representing the profession, and collaborating with higher education institutions.
          </p>
          <div className="social-icons">
            <a href="https://www.facebook.com/ICpEPNCROfficial/"><img src={assets.facebook_icon} alt="Facebook Icon" className="social-icon-img" /></a>
            <a href="https://www.instagram.com/nuicpepse/"><img src={assets.instagram_icon} alt="Twitter Icon" className="social-icon-img" /></a>
            <a href="https://x.com/ICpEPse_NCR"><img src={assets.twitter_icon} alt="LinkedIn Icon" className="social-icon-img" /></a>
            <a href="https://ph.linkedin.com/company/institute-of-computer-engineers-of-the-philippines-student-edition"><img src={assets.linkedin_icon} alt="GitHub Icon" className="social-icon-img" /></a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
