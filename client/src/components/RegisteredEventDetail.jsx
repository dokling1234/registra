import React, { useEffect, useState, useContext } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { AppContent } from "../context/AppContext";
import Navbar from "../components/Navbar"; // Import Navbar
import "./RegisteredEventDetail.css"; // Import CSS for styling

const RegisteredEventDetail = () => {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isPastEvent, setIsPastEvent] = useState(false); // State to check if it's a past event
  const [feedbackForm, setFeedbackForm] = useState(null); // State for feedback form
  const { userData } = useContext(AppContent);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRegisteredEvent = async () => {
      try {
        const res = await axios.get(`/api/events/registered/${id}`);
        const fetchedEvent = res.data.event;
        setEvent(fetchedEvent);

        // Check if it's a past event
        const currentDate = new Date();
        const eventDate = new Date(fetchedEvent.date);
        if (eventDate < currentDate) {
          setIsPastEvent(true); // Set true if event date is in the past

          // Fetch feedback form if the event has passed
          const feedbackRes = await axios.get(
            `/api/feedback/getFeedback/${fetchedEvent._id}`
          );
          setFeedbackForm(feedbackRes.data || null);
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
  }, [id, userData?.token]);
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
      await axios.post(`/api/feedback/submitFeedback/${feedbackForm._id}`, {
        respondentId: userData._id,
        answers,
      });
      alert("Feedback submitted successfully!");
    } catch (err) {
      console.error("Failed to submit feedback:", err);
      alert("There was an issue submitting your feedback. Please try again.");
    }
  };

  if (loading || !event) return <div className="loading">Loading...</div>;

  return (
    <>
      <Navbar /> {/* Add Navbar */}
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
            <p className="past-event-heading">
              This event has already passed. Please provide your feedback below.
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
