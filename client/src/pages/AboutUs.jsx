import React, { useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AppContent } from "../context/AppContext";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { motion } from "framer-motion";

const AboutUs = () => {
  const { isAdmin } = useContext(AppContent);
  const navigate = useNavigate();

  useEffect(() => {
    if (isAdmin) {
      navigate("/");
    }
  }, [isAdmin, navigate]);

  // ✅ Parent container for stagger
  const container = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.3 }, // delay each child
    },
  };

  // ✅ Children fade-in-up
  const fadeInUp = {
    hidden: { opacity: 0, y: 40 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" },
    },
  };

  return (
    <>
      <Navbar />

      {/* ✅ Hero Section */}
      <section
        id="home"
        className="relative flex flex-col justify-center items-center text-white text-center px-4 overflow-hidden"
        style={{
          minHeight: "70vh",
          height: "100vh",
        }}
      >
        {/* Animated Background with Parallax Zoom */}
        <motion.div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              "url('https://www.icpepncr.org/storage/images/bg.jpg')",
          }}
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 2, ease: "easeOut" }}
        />
        <div className="absolute inset-0 bg-black/40"></div>

        {/* Motion Content */}
        <motion.div
          className="relative z-10 flex flex-col items-center"
          initial={{ opacity: 0, scale: 0.95, y: 40 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
        >
          {/* ABOUT US */}
          <motion.p
            className="font-semibold mb-4"
            style={{
              fontSize: "clamp(1.5rem, 3vw, 3rem)",
              textShadow: "0px 0px 10px rgba(0, 0, 0, 0.6)",
            }}
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
          >
            ABOUT US
          </motion.p>

          {/* Connecting CpEs */}
          <motion.h1
            className="font-bold mb-6 leading-tight"
            style={{
              fontSize: "clamp(2.2rem, 6vw, 6rem)",
              textShadow:
                "0px 0px 12px rgba(255, 255, 255, 0.8), 0px 0px 24px rgba(0, 0, 0, 0.6)",
            }}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 1 }}
          >
            Connecting CpEs
          </motion.h1>

          {/* Button */}
          <motion.a
            href="https://www.icpepncr.org/aboutus"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-[#1a4870] hover:bg-[#f7941d] text-white px-5 sm:px-6 py-2.5 sm:py-3 rounded-lg shadow-md transition transform hover:-translate-y-1 font-medium text-sm sm:text-base"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 1 }}
          >
            Visit Official About Us Page
          </motion.a>
        </motion.div>
      </section>

      {/* ✅ Main Content with Stagger */}
      <div className="bg-[#e3f4f4] py-12 sm:py-16">
        <motion.div
          className="max-w-6xl mx-auto px-4 space-y-12"
          variants={container}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {/* Mission */}
          <motion.section id="mission" variants={fadeInUp}>
            <h1 className="text-3xl sm:text-4xl font-bold text-[#1a4870] text-center mb-6 relative after:content-[''] after:block after:w-16 after:h-1 after:bg-[#f7941d] after:mx-auto after:mt-2">
              Mission
            </h1>
            <div className="bg-white shadow-md rounded-lg p-6 sm:p-8">
              <p className="mb-4">ICpEP aims to:</p>
              <ul className="list-disc list-inside space-y-2">
                <li>
                  Build a network of professionals and graduates of computer
                  engineering through industry, academe, and government.
                </li>
                <li>
                  Support the professional career of members through training
                  and exposure.
                </li>
                <li>
                  Expand knowledge and specialization in computer engineering
                  through research and development.
                </li>
              </ul>
            </div>
          </motion.section>

          {/* Vision */}
          <motion.section id="vision" variants={fadeInUp}>
            <h1 className="text-3xl sm:text-4xl font-bold text-[#1a4870] text-center mb-6 relative after:content-[''] after:block after:w-16 after:h-1 after:bg-[#f7941d] after:mx-auto after:mt-2">
              Vision
            </h1>
            <div className="bg-white shadow-md rounded-lg p-6 sm:p-8">
              <p>
                ICpEP envisions itself as the foundation of world-class Filipino
                computer engineering professionals and a motivator of excellence
                in the field.
              </p>
            </div>
          </motion.section>

          {/* Officers */}
          <motion.section id="officers" variants={fadeInUp}>
            <h1 className="text-3xl sm:text-4xl font-bold text-[#1a4870] text-center mb-6 relative after:content-[''] after:block after:w-16 after:h-1 after:bg-[#f7941d] after:mx-auto after:mt-2">
              ICpEP NCR Officers 2024
            </h1>
            <div className="bg-white shadow-md rounded-lg p-6 sm:p-8">
              <h5 className="text-xl font-semibold text-[#1a4870] mb-4">
                Executive Members
              </h5>
              <ul className="list-disc list-inside space-y-2">
                <li>Dr. Roben A. Juanatas, PCpE — President</li>
                <li>Dr. Irish C. Juanatas, PCpE — VP for Internal Affairs</li>
                <li>Dr. Marie Luvett I. Goh, PCpE — VP for External Affairs</li>
                <li>Dr. Jay-ar P. Lalata, PCpE — VP for Education</li>
                <li>Engr. Sergio R. Peruda Jr., PCpE — Secretary</li>
                <li>Engr. Monette M. Loy-a, PCpE — Treasurer</li>
                <li>Engr. Heintjie N. Vicente, PCpE — Auditor</li>
              </ul>

              <h5 className="text-xl font-semibold text-[#1a4870] mt-6 mb-4">
                Committee Members
              </h5>
              <ul className="list-disc list-inside space-y-2">
                <li>Dr. Joselito Eduard E. Goh, PCpE</li>
                <li>Dr. Nelson C. Rodelas, PCpE</li>
                <li>Dr. Jocelyn F. Villaverde, PCpE</li>
                <li>Engr. Honeylet D. Grimaldo, PCpE</li>
                <li>Engr. Ana Antoniette C. Illahi, PCpE</li>
                <li>Engr. Evangeline P. Lubao, PCpE</li>
                <li>Engr. Rico M. Manalo, PCpE</li>
                <li>Engr. Yolanda D. Austria, PCpE</li>
                <li>Engr. Kenn Arion B. Wong, PCpE</li>
              </ul>
            </div>
          </motion.section>

          {/* Past Presidents */}
          <motion.section id="past-presidents" variants={fadeInUp}>
            <h1 className="text-3xl sm:text-4xl font-bold text-[#1a4870] text-center mb-6 relative after:content-[''] after:block after:w-16 after:h-1 after:bg-[#f7941d] after:mx-auto after:mt-2">
              Past Presidents
            </h1>
            <div className="bg-white shadow-md rounded-lg p-6 sm:p-8">
              <ul className="list-disc list-inside space-y-2">
                <li>Dr. Irish C. Juanatas, PCpE — 2021-2022</li>
                <li>Engr. Maria Cecille A. Venal, PCpE — 2018-2020</li>
                <li>Engr. Noel B. Linsangan, PCpE — 2014-2017</li>
                <li>Engr. Lorenzo B. Sta. Maria Jr., PCpE — 2011-2013</li>
                <li>Engr. Alexander B. Ybasco † — 2010-2011</li>
                <li>Engr. Erwin G. Mendoza, PCpE — 2008-2010</li>
              </ul>
            </div>
          </motion.section>

          {/* History */}
          <motion.section id="history" variants={fadeInUp}>
            <h1 className="text-3xl sm:text-4xl font-bold text-[#1a4870] text-center mb-6 relative after:content-[''] after:block after:w-16 after:h-1 after:bg-[#f7941d] after:mx-auto after:mt-2">
              History
            </h1>
            <div className="space-y-6">
              {[
                {
                  title: "The Early Years",
                  text: "In 1992, a group of computer engineers formed PhICEs... later became inactive.",
                },
                {
                  title: "Revival and Rebranding",
                  text: "In 2008, engineers revived the org, renamed ICpEP.",
                },
                {
                  title: "Industry Partnerships",
                  text: "Partnered with Intel, Microsoft, HP, Lenovo, Epson, Red Fox, and more.",
                },
                {
                  title: "Academic Expansion",
                  text: "Formed ICpEP.SE, from 11 schools to 68 nationwide.",
                },
                {
                  title: "Regional Chapters",
                  text: "Established regional chapters with student counterparts.",
                },
                {
                  title: "NCR Chapter",
                  text: "Includes prominent institutions fostering community in NCR.",
                },
              ].map((item, idx) => (
                <motion.div
                  key={idx}
                  variants={fadeInUp}
                  className="bg-white shadow-md rounded-lg p-6 sm:p-8"
                >
                  <h5 className="text-lg font-semibold text-[#f7941d] mb-2">
                    {item.title}
                  </h5>
                  <p>{item.text}</p>
                </motion.div>
              ))}
            </div>
          </motion.section>
        </motion.div>
      </div>

      <Footer />
    </>
  );
};

export default AboutUs;
