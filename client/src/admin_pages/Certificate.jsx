import React, { useContext, useState, useEffect } from "react";
import { assets } from "../assets/assets";
import Sidebar from "../admin_components/Sidebar";
import { useNavigate } from "react-router-dom";
import { AppContent } from "../context/AppContext";
import axios from "axios";
import html2pdf from "html2pdf.js";
import ReactDOM from "react-dom/client";

// Separate component for PDF template
const CertificateTemplate = ({ event, organizers }) => (
  <div className="certificate-template relative bg-white rounded-2xl shadow-xl flex flex-col items-center border-0"
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
    <div className="relative z-10 flex flex-col items-center w-full px-12 py-10">
      <h2 className="text-4xl font-serif font-bold text-blue-900 tracking-wider mb-2">CERTIFICATE</h2>
      <div className="text-xl font-serif text-blue-900 tracking-widest mb-4">OF ACHIEVEMENT</div>
      <div className="text-base font-medium text-gray-700 mb-2 mt-2 tracking-wide">THIS CERTIFICATE IS PROUDLY PRESENTED TO</div>
      <div className="text-4xl font-signature text-blue-900 mb-2 mt-2" style={{ fontFamily: 'cursive, Pacifico, Arial' }}>[Recipient Name]</div>
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
);

const Certificate = () => {
  const navigate = useNavigate();
  const { userData, backendUrl } = useContext(AppContent);
  const [registeredEvents, setRegisteredEvents] = useState([]);
  const [signature, setSignature] = useState(null);
  const [organizers, setOrganizers] = useState([
    { name: "Organizer Name", label: "Organizer", signature: null }
  ]);
  const [editing, setEditing] = useState(false);
  const [allEvents, setAllEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState("");
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [saving, setSaving] = useState(false);
  const [template, setTemplate] = useState(null);

  useEffect(() => {
    const fetchRegisteredEvents = async () => {
      if (!userData?._id && !userData?.id) return;
      try {
        const res = await axios.get(`${backendUrl}/api/events/registered`);
        setRegisteredEvents(res.data.events || []);
      } catch (err) {
        setRegisteredEvents([]);
      }
    };
    fetchRegisteredEvents();
  }, [userData, backendUrl]);

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
      const found = allEvents.find(e => e._id === selectedEventId);
      setSelectedEvent(found || null);
    } else {
      setSelectedEvent(null);
    }
  }, [selectedEventId, allEvents]);

  useEffect(() => {
    if (selectedEvent) {
      setOrganizers(selectedEvent.organizers && selectedEvent.organizers.length > 0
        ? selectedEvent.organizers.map(o => ({ ...o }))
        : [{ name: "Organizer Name", label: "Organizer", signature: null }]);
    }
  }, [selectedEvent]);

  useEffect(() => {
    const fetchTemplate = async () => {
      if (!selectedEventId) {
        setTemplate(null);
        return;
      }
      try {
        const res = await axios.get(`${backendUrl}/api/certificate/template/${selectedEventId}`);
        if (res.data.success && res.data.template) {
          setTemplate(res.data.template);
          // Update organizers from template
          setOrganizers(res.data.template.organizers || [
            { name: "Organizer Name", label: "Organizer", signature: null }
          ]);
        }
      } catch (err) {
        console.error("Failed to fetch template:", err);
        // Reset to default organizers if no template found
        setOrganizers([{ name: "Organizer Name", label: "Organizer", signature: null }]);
      }
    };
    fetchTemplate();
  }, [selectedEventId, backendUrl]);

  const handleSignatureChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSignature(URL.createObjectURL(file));
    }
  };

  const handleOrganizerChange = (idx, field, value) => {
    setOrganizers(orgs => orgs.map((org, i) => i === idx ? { ...org, [field]: value } : org));
  };

  const handleOrganizerSignature = async (idx, file) => {
    if (file) {
      // Create a temporary URL for preview
      const previewUrl = URL.createObjectURL(file);
      setOrganizers(orgs => orgs.map((org, i) => i === idx ? { ...org, signature: previewUrl, signatureFile: file } : org));
    }
  };

  const addOrganizer = () => {
    setOrganizers(orgs => [...orgs, { name: "Organizer Name", label: "Organizer", signature: null }]);
  };

  const removeOrganizer = (idx) => {
    setOrganizers(orgs => orgs.filter((_, i) => i !== idx));
  };

  const handleSaveOrganizers = async () => {
    setSaving(true);
    try {
      console.log("Starting save process...");
      // First, upload all signature images
      const updatedOrganizers = await Promise.all(organizers.map(async (org) => {
        if (org.signatureFile) {
          const formData = new FormData();
          formData.append('file', org.signatureFile);
          
          // Upload signature image
          const uploadRes = await axios.post(`${backendUrl}/api/certificate/upload-signature`, formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            }
          });
          if (uploadRes.data.url) {
            return {
              name: org.name,
              label: org.label,
              signature: uploadRes.data.url
            };
          }
        }
        return {
          name: org.name,
          label: org.label,
          signature: org.signature
        };
      }));

      console.log("Organizers updated:", updatedOrganizers);

      // Create a temporary container for the template
      const tempContainer = document.createElement('div');
      tempContainer.style.position = 'absolute';
      tempContainer.style.left = '-9999px';
      document.body.appendChild(tempContainer);

      // Render the template component
      const root = ReactDOM.createRoot(tempContainer);
      root.render(
        <CertificateTemplate 
          event={selectedEvent} 
          organizers={updatedOrganizers} 
        />
      );

      // Wait for the template to render
      await new Promise(resolve => setTimeout(resolve, 100));

      console.log("Generating PDF template...");
      const opt = {
        margin: 0,
        filename: `${selectedEvent.title}-template.pdf`,
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

      // Generate PDF template
      const pdfBlob = await html2pdf()
        .set(opt)
        .from(tempContainer.querySelector('.certificate-template'))
        .outputPdf('blob');

      // Clean up
      root.unmount();
      document.body.removeChild(tempContainer);

      const formData = new FormData();
      formData.append('file', new File([pdfBlob], `${selectedEvent.title}-template.pdf`, { type: 'application/pdf' }));

      console.log("Uploading template PDF...");
      // Upload template PDF using the new endpoint
      const uploadRes = await axios.post(`${backendUrl}/api/certificate/upload-template`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      console.log("Template PDF upload response:", uploadRes.data);
      
      if (uploadRes.data.url) {
        console.log("Saving template to database...");
        // Save template information to database
        const saveRes = await axios.post(`${backendUrl}/api/certificate/save-template`, {
          eventId: selectedEvent._id,
          templateUrl: uploadRes.data.url,
          organizers: updatedOrganizers
        }, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        console.log("Save template response:", saveRes.data);
        
        if (saveRes.data.success) {
          setTemplate(saveRes.data.template);
        }
      }

      // Update local state with the saved organizers
      setOrganizers(updatedOrganizers);
      setEditing(false);
      
      alert("Certificate template saved successfully!");
    } catch (err) {
      console.error("Failed to save certificate template:", err);
      console.error("Error details:", err.response?.data || err.message);
      alert("Failed to save certificate template. Please try again.");
    }
    setSaving(false);
  };

  // Clean up temporary URLs when component unmounts
  useEffect(() => {
    return () => {
      organizers.forEach(org => {
        if (org.signature && org.signature.startsWith('blob:')) {
          URL.revokeObjectURL(org.signature);
        }
      });
    };
  }, [organizers]);

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />

      {/* Push content to the right because Sidebar is fixed */}
      <div className="flex flex-col flex-1 ml-64">
        <main className="p-6">
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
                <p className="text-lg font-semibold text-gray-800">{userData.fullName}</p>
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
              onChange={e => setSelectedEventId(e.target.value)}
            >
              <option value="">-- Select an Event --</option>
              {allEvents.map(ev => (
                <option key={ev._id} value={ev._id}>{ev.title} ({new Date(ev.date).toLocaleDateString()})</option>
              ))}
            </select>
            <button
              className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700"
              onClick={() => setEditing((e) => !e)}
            >
              {editing ? "Done Editing" : "Edit Certificate Details"}
            </button>
            
          </div>

          {selectedEvent && (
            <div className="flex justify-center">
              <div
                className="certificate relative bg-white rounded-2xl shadow-xl flex flex-col items-center border-0 print:bg-white print:shadow-none"
                style={{ minWidth: 700, minHeight: 500, padding: 0, overflow: 'hidden' }}
              >
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
                  <div className="text-4xl font-signature text-blue-900 mb-2 mt-2" style={{ fontFamily: 'cursive, Pacifico, Arial' }}>[Recipient Name]</div>
                  <div className="text-base text-gray-700 mb-4 text-center max-w-2xl">For outstanding participation in <span className="font-semibold text-blue-800">{selectedEvent.title}</span> held on <span className="font-semibold text-blue-800">{new Date(selectedEvent.date).toLocaleDateString()}</span>. We recognize your dedication and achievement.</div>
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
                        {editing && (
                          <>
                            <input
                              type="text"
                              value={org.name}
                              onChange={(e) => handleOrganizerChange(idx, 'name', e.target.value)}
                              className="border-b-2 border-blue-200 text-center text-lg font-signature mb-1 w-40"
                              style={{ fontFamily: 'cursive, Pacifico, Arial' }}
                            />
                            <input
                              type="text"
                              value={org.label}
                              onChange={(e) => handleOrganizerChange(idx, 'label', e.target.value)}
                              className="border-b border-gray-300 text-center text-xs mb-1 w-32"
                            />
                            <div className="flex flex-col items-center">
                              <label className="text-sm text-gray-600 mb-1">
                                Upload Signature Image
                              </label>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleOrganizerSignature(idx, e.target.files[0])}
                                className="border px-3 py-2 rounded text-sm"
                                title="Upload a signature image (PNG, JPG, or GIF)"
                              />
                              <p className="text-xs text-gray-500 mt-1">Recommended: Transparent PNG with signature</p>
                              {organizers.length > 1 && (
                                <button className="text-xs text-red-500 hover:underline mb-2" onClick={() => removeOrganizer(idx)}>Remove</button>
                              )}
                            </div>
                          </>
                        )}
                        {!editing && org.signature && (
                          <img src={org.signature} alt="Signature" className="h-10 object-contain mb-1" />
                        )}
                        <span className="font-signature text-xl text-blue-900 mb-1" style={{ fontFamily: 'cursive, Pacifico, Arial' }}>{org.name}</span>
                        <span className="text-xs text-gray-500 uppercase tracking-widest">{org.label}</span>
                      </div>
                    ))}
                  </div>
                  {editing && (
                    <button
                      className="mt-6 bg-yellow-500 text-white px-4 py-2 rounded shadow hover:bg-yellow-600"
                      onClick={addOrganizer}
                    >
                      + Add Person
                    </button>
                  )}
                  {editing && (
                    <div className="absolute top-4 right-4 flex gap-2 print:hidden">
                      <button
                        className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 disabled:opacity-50"
                        onClick={handleSaveOrganizers}
                        disabled={saving}
                      >
                        {saving ? "Saving..." : "Save Template"}
                      </button>
                      <button
                        className="bg-gray-200 text-gray-700 px-4 py-2 rounded shadow hover:bg-gray-300"
                        onClick={() => window.print()}
                      >
                        Print Preview
                      </button>
                    </div>
                  )}
                  <button
                    className="absolute top-4 right-4 bg-gray-200 text-gray-700 px-2 py-1 rounded text-xs hover:bg-gray-300 print:hidden"
                    onClick={() => window.print()}
                  >
                    Print
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Certificate;
