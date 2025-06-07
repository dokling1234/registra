import { useContext, useState, useEffect } from "react";
import { assets } from "../assets/assets";
import Sidebar from "../admin_components/Sidebar";
import { useNavigate } from "react-router-dom";
import { AppContent } from "../context/AppContext";
import axios from "axios";
import { certificateTemplates } from "../admin_components/CertificateTemplates";

const Certificate = () => {
  const navigate = useNavigate();
  const { userData, backendUrl } = useContext(AppContent);
  const [registeredEvents, setRegisteredEvents] = useState([]);
  const [organizers, setOrganizers] = useState([
    { name: "Organizer Name", label: "Organizer", signature: null },
  ]);
  const [editing, setEditing] = useState(false);
  const [allEvents, setAllEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState("");
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [saving, setSaving] = useState(false);
  const [template, setTemplate] = useState(null);

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

  useEffect(() => {
    const fetchTemplate = async () => {
      if (!selectedEventId) {
        setTemplate(null);
        return;
      }
      try {
        const res = await axios.get(
          `${backendUrl}/api/certificate/template/${selectedEventId}`
        );
        if (res.data.success && res.data.template) {
          setTemplate(res.data.template);
          setOrganizers(
            res.data.template.organizers || [
              { name: "Organizer Name", label: "Organizer", signature: null },
            ]
          );
        }
      } catch (err) {
        setOrganizers([
          { name: "Organizer Name", label: "Organizer", signature: null },
        ]);
      }
    };
    fetchTemplate();
  }, [selectedEventId, backendUrl]);

  const handleTemplateChange = (e) => {
    const selectedId = e.target.value;
    const found = certificateTemplates.find((t) => t.id === selectedId);
    setTemplate(found ? { ...template, templateId: found.id } : null);
  };

  const handleOrganizerChange = (idx, field, value) => {
    setOrganizers((orgs) =>
      orgs.map((org, i) => (i === idx ? { ...org, [field]: value } : org))
    );
  };

  const handleOrganizerSignature = async (idx, file) => {
    if (file) {
      const toBase64 = (file) =>
        new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      const base64 = await toBase64(file);
      setOrganizers((orgs) =>
        orgs.map((org, i) =>
          i === idx
            ? { ...org, signature: base64, signatureFile: file }
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
      // Convert signature files to base64 if needed
      const updatedOrganizers = await Promise.all(
        organizers.map(async (org) => {
          if (org.signatureFile) {
            const toBase64 = (file) =>
              new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsDataURL(file);
              });
            const base64 = await toBase64(org.signatureFile);
            return {
              name: org.name,
              label: org.label,
              signature: base64,
            };
          }
          return { name: org.name, label: org.label, signature: org.signature };
        })
      );

      // Save organizers to backend (no PDF, no Cloudinary)
      await axios.post(
        `${backendUrl}/api/certificate/save-template`,
        {
          eventId: selectedEvent._id,
          organizers: updatedOrganizers,
          templateId: template?.templateId || certificateTemplates[0].id,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      setOrganizers(updatedOrganizers);
      setEditing(false);
      alert("Certificate template saved successfully!");
    } catch (err) {
      alert("Failed to save certificate template. Please try again.");
    }
    setSaving(false);
  };

  useEffect(() => {
    return () => {
      organizers.forEach((org) => {
        if (org.signature && org.signature.startsWith("blob:")) {
          URL.revokeObjectURL(org.signature);
        }
      });
    };
  }, [organizers]);

  const SelectedTemplate = template
    ? certificateTemplates.find((t) => t.id === template.templateId)?.component
    : certificateTemplates[0].component;

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      <div className="flex flex-col flex-1 ml-64">
        <main className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">Certificate</h1>
            <div className="flex items-center gap-4 bg-white px-4 py-2 rounded-lg shadow-sm">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="text-blue-600 font-semibold text-lg">
                  {userData?.fullName?.charAt(0)?.toUpperCase() || ""}
                </span>
              </div>
              <div className="flex flex-col">
                <p className="text-sm text-gray-500">Welcome back,</p>
                <p className="text-lg font-semibold text-gray-800">
                  {userData.fullName}
                </p>
              </div>
            </div>
          </div>

          <div className="mb-6 flex gap-4 items-center">
            <label className="font-semibold">Select Event:</label>
            <select
              className="border px-3 py-2 rounded min-w-[220px]"
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
            <button
              className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700"
              onClick={() => setEditing((e) => !e)}
            >
              {editing ? "Done Editing" : "Edit Certificate Details"}
            </button>
          </div>

          {/* Template selection dropdown */}
          <div className="mb-2 flex gap-4 items-center">
            <label className="font-semibold">Select Template:</label>
            <select
              className="border px-3 py-2 rounded min-w-[220px]"
              value={template?.templateId || certificateTemplates[0].id}
              onChange={handleTemplateChange}
              disabled={!editing}
            >
              {certificateTemplates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          {/* Save button below template select, left-aligned */}
          {editing && (
            <div className="mb-6 flex">
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
            <div className="flex justify-center">
              <div
                className="certificate relative bg-white rounded-2xl shadow-xl flex flex-col items-center border-0 print:bg-white print:shadow-none"
                style={{
                  minWidth: 700,
                  minHeight: 500,
                  padding: 0,
                  overflow: "hidden",
                }}
              >
                {/* Render the selected template */}
                <SelectedTemplate
                  event={selectedEvent}
                  organizers={organizers}
                  editing={editing}
                  handleOrganizerChange={handleOrganizerChange}
                  handleOrganizerSignature={handleOrganizerSignature}
                  addOrganizer={addOrganizer}
                  removeOrganizer={removeOrganizer}
                />
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Certificate;