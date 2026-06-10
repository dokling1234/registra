import React, { useContext, useState, useEffect } from "react";
import { assets } from "../assets/assets";
import Sidebar from "../admin_components/Sidebar";
import { Menu } from "lucide-react";
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const certificateRef = React.useRef();

  // redirect non-admins
  useEffect(() => {
    if (!isAdmin) navigate("/admin");
  }, [isAdmin, navigate]);

  // fetch template previews
  useEffect(() => {
    const fetchTemplatePreview = async () => {
      if (!selectedEventId) return setTemplatePreviews([]);
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

  // fetch events
  useEffect(() => {
    const fetchAllEvents = async () => {
      try {
        const res = await axios.get(`${backendUrl}/api/events`);
        if (res.data.success) setAllEvents(res.data.events || []);
      } catch {
        setAllEvents([]);
      }
    };
    fetchAllEvents();
  }, [backendUrl]);

  // select event
  useEffect(() => {
    if (selectedEventId) {
      const found = allEvents.find((e) => e._id === selectedEventId);
      setSelectedEvent(found || null);
    } else setSelectedEvent(null);
  }, [selectedEventId, allEvents]);

  // update organizers
  useEffect(() => {
    if (selectedEvent) {
      setOrganizers(
        selectedEvent.organizers?.length
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
    if (!file) return;
    const previewUrl = URL.createObjectURL(file);
    setOrganizers((orgs) =>
      orgs.map((org, i) =>
        i === idx ? { ...org, signature: previewUrl, signatureFile: file } : org
      )
    );
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
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      {/* Main Content */}
      <div className="flex flex-col flex-1 xl:ml-64 transition-all duration-300">
        {/* Mobile Header */}
        <div className="bg-gray-900 text-white flex items-center justify-between p-4 shadow-md xl:hidden sticky top-0 z-50">
          <button onClick={() => setIsSidebarOpen(true)}>
            <Menu size={24} />
          </button>
          <h1 className="text-lg font-semibold">Certificate</h1>
          <div className="w-6" />
        </div>

        <main className="p-4 sm:p-6 flex-1">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
            <div className="hidden xl:block">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                Certificate
              </h1>
            </div>

            {userData ? (
              <div className="flex items-center gap-3 bg-white px-3 py-2 rounded-lg shadow-sm w-full sm:w-auto justify-center sm:justify-end">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="text-blue-600 font-semibold text-base sm:text-lg">
                    {userData.fullName.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex flex-col items-center sm:items-start">
                  <p className="text-xs sm:text-sm text-gray-500">
                    Welcome back,
                  </p>
                  <p className="text-sm sm:text-lg font-semibold text-gray-800">
                    {userData.fullName}
                  </p>
                </div>
              </div>
            ) : (
              <button
                onClick={() => navigate("/admin")}
                className="flex items-center gap-2 border border-gray-500 rounded-full px-4 py-2 sm:px-6 text-gray-800 hover:bg-gray-100 transition-all text-sm sm:text-base justify-center"
              >
                Login <img src={assets.arrow_icon} alt="" />
              </button>
            )}
          </div>

          {/* Event & Template Select */}
          <div className="mb-6 flex flex-col sm:flex-row gap-3 sm:gap-4 items-start sm:items-center w-full">
            <label className="font-semibold">Select Event:</label>
            <select
              className="border px-3 py-2 rounded min-w-[220px] w-full sm:w-auto"
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
            >
              <option value="">-- Select an Event --</option>
              {allEvents.map((ev) => (
                <option key={ev._id} value={ev._id}>
                  {ev.title} ({new Date(ev.date).toLocaleDateString()})
                </option>
              ))}
            </select>

            <label className="font-semibold sm:ml-4">Template:</label>
            <select
              className="border px-3 py-2 rounded min-w-[180px] w-full sm:w-auto"
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
            <div className="mb-4">
              <button
                className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 disabled:opacity-50"
                onClick={handleSaveOrganizers}
                disabled={saving}
              >
                {saving ? "Saving..." : "Save Template"}
              </button>
            </div>
          )}

          {/* Certificate Preview */}
          {selectedEvent && (
            <div className="flex flex-col lg:flex-row justify-center items-start w-full">
              <div
                className="certificate relative bg-white rounded-2xl shadow-xl flex flex-col items-center border-0 print:bg-white print:shadow-none
    w-full sm:w-[95%] md:w-[85%] lg:w-[1056px] transition-all duration-300"
                style={{
                  aspectRatio: window.innerWidth < 768 ? "3/4" : "4/3",
                  overflow: "auto",
                  background: "#fff",
                }}
              >
                {(() => {
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
                          className="w-full h-full object-contain rounded-2xl"
                          onClick={() => setActivePreviewId(null)}
                          title="Click to return to editable view"
                        />
                      );
                    }
                  }

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

              {/* Template previews side */}
              {templatePreviews.length > 0 && (
                <div className="flex flex-wrap justify-center lg:flex-col items-center gap-4 w-full lg:w-auto mt-4 lg:mt-0">
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
                        onClick={() => setActivePreviewId(tpl.templateId)}
                      >
                        <div className="mb-1 text-xs font-semibold">
                          {tpl.templateId}
                        </div>
                        <img
                          src={pngUrl}
                          alt={`Preview ${tpl.templateId}`}
                          className="max-w-[150px] border border-gray-300 rounded"
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
         {/* 📱 Floating Mobile Edit Button */}
         {!editing && (
          <button
            className="fixed bottom-6 right-6 bg-blue-600 text-white rounded-full p-4 shadow-lg xl:hidden z-50"
            onClick={() => setEditing(true)}
          >
            ✏️
          </button>
        )}
      </div>
    </div>
  );
};

export default Certificate;
