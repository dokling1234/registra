import React, { useEffect, useState, useContext, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { AppContent } from "../context/AppContext";
import Navbar from "../components/Navbar";
import html2pdf from "html2pdf.js";
import Swal from "sweetalert2";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

// Certificate Component
const Certificate = ({ templateUrl, userName }) => {
  // Convert PDF URL to PNG preview URL
  let pngUrl = templateUrl
    ? templateUrl
        .replace(/\.pdf$/, ".png")
        .replace("/upload/", "/upload/w_1056,h_816/")
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
      const canvas = await html2canvas(certRef.current, {
        useCORS: true,
        scale: 2,
      });
      setFinalPng(canvas.toDataURL("image/png"));
    };
    renderToPng();
    // eslint-disable-next-line
  }, [pngUrl, userName]);

  // Download as PDF using the templateUrl
  const handleDownloadPDF = async () => {
    if (!templateUrl) return;

    // Fetch the original PDF as ArrayBuffer
    const existingPdfBytes = await fetch(templateUrl).then((res) =>
      res.arrayBuffer()
    );

    // Load a PDFDocument from the existing PDF bytes
    const pdfDoc = await PDFDocument.load(existingPdfBytes);

    // Get the first page
    const pages = pdfDoc.getPages();
    const firstPage = pages[0];

    // Draw the user's name (adjust position and font size as needed)
    const { width, height } = firstPage.getSize();
    const font = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
    const fontSize = 48;
    firstPage.drawText(userName, {
      x: width / 2 - userName.length * fontSize * 0.25, // Centered, adjust as needed
      y: height * 0.66, // Adjust Y as needed
      size: fontSize,
      font,
      color: rgb(0, 0, 0),
    });

    // Serialize the PDFDocument to bytes (a Uint8Array)
    const pdfBytes = await pdfDoc.save();

    // Trigger download
    const blob = new Blob([pdfBytes], { type: "application/pdf" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "certificate.pdf";
    link.click();
  };

  return (
    <div className="mt-8 flex flex-col items-center p-8 bg-slate-50 rounded-2xl shadow-lg">
      {/* Hidden overlay for rendering */}
      <div
        ref={certRef}
        className="absolute -left-full top-0 w-[1056px] h-[816px] pointer-events-none"
      >
        <div
          className="relative w-full h-full bg-white rounded-2xl overflow-hidden"
          style={{
            background: pngUrl
              ? `url('${pngUrl}') center center / cover no-repeat`
              : "#fff",
          }}
        >
          <img
            src={pngUrl}
            alt="Certificate"
            className="w-full h-full object-cover rounded-2xl invisible absolute left-0 top-0"
            crossOrigin="anonymous"
          />
          {/* User name overlay */}
          <div
            className="absolute top-[34%] left-0 w-full text-center text-5xl font-bold text-black pointer-events-none select-none"
            style={{
              fontFamily: "Times New Roman",
              textShadow: "0 2px 8px #fff, 0 2px 8px #fff",
            }}
          >
            {userName}
          </div>
        </div>
      </div>
      {/* Display the final PNG */}
      <div className="w-full max-w-4xl mx-auto bg-white rounded-2xl overflow-hidden shadow-lg">
        {finalPng ? (
          <img
            src={finalPng}
            alt="Certificate Preview"
            className="w-full max-w-full max-h-[816px] rounded-2xl shadow-md bg-white object-contain"
          />
        ) : (
          <div className="text-center py-8 text-gray-600">Loading certificate preview...</div>
        )}
      </div>
      <div className="flex flex-col sm:flex-row gap-4 mt-6 justify-center">
        <button
          onClick={handleDownloadPDF}
          className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg transition-all duration-300 hover:transform hover:-translate-y-1 hover:shadow-lg font-semibold"
        >
          Download as PDF
        </button>
      </div>
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
  const [isGeneratingCertificate, setIsGeneratingCertificate] = useState(false);
  const [waitingForFeedback, setWaitingForFeedback] = useState(false);
  const { userData, backendUrl } = useContext(AppContent);
  const navigate = useNavigate();
  const certificateRef = useRef(null);
  const [activeTemplateId, setActiveTemplateId] = useState(null);

  const handleResendTicket = async () => {
    navigate(`/uploadreceipt/${id}`);

    // const { value: file } = await Swal.fire({
    //   title: "Resubmit Receipt",
    //   html: `
    //     <input type="file" id="newReceipt" accept="image/*,application/pdf" />
    //     <div id="previewContainer" style="margin-top:10px;"></div>
    //   `,
    //   showCancelButton: true,
    //   confirmButtonText: "Upload",
    //   preConfirm: () => {
    //     const fileInput = document.getElementById("newReceipt");
    //     if (!fileInput.files[0]) {
    //       Swal.showValidationMessage("Please upload a receipt.");
    //       return false;
    //     }
    //     return fileInput.files[0];
    //   },
    // });

    // if (file) {
    //   try {
    //     const formData = new FormData();
    //     formData.append("file", file);
    //     formData.append("upload_preset", "event_preset");

    //     // ✅ Upload to Cloudinary
    //     const uploadRes = await axios.post(
    //       "https://api.cloudinary.com/v1_1/dqbnc38or/image/upload",
    //       formData
    //     );

    //     const imageUrl = uploadRes.data.secure_url;

    //     // ✅ Send to backend (reusing your registerForEvent logic)
    //     await axios.post(
    //       `/api/events/register/${id}`,
    //       {
    //         fullName: userData.fullName,
    //         userType: userData.userType,
    //         email: userData.email,
    //         receipt: imageUrl,
    //       },
    //       {
    //         headers: {
    //           Authorization: `Bearer ${localStorage.getItem("token")}`,
    //         },
    //       }
    //     );

    //     Swal.fire({
    //       icon: "success",
    //       title: "Receipt Resubmitted",
    //       text: "Your new receipt has been sent for review.",
    //     });
    //   } catch (err) {
    //     console.error(err);
    //     Swal.fire({
    //       icon: "error",
    //       title: "Upload Failed",
    //       text: "Something went wrong. Please try again.",
    //     });
    //   }
    // }
  };

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

          // Try to fetch feedback form and submission status
          try {
            const feedbackRes = await axios.get(
              `${backendUrl}/api/feedback/getFeedback/${fetchedEvent._id}`
            );
            setFeedbackForm(feedbackRes.data || null);
          } catch (err) {
            // Feedback form not found - this is normal for some events
            console.log("No feedback form available for this event:", err.response?.data?.message || err.message);
            setFeedbackForm(null);
          }

          try {
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
                if (templateRes.data.success) {
                  setCertificateTemplate(templateRes.data.template);
                }
              } catch (err) {
                console.error("Error fetching certificate template:", err);
              }
            }
          } catch (err) {
            console.log("Error checking feedback submission status:", err.response?.data?.message || err.message);
            setHasSubmittedFeedback(false);
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
    setIsGeneratingCertificate(true);
    
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
        setIsGeneratingCertificate(false);
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
      setIsGeneratingCertificate(false);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "There was an issue submitting your feedback. Please try again.",
        confirmButtonText: "OK",
      });
    }
  };

  if (loading || !event) return (
    <div className="bg-gradient-to-br from-blue-50 to-white min-h-screen flex justify-center items-center">
      <div className="text-xl text-gray-600 animate-pulse">Loading...</div>
    </div>
  );

  return (
    <div className="bg-gradient-to-br from-blue-50 to-white min-h-screen">
      <Navbar />
      <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-6 sm:py-8">
        <div className="bg-white shadow-xl rounded-2xl overflow-hidden">
          <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
            {/* Event Header */}
            <div className="mb-8">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold mb-4 text-gray-800 leading-tight">
                {event.title}
              </h1>
              
              {/* Event Meta Info */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
                <div className="flex items-center gap-2 text-gray-600">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-sm sm:text-base font-medium">
                    {new Date(event.date).toLocaleDateString()} at {event.time}
                  </span>
                </div>
                
                {event.eventType?.toLowerCase() !== "webinar" && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="text-sm sm:text-base font-medium">{event.location}</span>
                  </div>
                )}
              </div>

              {/* Event Description */}
              <div className="bg-gray-50 rounded-xl p-4 sm:p-6 mb-6">
                <p className="text-sm sm:text-base text-gray-700 leading-relaxed">{event.about}</p>
              </div>

              {/* Price */}
              <div className="flex items-center justify-between bg-blue-50 rounded-xl p-4 sm:p-6">
                <span className="text-lg sm:text-xl font-semibold text-gray-700">Event Price:</span>
                <span className="text-2xl sm:text-3xl font-bold text-blue-600">₱{event.price}</span>
              </div>
            </div>

            {isPastEvent ? (
              <div className="mt-8">
                {!hasSubmittedFeedback ? (
                  <>
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 sm:p-6 mb-8">
                      <div className="flex items-center gap-3 mb-3">
                        <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                        <h2 className="text-lg sm:text-xl font-bold text-amber-800">Event Completed</h2>
                      </div>
                      <p className="text-sm sm:text-base text-amber-700">
                        This event has already passed. Please provide your feedback below to receive your certificate.
                      </p>
                    </div>
                    
                    {feedbackForm ? (
                      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-4 sm:px-6 py-4 border-b border-gray-200">
                          <h3 className="text-lg sm:text-xl font-semibold text-gray-800">Feedback Form</h3>
                          <p className="text-sm text-gray-600 mt-1">Help us improve by sharing your experience</p>
                        </div>
                        <form
                          className="p-4 sm:p-6 space-y-6"
                          onSubmit={handleFeedbackSubmit}
                        >
                          {feedbackForm.questions.map((q, index) => (
                            <div key={index} className="bg-gray-50 border border-gray-200 rounded-xl p-4 sm:p-6">
                              <label className="block text-sm sm:text-base font-semibold mb-4 text-gray-800">
                                <span className="inline-flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-600 text-xs font-bold rounded-full mr-3">
                                  {index + 1}
                                </span>
                                {q.text}
                              </label>

                        {/* Choice - Radio Buttons */}
                        {q.type === "Choice" && q.options?.length > 0 && (
                          <div className="space-y-2">
                            {q.options.map((option, i) => (
                              <label
                                key={i}
                                className="flex items-center gap-3 cursor-pointer hover:bg-gray-100 p-2 rounded transition-colors"
                              >
                                <input
                                  type="radio"
                                  name={q.text}
                                  value={option}
                                  className="w-4 h-4 text-blue-600"
                                  required
                                />
                                <span className="text-sm sm:text-base text-gray-700">{option}</span>
                              </label>
                            ))}
                          </div>
                        )}

                        {/* Text Input */}
                        {q.type === "Text" && (
                          <textarea
                            name={q.text}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                            placeholder="Your answer..."
                            rows={4}
                            required
                          />
                        )}

                        {/* Rating (1–5) */}
                        {q.type === "Rating" && (
                          <div className="flex flex-wrap gap-3 justify-center sm:justify-start">
                            {[1, 2, 3, 4, 5].map((n) => (
                              <label
                                key={n}
                                className="flex items-center justify-center gap-2 cursor-pointer hover:bg-gray-100 p-3 rounded-lg border-2 border-gray-300 hover:border-blue-500 transition-all duration-200 min-w-[60px]"
                              >
                                <input
                                  type="radio"
                                  name={q.text}
                                  value={n}
                                  className="w-4 h-4 text-blue-600 hidden"
                                  required
                                />
                                <span className="text-lg font-semibold text-gray-700">{n}</span>
                              </label>
                            ))}
                          </div>
                        )}

                        {/* Likert (Matrix Scale) */}
                        {q.type === "Likert" &&
                          q.statements?.length > 0 &&
                          q.options?.length > 0 && (
                            <div className="space-y-4">
                              {/* Mobile/Tablet View - Card Layout */}
                              <div className="block sm:hidden space-y-3">
                                {q.statements.map((stmt, sIdx) => (
                                  <div key={sIdx} className="bg-white border border-gray-200 rounded-lg p-4">
                                    <p className="text-sm font-medium text-gray-800 mb-3">{stmt}</p>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                      {q.options.map((opt, oIdx) => (
                                        <label
                                          key={oIdx}
                                          className="flex items-center justify-center gap-2 p-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-blue-50 hover:border-blue-300 transition-colors"
                                        >
                                          <input
                                            type="radio"
                                            name={`${q.text}-${sIdx}`}
                                            value={opt}
                                            className="w-4 h-4 text-blue-600"
                                            required
                                          />
                                          <span className="text-xs font-medium text-gray-700">{opt}</span>
                                        </label>
                                      ))}
                                    </div>
                                  </div>
                                ))}
                              </div>

                              {/* Tablet View - Hybrid Layout */}
                              <div className="hidden sm:block lg:hidden">
                                <div className="space-y-3">
                                  {q.statements.map((stmt, sIdx) => (
                                    <div key={sIdx} className="bg-white border border-gray-200 rounded-lg p-4">
                                      <p className="text-sm font-medium text-gray-800 mb-3">{stmt}</p>
                                      <div className="flex flex-wrap gap-2 justify-center">
                                        {q.options.map((opt, oIdx) => (
                                          <label
                                            key={oIdx}
                                            className="flex items-center justify-center gap-2 px-3 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-blue-50 hover:border-blue-300 transition-colors min-w-[80px]"
                                          >
                                            <input
                                              type="radio"
                                              name={`${q.text}-${sIdx}`}
                                              value={opt}
                                              className="w-4 h-4 text-blue-600"
                                              required
                                            />
                                            <span className="text-xs font-medium text-gray-700">{opt}</span>
                                          </label>
                                        ))}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Desktop View - Table Layout */}
                              <div className="hidden lg:block overflow-x-auto">
                                <div className="min-w-full">
                                  <table className="w-full border border-gray-300 rounded-lg overflow-hidden">
                                    <thead className="bg-gray-100">
                                      <tr>
                                        <th className="p-3 text-left font-semibold text-gray-800 min-w-[200px]">Statement</th>
                                        {q.options.map((opt, i) => (
                                          <th key={i} className="p-3 text-center font-semibold text-gray-800 border-l border-gray-300 whitespace-nowrap">
                                            {opt}
                                          </th>
                                        ))}
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {q.statements.map((stmt, sIdx) => (
                                        <tr key={sIdx} className="border-t border-gray-300 hover:bg-gray-50">
                                          <td className="p-3 text-sm text-gray-700 align-top">{stmt}</td>
                                          {q.options.map((opt, oIdx) => (
                                            <td key={oIdx} className="p-3 text-center border-l border-gray-300">
                                              <label className="cursor-pointer">
                                                <input
                                                  type="radio"
                                                  name={`${q.text}-${sIdx}`}
                                                  value={opt}
                                                  className="w-4 h-4 text-blue-600"
                                                  required
                                                />
                                              </label>
                                            </td>
                                          ))}
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            </div>
                          )}
                      </div>
                    ))}

                          <div className="flex justify-center pt-6 border-t border-gray-200">
                            <button
                              type="submit"
                              disabled={isGeneratingCertificate}
                              className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white px-8 py-3 rounded-xl font-semibold transition-all duration-300 hover:transform hover:-translate-y-1 hover:shadow-xl flex items-center justify-center gap-2"
                            >
                              {isGeneratingCertificate ? (
                                <>
                                  <svg className="animate-spin w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                  </svg>
                                  Generating Certificate...
                                </>
                              ) : (
                                <>
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                  </svg>
                                  Submit Feedback
                                </>
                              )}
                            </button>
                          </div>
                        </form>
                      </div>
                    ) : (
                      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-8 text-center">
                        <div className="animate-pulse">
                          <svg className="w-16 h-16 text-blue-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-blue-800 mb-3">Feedback Form Coming Soon</h3>
                        <p className="text-blue-700 mb-4">
                          We're preparing a feedback form for this event. Please check back later or contact the event organizers.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
                          <div className="flex items-center gap-2 text-sm text-blue-600">
                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                            <span>Waiting for feedback form</span>
                          </div>
                        </div>
                      </div>
                    )}
              </>
              ) : (
                <>
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4 sm:p-6 mb-8">
                    <div className="flex items-center gap-3 mb-3">
                      <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <h2 className="text-lg sm:text-xl font-bold text-green-800">Feedback Submitted Successfully!</h2>
                    </div>
                    <p className="text-sm sm:text-base text-green-700">
                      Thank you for your feedback! Your certificate is ready for download.
                    </p>
                  </div>
                {certificateTemplate &&
                certificateTemplate.templates &&
                certificateTemplate.templates.length > 0 ? (
                  <div className="flex flex-col lg:flex-row justify-center items-start w-full gap-6">
                    {/* Main Certificate Preview */}
                    <div className="flex-1 min-w-0 w-full">
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
                    {/* Template Thumbnails */}
                    <div className="flex flex-row lg:flex-col items-center lg:items-center gap-4 lg:gap-0 lg:ml-8 min-w-[140px]">
                      {certificateTemplate.templates.map((tpl) => {
                        // Show a PNG preview if available, else fallback to PDF icon
                        let pngUrl = tpl.url.replace(/\.pdf$/, ".png");
                        pngUrl = pngUrl.replace("/upload/", "/upload/w_120/");
                        return (
                          <div
                            key={tpl.templateId}
                            className={`flex flex-col items-center bg-white p-2 mb-4 rounded-lg shadow-md cursor-pointer transition-all duration-200 hover:shadow-lg ${
                              activeTemplateId === tpl.templateId
                                ? "ring-2 ring-blue-500 bg-blue-50"
                                : "hover:bg-gray-50"
                            }`}
                            style={{ minWidth: 100 }}
                            onClick={() => setActiveTemplateId(tpl.templateId)}
                            title={`Preview ${tpl.templateId}`}
                          >
                            <div className="mb-2 text-xs font-semibold text-gray-700">
                              {tpl.templateId}
                            </div>
                            <img
                              src={pngUrl}
                              alt={`Preview ${tpl.templateId}`}
                              className="max-w-[120px] border border-gray-300 rounded"
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
                          className="mt-2 px-3 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-sm font-medium transition-colors duration-200"
                          onClick={() => setActiveTemplateId(null)}
                        >
                          Back to Default View
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-8 text-center">
                    <div className="animate-pulse">
                      <svg className="w-16 h-16 text-purple-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-purple-800 mb-3">Generating Your Certificate</h3>
                    <p className="text-purple-700 mb-4">
                      Thank you for your feedback! We're currently generating your personalized certificate. This may take a few moments.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
                      <div className="flex items-center gap-2 text-sm text-purple-600">
                        <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                        <span>Processing certificate...</span>
                      </div>
                    </div>
                    <div className="mt-4">
                      <div className="w-full bg-purple-200 rounded-full h-2">
                        <div className="bg-purple-600 h-2 rounded-full animate-pulse" style={{width: '60%'}}></div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
            ) : (
              <div className="mt-8">
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 sm:p-6 mb-8 text-center">
                  <div className="flex items-center justify-center gap-3 mb-3">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h2 className="text-lg sm:text-xl font-bold text-green-800">Registration Confirmed</h2>
                  </div>
                  <p className="text-sm sm:text-base text-green-700">
                    You are successfully registered for this event.
                  </p>
                </div>
                {/* 🎯 Webinar vs In-person display */}
                {event.eventType?.toLowerCase() === "webinar" ? (
                  <div className="flex flex-col items-center text-center">
                    <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 sm:p-8 max-w-md w-full">
                      <div className="mb-6">
                        <svg className="w-16 h-16 text-blue-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">Webinar Access</h3>
                        <p className="text-sm text-gray-600">Click below to join the webinar</p>
                      </div>
                      <a
                        href={event.webinarLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 hover:transform hover:-translate-y-1 hover:shadow-xl flex items-center justify-center gap-2"
                        onClick={async () => {
                          try {
                            await axios.post(
                              `${backendUrl}/api/events/markAttendance/${event._id}`,
                              { userId: userData._id },
                              {
                                headers: {
                                  Authorization: `Bearer ${localStorage.getItem(
                                    "token"
                                  )}`,
                                },
                              }
                            );
                            Swal.fire({
                              icon: "success",
                              title: "Attendance Recorded",
                              text: "You have joined the webinar!",
                              timer: 2000,
                              showConfirmButton: false,
                            });
                          } catch (err) {
                            console.error("Error marking attendance:", err);
                          }
                        }}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        Join Webinar
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    {event.ticketUrl ? (
                      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 sm:p-8 text-center max-w-md w-full">
                        <div className="mb-6">
                          <svg className="w-16 h-16 text-green-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                          </svg>
                          <h3 className="text-lg font-semibold text-gray-800 mb-2">Your Event Ticket</h3>
                          <p className="text-sm text-gray-600 mb-4">Present this QR code at the event entrance</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-4">
                          <img
                            src={event.ticketUrl}
                            alt="Your Ticket / QR Code"
                            className="w-48 h-48 sm:w-56 sm:h-56 mx-auto object-contain"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="bg-white border border-red-200 rounded-xl shadow-sm p-6 sm:p-8 text-center max-w-md w-full">
                        <div className="mb-6">
                          <svg className="w-16 h-16 text-red-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                          </svg>
                          <h3 className="text-lg font-semibold text-red-800 mb-2">Ticket Not Available</h3>
                          <p className="text-sm text-red-600 mb-4">
                            Ticket request was rejected or not generated.
                          </p>
                        </div>
                        <button
                          onClick={handleResendTicket}
                          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 hover:transform hover:-translate-y-1 hover:shadow-xl flex items-center justify-center gap-2"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                          </svg>
                          Resend Ticket Request
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisteredEventDetail;
