import React from "react";
import { assets } from "../assets/assets";

const Footer = () => {
  return (
    <footer className="bg-[#0a0a84] text-gray-300 w-full px-6 sm:px-10 pt-12">
      <div className="max-w-6xl mx-auto flex flex-col items-center text-center">
        
        {/* About Section */}
        <div className="w-full">
          <h3 className="text-white text-xl sm:text-2xl font-bold mb-4">
            About the Organization
          </h3>
          <p className="text-sm sm:text-base leading-relaxed text-gray-100 max-w-3xl mx-auto mb-8">
            ICpEP (Institute of Computer Engineers of the Philippines) is a non-profit professional organization 
            for computer engineers in the Philippines. It is registered with the Securities and Exchange Commission (SEC). 
            ICpEP plays a key role in the field of computer engineering, managing board exams for certification, 
            representing the profession, and collaborating with higher education institutions.
          </p>

          {/* Buttons */}
          <div className="flex flex-wrap gap-4 justify-center mb-8">
            <a
              href="https://www.icpepncr.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white text-[#0a0a84] font-bold px-5 py-2.5 rounded-full shadow-md hover:bg-gray-100 hover:-translate-y-1 transition transform duration-300"
            >
              Visit Official Website
            </a>
            <a
              href="https://www.icpepncr.org/contact"
              target="_blank"
              rel="noopener noreferrer"
              className="border-2 border-white text-white font-bold px-5 py-2.5 rounded-full hover:bg-white hover:text-[#0a0a84] transition transform duration-300"
            >
              Contact Us
            </a>
          </div>

          {/* Social Media Icons */}
          <div className="flex justify-center gap-4 mb-10">
            <a
              href="https://www.facebook.com/ICpEPNCROfficial/"
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 flex justify-center items-center rounded-full bg-white hover:bg-gray-100 transition transform hover:scale-110"
            >
              <img
                src={assets.facebook_icon}
                alt="Facebook Icon"
                className="w-6 h-6 object-contain"
              />
            </a>
            <a
              href="https://www.instagram.com/nuicpepse/"
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 flex justify-center items-center rounded-full bg-white hover:bg-gray-100 transition transform hover:scale-110"
            >
              <img
                src={assets.instagram_icon}
                alt="Instagram Icon"
                className="w-6 h-6 object-contain"
              />
            </a>
            <a
              href="https://x.com/ICpEPse_NCR"
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 flex justify-center items-center rounded-full bg-white hover:bg-gray-100 transition transform hover:scale-110"
            >
              <img
                src={assets.twitter_icon}
                alt="Twitter Icon"
                className="w-6 h-6 object-contain"
              />
            </a>
          </div>
        </div>
      </div>

      {/* Copyright Bar */}
      <div className="border-t border-gray-500 mt-6 py-4">
        <p className="text-center text-xs sm:text-sm text-gray-200">
          © {new Date().getFullYear()} ICpEP. All Rights Reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
