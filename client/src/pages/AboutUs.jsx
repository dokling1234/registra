import React, {  useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AppContent } from "../context/AppContext";import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "./AboutUs.css"; // Import the CSS file for styling

const AboutUs = () => {

  const { isAdmin } = useContext(AppContent);
    const navigate = useNavigate();
  
    console.log(isAdmin);
    useEffect(() => {
      if (isAdmin) {
        // Not an admin, redirect to home or another page
        navigate("/");
      }
    }, [isAdmin, navigate]);
  return (
    <>
      <Navbar />
      {/* Hero Section */}
      <section id="home" className="hero">
        <div className="container">
          <div className="row">
            <div className="col-md-8">
              <p className="lead">ABOUT US</p>
              <h1 className="mb-4">Connecting CpEs</h1>
            </div>
          </div>
        </div>
      </section>

      <div className="container mt-5">
        {/* Mission Section */}
        <section id="mission" className="mb-5 pt-5">
          <h1 className="section-heading mt-5">Mission</h1>
          <div className="card">
            <div className="card-body">
              <p className="card-text">ICpEP aims to:</p>
              <ul className="card-text">
                <li>
                  Build a network of professionals and graduates of computer engineering in the country through member
                  interaction and open communication. This is directed to the industry, academe, and government.
                </li>
                <li>Support the professional career of members through relevant training and exposure.</li>
                <li>Expand knowledge and specialization in computer engineering through research and development.</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Vision Section */}
        <section id="vision" className="mb-5 pt-5">
          <h1 className="section-heading mt-5">Vision</h1>
          <div className="card">
            <div className="card-body">
              <p className="card-text">
                ICpEP envisions itself as the foundation of world-class Filipino computer engineering professionals and
                the motivator of interest towards excellence in computer engineering as a field of specialization.
              </p>
            </div>
          </div>
        </section>

        {/* History Section */}
        <section id="history" className="mb-5 pt-5">
          <h1 className="section-heading mt-5">History</h1>
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">The Early Years</h5>
              <p className="card-text">
                In 1992, a group of computer engineers formed the Philippine Institute of Computer Engineers, Inc.
                (PhICEs). PhICEs initially gathered a number of professional members and held conventions, seminars, and
                symposia in various regions across Luzon and Visayas. However, after some years of activity, the
                organization became inactive.
              </p>
            </div>
          </div>
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Revival and Rebranding</h5>
              <p className="card-text">
                In 2008, computer engineers from different organizations, led by Engr. Erwin G. Mendoza and Engr.
                Alexander B. Ybasco, came together to revive the organization. After several meetings, the group decided
                to change the name to the Institute of Computer Engineers of the Philippines, Inc. (ICpEP), marking a
                fresh start for the professional body.
              </p>
            </div>
          </div>
          {/* Add more history cards as needed */}
        </section>
      </div>

      <Footer />
    </>
  );
};

export default AboutUs;