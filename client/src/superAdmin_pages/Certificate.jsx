import React, { useContext, useState, useEffect } from "react";
import { assets } from "../assets/assets";
import Sidebar from "../superAdmin_components/Sidebar";
import { useNavigate } from "react-router-dom";
import { AppContent } from "../context/AppContext";
import axios from "axios";
import html2pdf from "html2pdf.js";
import ReactDOM from "react-dom/client";
import Swal from "sweetalert2";
import certificateTemplates from "../admin_components/CertificateTemplates";

// Import your JRX templates
import GoldTemplate from "../admin_components/CertificateTemplates/GoldTemplate";
import MaroonCertificate from "../admin_components/CertificateTemplates/MaroonCertificate";
import RoyalBlueTemplate from "../admin_components/CertificateTemplates/RoyalBlueTemplate";
import ElegantGreenTemplate from "../admin_components/CertificateTemplates/ElegantGreenTemplate";

// Map template IDs to components
const templateMap = {
  gold: GoldTemplate,
  maroon: MaroonCertificate,
  royalblue: RoyalBlueTemplate,
  elegantgreen: ElegantGreenTemplate,
};

const templateOptions = [
  { id: "gold", name: "Gold" },
  { id: "maroon", name: "Maroon" },
  { id: "royalblue", name: "Royal Blue" },
  { id: "elegantgreen", name: "Elegant Green" },
];

const Certificate = () => {
  const navigate = useNavigate();
  const { userData, backendUrl, isAdmin } = useContext(AppContent);
  const [organizers, setOrganizers] = useState([
    { name: "Organizer Name", label: "Organizer", signature: null },
  ]);
  const [editing, setEditing] = useState(false);
  const [allEvents, setAllEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState("");
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [saving, setSaving] = useState(false);
  const [templateId, setTemplateId] = useState("gold");
  const [templatePreviews, setTemplatePreviews] = useState([]);
  const [activePreviewId, setActivePreviewId] = useState(null);

  // For PDF generation
  const certificateRef = React.useRef();

  useEffect(() => {
        if (!isAdmin) {
          // Not an admin, redirect to home or another page
          navigate("/admin");
        }
      }, [isAdmin, navigate]);

  useEffect(() => {
    const fetchTemplatePreview = async () => {
      if (!selectedEventId) {
        setTemplatePreviews([]);
        return;
      }
      try {
        const res = await axios.get(
          `${backendUrl}/api/certificate/template/${selectedEventId}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        if (res.data.success && res.data.template.templates) {
          setTemplatePreviews(res.data.template.templates);
        } else {
          setTemplatePreviews([]);
        }
      } catch {
        setTemplatePreviews([]);
      }
    };
    fetchTemplatePreview();
  }, [selectedEventId, backendUrl]);

  useEffect(() => {
    const fetchAllEvents = async () => {
      try {
        const res = await axios.get(`${backendUrl}/api/events`);
        if (res.data.success) setAllEvents(res.data.events || []);
        else setAllEvents([]);
      } catch {
        setAllEvents([]);
      }
    };
    fetchAllEvents();
  }, [backendUrl]);

  useEffect(() => {
    if (selectedEventId) {
      const found = allEvents.find((e) => e._id === selectedEventId);
      setSelectedEvent(found || null);
    } else {
      setSelectedEvent(null);
    }
  }, [selectedEventId, allEvents]);

  useEffect(() => {
    if (selectedEvent) {
      setOrganizers(
        selectedEvent.organizers && selectedEvent.organizers.length > 0
          ? selectedEvent.organizers.map((o) => ({ ...o }))
          : [{ name: "Organizer Name", label: "Organizer", signature: null }]
      );
    }
  }, [selectedEvent]);

  const handleOrganizerChange = (idx, field, value) => {
    setOrganizers((orgs) =>
      orgs.map((org, i) => (i === idx ? { ...org, [field]: value } : org))
    );
  };

  const handleOrganizerSignature = (idx, file) => {
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setOrganizers((orgs) =>
        orgs.map((org, i) =>
          i === idx
            ? { ...org, signature: previewUrl, signatureFile: file }
            : org
        )
      );
    }
  };

  const addOrganizer = () => {
    setOrganizers((orgs) => [
      ...orgs,
      { name: "Organizer Name", label: "Organizer", signature: null },
    ]);
  };

  const removeOrganizer = (idx) => {
    setOrganizers((orgs) => orgs.filter((_, i) => i !== idx));
  };

  const handleSaveOrganizers = async () => {
    setSaving(true);
    try {
      // Upload all signature images to Cloudinary
      const updatedOrganizers = await Promise.all(
        organizers.map(async (org) => {
          let signatureUrl = org.signature;
          if (org.signatureFile) {
            const formData = new FormData();
            formData.append("file", org.signatureFile);
            formData.append("upload_preset", "event_preset");
            try {
              const uploadRes = await axios.post(
                "https://api.cloudinary.com/v1_1/dqbnc38or/image/upload",
                formData,
                { withCredentials: false }
              );
              signatureUrl = uploadRes.data.secure_url;
            } catch (uploadError) {
              console.error("Error uploading signature:", uploadError);
            }
          }
          return {
            name: org.name,
            label: org.label,
            signature: signatureUrl,
          };
        })
      );
      const templates = [];
      for (const tpl of certificateTemplates) {
        // Render the template to a hidden container
        const tempContainer = document.createElement("div");
        tempContainer.style.position = "absolute";
        tempContainer.style.left = "-9999px";
        document.body.appendChild(tempContainer);

        const TemplateComponent = tpl.component;
        const root = ReactDOM.createRoot(tempContainer);
        root.render(
          <TemplateComponent
            event={selectedEvent}
            organizers={updatedOrganizers}
            editing={false}
          />
        );

        // Wait for render
        await new Promise((resolve) => setTimeout(resolve, 100));

        // Generate PDF
        const opt = {
          margin: 0,
          filename: `${selectedEvent.title}-${tpl.id}.pdf`,
          image: { type: "jpeg", quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true, logging: false },
          jsPDF: { unit: "in", format: "letter", orientation: "landscape" },
        };

        const pdfBlob = await html2pdf()
          .set(opt)
          .from(tempContainer.querySelector("div"))
          .outputPdf("blob");

        root.unmount();
        document.body.removeChild(tempContainer);

        // Upload PDF to Cloudinary
        const pdfFormData = new FormData();
        pdfFormData.append(
          "file",
          new File([pdfBlob], `${selectedEvent.title}-${tpl.id}.pdf`, {
            type: "application/pdf",
          })
        );
        pdfFormData.append("upload_preset", "certificate_preset");
        const uploadRes = await axios.post(
          "https://api.cloudinary.com/v1_1/dqbnc38or/auto/upload",
          pdfFormData,
          { withCredentials: false }
        );

        templates.push({
          templateId: tpl.id,
          url: uploadRes.data.secure_url,
        });
      }
      // Save organizers and signature links to backend
      await axios.post(
        `${backendUrl}/api/certificate/save-template`,
        {
          eventId: selectedEvent._id,
          organizers: updatedOrganizers,
          templates,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      setOrganizers(
        updatedOrganizers.map((org) => ({ ...org, signatureFile: undefined }))
      );
      setEditing(false);

      Swal.fire({
        icon: "success",
        title: "Success!",
        text: "Organizers and signatures saved!",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to save organizers. Please try again.",
        confirmButtonText: "OK",
      });
    }
    setSaving(false);
  };

  // Clean up temporary URLs when component unmounts
  useEffect(() => {
    return () => {
      organizers.forEach((org) => {
        if (org.signature && org.signature.startsWith("blob:")) {
          URL.revokeObjectURL(org.signature);
        }
      });
    };
  }, [organizers]);

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      <div className="flex flex-row flex-1 ml-64">
        <main className="p-6 flex-1">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">Certificate</h1>
            {userData ? (
              <div className="flex items-center gap-4 bg-white px-4 py-2 rounded-lg shadow-sm">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="text-blue-600 font-semibold text-lg">
                    {userData.fullName.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex flex-col">
                  <p className="text-sm text-gray-500">Welcome back,</p>
                  <p className="text-lg font-semibold text-gray-800">
                    {userData.fullName}
                  </p>
                </div>
              </div>
            ) : (
              <button
                onClick={() => navigate("/")}
                className="flex items-center gap-2 border border-gray-500 rounded-full px-6 py-2 text-gray-800 hover:bg-gray-100 transition-all"
              >
                Login <img src={assets.arrow_icon} alt="" />
              </button>
            )}
          </div>
          <div className="mb-6 flex gap-4 items-center">
            <label className="font-semibold">Select Event:</label>
            <select
              className="border px-3 py-2 rounded min-w-[220px]"
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
            >
              <option value="">-- Select an Event --</option>
              {allEvents
                .filter((ev) => new Date(ev.date) >= new Date())
                .map((ev) => (
                  <option key={ev._id} value={ev._id}>
                    {ev.title} ({new Date(ev.date).toLocaleDateString()})
                  </option>
                ))}
            </select>

            <label className="font-semibold ml-4">Template:</label>
            <select
              className="border px-3 py-2 rounded min-w-[180px]"
              value={templateId}
              onChange={(e) => setTemplateId(e.target.value)}
              disabled={!editing}
            >
              {templateOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.name}
                </option>
              ))}
            </select>
            <button
              className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700"
              onClick={() => setEditing((e) => !e)}
            >
              {editing ? "Done Editing" : "Edit Certificate Details"}
            </button>
          </div>

          {editing && (
            <div className="mb-4 flex">
              <button
                className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 disabled:opacity-50"
                onClick={handleSaveOrganizers}
                disabled={saving}
              >
                {saving ? "Saving..." : "Save Template"}
              </button>
            </div>
          )}

          {selectedEvent && (
            <div className="flex flex-row justify-center items-start w-full">
              {/* Certificate Preview */}
              <div
                className="certificate relative bg-white rounded-2xl shadow-xl flex flex-col items-center border-0 print:bg-white print:shadow-none"
                style={{
                  width: 1056,
                  height: 816,
                  padding: 0,
                  overflow: "auto",
                  border: "4px solid #000",
                  boxSizing: "content-box",
                  display: "block",
                  background: "#fff",
                  maxWidth: "100%",
                  maxHeight: "80vh",
                }}
              >
                {(() => {
                  // If a preview is selected, show it as an image
                  if (activePreviewId) {
                    const tpl = templatePreviews.find(
                      (t) => t.templateId === activePreviewId
                    );
                    if (tpl) {
                      let pngUrl = tpl.url.replace(/\.pdf$/, ".png");
                      pngUrl = pngUrl.replace(
                        "/upload/",
                        "/upload/w_1056,h_816/"
                      );
                      return (
                        <img
                          src={pngUrl}
                          alt={`Preview ${tpl.templateId}`}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "contain",
                            borderRadius: "1rem",
                          }}
                          onClick={() => setActivePreviewId(null)}
                          title="Click to return to editable view"
                        />
                      );
                    }
                  }
                  // Otherwise, show the editable template
                  const TemplateComponent =
                    templateMap[templateId] || GoldTemplate;
                  return (
                    <TemplateComponent
                      ref={certificateRef}
                      event={selectedEvent}
                      organizers={organizers}
                      editing={editing}
                      handleOrganizerChange={handleOrganizerChange}
                      handleOrganizerSignature={handleOrganizerSignature}
                      addOrganizer={addOrganizer}
                      removeOrganizer={removeOrganizer}
                    />
                  );
                })()}
              </div>
              {/* Template Previews Inline (Right Side) */}
              {templatePreviews.length > 0 && (
                <div
                  className="flex flex-col items-center ml-8"
                  style={{ minWidth: 140 }}
                >
                  {templatePreviews.map((tpl) => {
                    let pngUrl = tpl.url.replace(/\.pdf$/, ".png");
                    pngUrl = pngUrl.replace("/upload/", "/upload/w_120/");
                    return (
                      <div
                        key={tpl.templateId}
                        className={`flex flex-col items-center bg-white p-2 mb-4 rounded shadow cursor-pointer ${
                          activePreviewId === tpl.templateId
                            ? "ring-2 ring-blue-500"
                            : ""
                        }`}
                        style={{ minWidth: 100 }}
                        onClick={() => setActivePreviewId(tpl.templateId)}
                        title="Click to preview"
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
                        />
                      </div>
                    );
                  })}
                  {activePreviewId && (
                    <button
                      className="mt-2 px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 text-sm"
                      onClick={() => setActivePreviewId(null)}
                    >
                      Back to Edit View
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Certificate;
