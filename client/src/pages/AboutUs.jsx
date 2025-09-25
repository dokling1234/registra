import React, { useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AppContent } from "../context/AppContext";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "./AboutUs.css";

const AboutUs = () => {
  const { isAdmin } = useContext(AppContent);
  const navigate = useNavigate();

  useEffect(() => {
    if (isAdmin) {
      navigate("/");
    }
  }, [isAdmin, navigate]);

  return (
    <>
      <Navbar />

      {/* Hero Section */}
      <section id="home" className="hero">
        <div className="container">
          <p className="lead">ABOUT US</p>
          <h1 className="mb-4">Connecting CpEs</h1>
          <a
            href="https://www.icpepncr.org/aboutus"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary hero-btn"
          >
            Visit Official About Us Page
          </a>
        </div>
      </section>

      <div className="container main-content">
        {/* Mission Section */}
        <section id="mission" className="mb-5 pt-5">
          <h1 className="section-heading mt-5">Mission</h1>
          <div className="card">
            <div className="card-body">
              <p>ICpEP aims to:</p>
              <ul>
                <li>
                  Build a network of professionals and graduates of computer
                  engineering in the country through member interaction and open
                  communication. This is directed to the industry, academe, and
                  government.
                </li>
                <li>
                  Support the professional career of members through relevant
                  training and exposure.
                </li>
                <li>
                  Expand knowledge and specialization in computer engineering
                  through research and development.
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Vision Section */}
        <section id="vision" className="mb-5 pt-5">
          <h1 className="section-heading mt-5">Vision</h1>
          <div className="card">
            <div className="card-body">
              <p>
                ICpEP envisions itself as the foundation of world-class Filipino
                computer engineering professionals and the motivator of interest
                towards excellence in computer engineering as a field of
                specialization.
              </p>
            </div>
          </div>
        </section>

        {/* Officers Section */}
        <section id="officers" className="mb-5 pt-5">
          <h1 className="section-heading mt-5">ICpEP NCR Officers 2024</h1>
          <div className="card officers-card">
            <div className="card-body">
              <h5>Executive Members</h5>
              <ul>
                <li>Dr. Roben A. Juanatas, PCpE — President</li>
                <li>Dr. Irish C. Juanatas, PCpE — VP for Internal Affairs</li>
                <li>Dr. Marie Luvett I. Goh, PCpE — VP for External Affairs</li>
                <li>Dr. Jay-ar P. Lalata, PCpE — VP for Education</li>
                <li>Engr. Sergio R. Peruda Jr., PCpE — Secretary</li>
                <li>Engr. Monette M. Loy-a, PCpE — Treasurer</li>
                <li>Engr. Heintjie N. Vicente, PCpE — Auditor</li>
              </ul>

              <h5 className="mt-4">Committee Members</h5>
              <ul>
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
          </div>
        </section>

        {/* Past Presidents Section */}
        <section id="past-presidents" className="mb-5 pt-5">
          <h1 className="section-heading mt-5">Past Presidents</h1>
          <div className="card presidents-card">
            <div className="card-body">
              <ul>
                <li>Dr. Irish C. Juanatas, PCpE — 2021-2022</li>
                <li>Engr. Maria Cecille A. Venal, PCpE — 2018-2020</li>
                <li>Engr. Noel B. Linsangan, PCpE — 2014-2017</li>
                <li>Engr. Lorenzo B. Sta. Maria Jr., PCpE — 2011-2013</li>
                <li>Engr. Alexander B. Ybasco † — 2010-2011</li>
                <li>Engr. Erwin G. Mendoza, PCpE — 2008-2010</li>
              </ul>
            </div>
          </div>
        </section>

        {/* History Section */}
        <section id="history" className="mb-5 pt-5">
          <h1 className="section-heading mt-5">History</h1>
          <div className="card">
            <div className="card-body">
              <h5>The Early Years</h5>
              <p>
                In 1992, a group of computer engineers formed the Philippine
                Institute of Computer Engineers, Inc. (PhICEs). PhICEs initially
                gathered a number of professional members and held conventions,
                seminars, and symposia in various regions across Luzon and
                Visayas. However, after some years of activity, the organization
                became inactive.
              </p>
            </div>
          </div>
          <div className="card">
            <div className="card-body">
              <h5>Revival and Rebranding</h5>
              <p>
                In 2008, computer engineers from different organizations, led by
                Engr. Erwin G. Mendoza and Engr. Alexander B. Ybasco, came
                together to revive the organization. After several meetings, the
                group decided to change the name to the Institute of Computer
                Engineers of the Philippines, Inc. (ICpEP), marking a fresh start
                for the professional body.
              </p>
            </div>
          </div>
          <div className="card">
            <div className="card-body">
              <h5>Industry Partnerships</h5>
              <p>
                Since then, ICpEP has established strong partnerships with the
                industry. Leading companies such as Intel, Microsoft, HP, Lenovo,
                Epson, and Red Fox recognize ICpEP as the sole organization for
                computer engineers in the Philippines. Additionally, ICpEP
                collaborated with SM Mall of Asia and NIDO Fortified Science
                Discovery Center to promote research and development through
                exhibitions of notable computer engineering projects.
              </p>
            </div>
          </div>
          <div className="card">
            <div className="card-body">
              <h5>Academic Expansion</h5>
              <p>
                In 2008, ICpEP expanded its reach into academia by forming the
                ICpEP Student Edition (ICpEP.SE). Starting with 11 schools,
                ICpEP.SE has since grown to include over 68 schools nationwide.
              </p>
            </div>
          </div>
          <div className="card">
            <div className="card-body">
              <h5>Regional Chapters</h5>
              <p>
                In 2014, ICpEP expanded its structure by establishing regional
                chapters across the Philippines, each with its own ICpEP Student
                Edition (ICpEP.SE) counterpart. This expansion enabled the
                organization to better serve the diverse needs of computer
                engineering students and professionals in various regions,
                strengthening its nationwide reach.
              </p>
            </div>
          </div>
          <div className="card">
            <div className="card-body">
              <h5>NCR Chapter</h5>
              <p>
                The NCR Chapter has a strong presence and includes affiliations
                with several prominent institutions. These institutions actively
                participate in ICpEP activities, helping to foster a strong
                community of computer engineering students and professionals
                within the region.
              </p>
            </div>
          </div>
        </section>
      </div>

      <Footer>
        <p className="footer-link">
          Official ICpEP NCR About Us:{" "}
          <a
            href="https://www.icpepncr.org/aboutus"
            target="_blank"
            rel="noopener noreferrer"
          >
            icpepncr.org/aboutus
          </a>
        </p>
      </Footer>
    </>
  );
};

export default AboutUs;
