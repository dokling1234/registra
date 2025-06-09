import React, { useEffect, useState, useContext, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { AppContent } from "../context/AppContext";
import Navbar from "../components/Navbar"; // Import Navbar
import "./RegisteredEventDetail.css"; // Import CSS for styling
import html2pdf from "html2pdf.js";
import Swal from "sweetalert2";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

// Certificate Component
const Certificate = ({ templateUrl, userName }) => {
  // Convert PDF URL to PNG preview URL
  let pngUrl = templateUrl
    ? templateUrl.replace(/\.pdf$/, ".png").replace("/upload/", "/upload/w_1056,h_816/")
    : "";

  const certRef = useRef(null);
  const [finalPng, setFinalPng] = useState("");

  // Overlay the name, render to PNG, then display
  useEffect(() => {
    if (!pngUrl || !userName) return;
    const renderToPng = async () => {
      if (!certRef.current) return;
      // Wait for image to load
      const img = certRef.current.querySelector("img");
      if (!img) return;
      if (!img.complete) {
        await new Promise((resolve) => {
          img.onload = resolve;
          img.onerror = resolve;
        });
      }
      const canvas = await html2canvas(certRef.current, { useCORS: true, scale: 2 });
      setFinalPng(canvas.toDataURL("image/png"));
    };
    renderToPng();
    // eslint-disable-next-line
  }, [pngUrl, userName]);

  return (
    <div className="certificate-container">
      {/* Hidden overlay for rendering */}
      <div
        ref={certRef}
        style={{
          position: "absolute",
          left: "-9999px",
          top: 0,
          width: 1056,
          height: 816,
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            position: "relative",
            width: 1056,
            height: 816,
            background: pngUrl ? `url('${pngUrl}') center center / cover no-repeat` : "#fff",
            borderRadius: "1rem",
            overflow: "hidden",
          }}
        >
          <img
            src={pngUrl}
            alt="Certificate"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              borderRadius: "1rem",
              visibility: "hidden",
              position: "absolute",
              left: 0,
              top: 0,
            }}
            crossOrigin="anonymous"
          />
          {/* User name overlay */}
          <div
            style={{
              position: "absolute",
              top: "34%", // Adjust as needed for your template
              left: 0,
              width: "100%",
              textAlign: "center",
              fontSize: "3rem",
              fontWeight: "bold",
              color: "#000000",
              fontFamily: " Times New Roman",
              textShadow: "0 2px 8px #fff, 0 2px 8px #fff",
              pointerEvents: "none",
              userSelect: "none",
            }}
          >
            {userName}
          </div>
        </div>
      </div>
      {/* Display the final PNG */}
      <div className="certificate flex justify-center items-center">
        {finalPng ? (
          <img
            src={finalPng}
            alt="Certificate Preview"
            style={{
              width: "100%",
              maxWidth: 1056,
              maxHeight: 816,
              borderRadius: "1rem",
              boxShadow: "0 2px 8px #0002",
              background: "#fff",
              objectFit: "contain",
            }}
          />
        ) : (
          <div>Loading certificate preview...</div>
        )}
      </div>
      {finalPng && (
        <a
          href={finalPng}
          download="certificate.png"
          className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors inline-block text-center"
        >
          Download Certificate
        </a>
      )}
    </div>
  );
};

const RegisteredEventDetail = () => {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isPastEvent, setIsPastEvent] = useState(false);
  const [feedbackForm, setFeedbackForm] = useState(null);
  const [hasSubmittedFeedback, setHasSubmittedFeedback] = useState(false);
  const [showCertificate, setShowCertificate] = useState(false);
  const [certificate, setCertificate] = useState(null);
  const [certificateTemplate, setCertificateTemplate] = useState(null);
  const { userData, backendUrl } = useContext(AppContent);
  const navigate = useNavigate();
  const certificateRef = useRef(null);
  const [activeTemplateId, setActiveTemplateId] = useState(null);

  useEffect(() => {
    const fetchRegisteredEvent = async () => {
      try {
        const res = await axios.get(
          `${backendUrl}/api/events/registered/${id}`
        );
        const fetchedEvent = res.data.event;
        setEvent(fetchedEvent);

        // Check if it's a past event
        const currentDate = new Date();
        const eventDate = new Date(fetchedEvent.date);
        if (eventDate < currentDate) {
          setIsPastEvent(true);

          // Fetch feedback form and submission status
          const feedbackRes = await axios.get(
            `${backendUrl}/api/feedback/getFeedback/${fetchedEvent._id}`
          );
          setFeedbackForm(feedbackRes.data || null);

          // Check if user has submitted feedback
          const submissionRes = await axios.get(
            `${backendUrl}/api/feedback/checkSubmission/${fetchedEvent._id}`
          );
          setHasSubmittedFeedback(submissionRes.data.hasSubmitted || false);

          // If feedback is submitted, fetch the certificate template
          if (submissionRes.data.hasSubmitted) {
            try {
              const templateRes = await axios.get(
                `${backendUrl}/api/certificate/template/${fetchedEvent._id}`
              );
              console.log("Template response:", templateRes.data); // Debug log
              if (templateRes.data.success) {
                setCertificateTemplate(templateRes.data.template);
              }
            } catch (err) {
              console.error("Error fetching certificate template:", err);
            }
          }
        }

        setLoading(false);
      } catch (err) {
        console.error(
          "Failed to fetch registered event:",
          err.response?.data || err.message
        );
      }
    };

    fetchRegisteredEvent();
  }, [id, userData?.token, backendUrl]);

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const answers = [];

    feedbackForm.questions.forEach((q, index) => {
      if (q.type === "Likert") {
        const likertAnswers = q.statements.map((stmt, i) => ({
          statement: stmt,
          value: formData.get(`${q.text}-${i}`),
        }));
        answers.push({
          questionText: q.text,
          type: "Likert",
          answers: likertAnswers,
        });
      } else {
        const value = formData.get(q.text);
        answers.push({
          questionText: q.text,
          type: q.type,
          answer: value,
        });
      }
    });

    try {
      // Submit feedback
      const res = await axios.post(
        `${backendUrl}/api/feedback/submitFeedback/${feedbackForm._id}`,
        {
          userId: userData._id,
          answers,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (res.data) {
        // Fetch latest event data and template
        const [eventRes, templateRes] = await Promise.all([
          axios.get(`${backendUrl}/api/events/${event._id}`),
          axios.get(`${backendUrl}/api/certificate/template/${event._id}`),
        ]);

        const updatedEvent = eventRes.data.event;
        const template = templateRes.data.template;

        setEvent(updatedEvent);
        setCertificateTemplate(template);

        // Generate and save certificate after successful feedback submission
        const certificateContent = certificateRef.current;
        if (certificateContent && template) {
          const opt = {
            margin: 0,
            filename: `${updatedEvent.title}-certificate.pdf`,
            image: { type: "jpeg", quality: 0.98 },
            html2canvas: {
              scale: 2,
              useCORS: true,
              logging: false,
            },
            jsPDF: {
              unit: "in",
              format: "letter",
              orientation: "landscape",
            },
          };

          try {
            // Generate PDF with updated event data
            const pdfBlob = await html2pdf()
              .set(opt)
              .from(certificateContent)
              .outputPdf("blob");
            const formData = new FormData();
            formData.append(
              "file",
              new File([pdfBlob], `${updatedEvent.title}-certificate.pdf`, {
                type: "application/pdf",
              })
            );

            // Upload PDF to storage
            const uploadRes = await axios.post(
              `${backendUrl}/api/certificate/upload-template`,
              formData,
              {
                headers: {
                  "Content-Type": "multipart/form-data",
                  Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
              }
            );

            if (uploadRes.data.url) {
              // Save certificate information to database
              const certificateRes = await axios.post(
                `${backendUrl}/api/certificate/save`,
                {
                  eventId: updatedEvent._id,
                  certificateUrl: uploadRes.data.url,
                },
                {
                  headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                  },
                }
              );

              if (certificateRes.data.success) {
                setCertificate(certificateRes.data.certificate);
                setShowCertificate(true);
              }
            }
          } catch (err) {
            console.error("Error generating certificate:", err);
            Swal.fire({
              icon: "error",
              title: "Error",
              text: "There was an error generating your certificate. Please try again.",
              confirmButtonText: "OK",
            });
          }
        }

        setHasSubmittedFeedback(true);
        Swal.fire({
          icon: "success",
          title: "Success!",
          text: "Feedback submitted successfully! You can now download your certificate.",
          timer: 2000,
          showConfirmButton: false,
        });
      }
    } catch (err) {
      console.error("Failed to submit feedback:", err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "There was an issue submitting your feedback. Please try again.",
        confirmButtonText: "OK",
      });
    }
  };

  if (loading || !event) return <div className="loading">Loading...</div>;

  return (
    <>
      <Navbar />
      <div className="event-detail-container">
        <h1 className="event-title">{event.title}</h1>
        <p className="event-date-time">
          {new Date(event.date).toLocaleDateString()} at {event.time}
        </p>
        <p className="event-location">{event.location}</p>
        <p className="event-about">{event.about}</p>
        <div className="event-price">₱{event.price}</div>

        {isPastEvent ? (
          <div className="past-event-message">
            {!hasSubmittedFeedback ? (
              <>
                <p className="past-event-heading">
                  This event has already passed. Please provide your feedback
                  below to receive your certificate.
                </p>
                {feedbackForm ? (
                  <form
                    className="feedback-form"
                    onSubmit={handleFeedbackSubmit}
                  >
                    {/* ...feedback form rendering... */}
                  </form>
                ) : (
                  <p>No feedback form available for this event.</p>
                )}
              </>
            ) : (
              <>
                <p className="past-event-heading">
                  Thank you for your feedback! Your certificate is being
                  generated.
                </p>
                {certificateTemplate &&
                certificateTemplate.templates &&
                certificateTemplate.templates.length > 0 ? (
                  <div className="flex flex-row justify-center items-start w-full">
                    {/* Main Certificate Preview */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <Certificate
                        templateUrl={
                          (activeTemplateId
                            ? certificateTemplate.templates.find(
                                (tpl) => tpl.templateId === activeTemplateId
                              )?.url
                            : certificateTemplate.templates[0].url) || ""
                        }
                        userName={userData?.fullName || "Your Name"}
                      />
                    </div>
                    {/* Template Thumbnails on the Side */}
                    <div
                      className="flex flex-col items-center ml-8"
                      style={{ minWidth: 140 }}
                    >
                      {certificateTemplate.templates.map((tpl) => {
                        // Show a PNG preview if available, else fallback to PDF icon
                        let pngUrl = tpl.url.replace(/\.pdf$/, ".png");
                        pngUrl = pngUrl.replace("/upload/", "/upload/w_120/");
                        return (
                          <div
                            key={tpl.templateId}
                            className={`flex flex-col items-center bg-white p-2 mb-4 rounded shadow cursor-pointer ${
                              activeTemplateId === tpl.templateId
                                ? "ring-2 ring-blue-500"
                                : ""
                            }`}
                            style={{ minWidth: 100 }}
                            onClick={() => setActiveTemplateId(tpl.templateId)}
                            title={`Preview ${tpl.templateId}`}
                          >
                            <div className="mb-1 text-xs font-semibold">
                              {tpl.templateId}
                            </div>
                            <img
                              src={pngUrl}
                              alt={`Preview ${tpl.templateId}`}
                              style={{
                                maxWidth: 150,
                                border: "1px solid #ccc",
                                borderRadius: 6,
                              }}
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = "/pdf-icon.png";
                              }}
                            />
                          </div>
                        );
                      })}
                      {activeTemplateId && (
                        <button
                          className="mt-2 px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 text-sm"
                          onClick={() => setActiveTemplateId(null)}
                        >
                          Back to Default View
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <p>Loading certificate template...</p>
                )}
              </>
            )}
          </div>
        ) : (
          <div className="event-registration-info">
            <p className="registered-message">
              You are registered for this event.
            </p>
            {event.ticketUrl && (
              <div className="ticket-container">
                <img
                  src={event.ticketUrl}
                  alt="Your Ticket"
                  className="ticket-image"
                />
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default RegisteredEventDetail;
