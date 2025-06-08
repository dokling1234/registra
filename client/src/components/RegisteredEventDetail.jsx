import React, { useEffect, useState, useContext, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { AppContent } from "../context/AppContext";
import Navbar from "../components/Navbar"; // Import Navbar
import "./RegisteredEventDetail.css"; // Import CSS for styling
import html2pdf from 'html2pdf.js';
import Swal from "sweetalert2";

// Certificate Component
const Certificate = ({ event, userData, organizers }) => {
  const certificateRef = useRef(null);

  const generatePDF = () => {
    const element = certificateRef.current;
    const opt = {
      margin: 1,
      filename: `${event.title}_Certificate.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'landscape' }
    };

    html2pdf().set(opt).from(element).save();
  };

  return (
    <div className="certificate-container">
      <div ref={certificateRef} className="certificate">
        <div className="relative bg-white rounded-2xl shadow-xl flex flex-col items-center border-0 print:bg-white print:shadow-none"
          style={{ minWidth: 700, minHeight: 500, padding: 0, overflow: 'hidden' }}>
          {/* Gold/Navy Border */}
          <div style={{
            position: 'absolute',
            inset: 0,
            zIndex: 0,
            pointerEvents: 'none',
            background: 'linear-gradient(135deg, #002147 0%, #FFD700 100%)',
            borderRadius: '1.25rem',
            padding: '8px',
          }} />
          <div style={{
            position: 'absolute',
            inset: 12,
            zIndex: 1,
            background: 'white',
            borderRadius: '1rem',
          }} />
          <div className="relative z-10 flex flex-col items-center w-full px-12 py-10 print:p-0">
            <h2 className="text-4xl font-serif font-bold text-blue-900 tracking-wider mb-2">CERTIFICATE</h2>
            <div className="text-xl font-serif text-blue-900 tracking-widest mb-4">OF ACHIEVEMENT</div>
            <div className="text-base font-medium text-gray-700 mb-2 mt-2 tracking-wide">THIS CERTIFICATE IS PROUDLY PRESENTED TO</div>
            <div className="text-4xl font-signature text-blue-900 mb-2 mt-2" style={{ fontFamily: 'cursive, Pacifico, Arial' }}>{userData.fullName}</div>
            <div className="text-base text-gray-700 mb-4 text-center max-w-2xl">For outstanding participation in <span className="font-semibold text-blue-800">{event.title}</span> held on <span className="font-semibold text-blue-800">{new Date(event.date).toLocaleDateString()}</span>. We recognize your dedication and achievement.</div>
            {/* Central Seal */}
            <div className="flex justify-center items-center my-6">
              <div className="rounded-full border-4 border-yellow-400 bg-gradient-to-br from-yellow-200 to-yellow-500 w-20 h-20 flex items-center justify-center shadow-lg">
                <span className="text-3xl font-bold text-yellow-700">★</span>
              </div>
            </div>
            {/* Organizers */}
            <div className="flex flex-row justify-center gap-16 mt-8 w-full">
              {organizers.map((org, idx) => (
                <div key={idx} className="flex flex-col items-center">
                  {org.signature && (
                    <img src={org.signature} alt="Signature" className="h-10 object-contain mb-1" />
                  )}
                  <span className="font-signature text-xl text-blue-900 mb-1" style={{ fontFamily: 'cursive, Pacifico, Arial' }}>{org.name}</span>
                  <span className="text-xs text-gray-500 uppercase tracking-widest">{org.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <button
        onClick={generatePDF}
        className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
      >
        Download Certificate
      </button>
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

  useEffect(() => {
    const fetchRegisteredEvent = async () => {
      try {
        const res = await axios.get(`${backendUrl}/api/events/registered/${id}`);
        const fetchedEvent = res.data.event;
        setEvent(fetchedEvent);

        // Check if it's a past event
        const currentDate = new Date();
        const eventDate = new Date(fetchedEvent.date);
        if (eventDate < currentDate) {
          setIsPastEvent(true);

          // Fetch feedback form and submission status
          const feedbackRes = await axios.get(`${backendUrl}/api/feedback/getFeedback/${fetchedEvent._id}`);
          setFeedbackForm(feedbackRes.data || null);

          // Check if user has submitted feedback
          const submissionRes = await axios.get(`${backendUrl}/api/feedback/checkSubmission/${fetchedEvent._id}`);
          setHasSubmittedFeedback(submissionRes.data.hasSubmitted || false);

          // If feedback is submitted, fetch the certificate template
          if (submissionRes.data.hasSubmitted) {
            try {
              const templateRes = await axios.get(`${backendUrl}/api/certificate/template/${fetchedEvent._id}`);
              console.log('Template response:', templateRes.data); // Debug log
              if (templateRes.data.success) {
                setCertificateTemplate(templateRes.data.template);
              }
            } catch (err) {
              console.error('Error fetching certificate template:', err);
            }
          }
        }

        setLoading(false);
      } catch (err) {
        console.error("Failed to fetch registered event:", err.response?.data || err.message);
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
      const res = await axios.post(`${backendUrl}/api/feedback/submitFeedback/${feedbackForm._id}`, {
        userId: userData._id,
        answers
      }, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (res.data) {
        // Fetch latest event data and template
        const [eventRes, templateRes] = await Promise.all([
          axios.get(`${backendUrl}/api/events/${event._id}`),
          axios.get(`${backendUrl}/api/certificate/template/${event._id}`)
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
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { 
              scale: 2,
              useCORS: true,
              logging: false
            },
            jsPDF: { 
              unit: 'in', 
              format: 'letter', 
              orientation: 'landscape'
            }
          };

          try {
            // Generate PDF with updated event data
            const pdfBlob = await html2pdf().set(opt).from(certificateContent).outputPdf('blob');
            const formData = new FormData();
            formData.append('file', new File([pdfBlob], `${updatedEvent.title}-certificate.pdf`, { type: 'application/pdf' }));

            // Upload PDF to storage
            const uploadRes = await axios.post(`${backendUrl}/api/certificate/upload-template`, formData, {
              headers: {
                'Content-Type': 'multipart/form-data',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
              }
            });
            
            if (uploadRes.data.url) {
              // Save certificate information to database
              const certificateRes = await axios.post(`${backendUrl}/api/certificate/save`, {
                eventId: updatedEvent._id,
                certificateUrl: uploadRes.data.url
              }, {
                headers: {
                  'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
              });
              
              if (certificateRes.data.success) {
                setCertificate(certificateRes.data.certificate);
                setShowCertificate(true);
              }
            }
          } catch (err) {
            console.error('Error generating certificate:', err);
            Swal.fire({
              icon: "error",
              title: "Error",
              text: "There was an error generating your certificate. Please try again.",
              confirmButtonText: "OK"
            });
          }
        }

        setHasSubmittedFeedback(true);
        Swal.fire({
          icon: "success",
          title: "Success!",
          text: "Feedback submitted successfully! You can now download your certificate.",
          timer: 2000,
          showConfirmButton: false
        });
      }
    } catch (err) {
      console.error("Failed to submit feedback:", err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "There was an issue submitting your feedback. Please try again.",
        confirmButtonText: "OK"
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

        {/* Check if the event has passed */}
        {isPastEvent ? (
          <div className="past-event-message">
            {!hasSubmittedFeedback ? (
              <>
                <p className="past-event-heading">
                  This event has already passed. Please provide your feedback below to receive your certificate.
                </p>

                {/* Display the feedback form if it exists */}
                {feedbackForm ? (
                  <form className="feedback-form" onSubmit={handleFeedbackSubmit}>
                    <h2 className="feedback-form-title">Your Feedback</h2>
                    {feedbackForm.questions.map((q, index) => (
                      <div key={index} className="feedback-question">
                        <p className="question-text">{q.text}</p>

                        {/* Render question types dynamically */}
                        {q.type === "Choice" && (
                          <div className="choices">
                            {q.options.map((option, i) => (
                              <div key={i} className="choice-option">
                                <input
                                  type="radio"
                                  name={q.text}
                                  value={option}
                                  required
                                />
                                <label htmlFor={option}>{option}</label>
                              </div>
                            ))}
                          </div>
                        )}
                        {q.type === "Rating" && (
                          <div className="rating-options">
                            <label htmlFor={q.text}>Rate from 1 to 5:</label>
                            <div className="rating-choices">
                              {[1, 2, 3, 4, 5].map((i) => (
                                <div key={i} className="rating-choice">
                                  <input
                                    type="radio"
                                    id={`rating-${i}`}
                                    name={q.text}
                                    value={i}
                                    required
                                  />
                                  <label htmlFor={`rating-${i}`}>{i}</label>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {q.type === "Text" && (
                          <textarea
                            name={q.text}
                            placeholder="Your feedback..."
                            required
                          />
                        )}
                        {q.type === "Likert" && (
                          <div className="likert-question">
                            <div className="likert-grid likert-header">
                              <div></div>
                              {[
                                "Very Unsatisfied",
                                "Unsatisfied",
                                "Neutral",
                                "Satisfied",
                                "Very Satisfied",
                              ].map((n) => (
                                <span key={n} className="likert-label">
                                  {n}
                                </span>
                              ))}
                            </div>
                            {q.statements.map((stmt, i) => (
                              <div key={i} className="likert-grid">
                                <p className="likert-statement-text">{stmt}</p>
                                {[1, 2, 3, 4, 5].map((n) => (
                                  <input
                                    key={n}
                                    type="radio"
                                    name={`${q.text}-${i}`}
                                    value={n}
                                    required
                                  />
                                ))}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                    <button type="submit" className="submit-feedback-btn">
                      Submit Feedback
                    </button>
                  </form>
                ) : (
                  <p>No feedback form available for this event.</p>
                )}
              </>
            ) : (
              <>
                <p className="past-event-heading">
                  Thank you for your feedback! Your certificate is being generated.
                </p>
                {certificateTemplate ? (
                  <div className="certificate-preview">
                    <h3>Certificate Template Preview</h3>
                    <Certificate
                      event={event}
                      userData={userData}
                      organizers={certificateTemplate.organizers || []}
                    />
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
