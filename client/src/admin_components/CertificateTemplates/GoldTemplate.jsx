import React from "react";

const ModernGoldTemplate = ({
  event,
  organizers,
  editing,
  handleOrganizerChange,
  handleOrganizerSignature,
  addOrganizer,
  removeOrganizer,
}) => (
  <div className="certificate-template relative bg-white rounded-2xl shadow-xl flex flex-col items-center border-0"
    style={{ minWidth: 700, minHeight: 500, padding: 0, overflow: 'hidden' }}>
    <div style={{
      position: 'absolute',
      inset: 0,
      background: 'linear-gradient(135deg, #002147 0%, #FFD700 100%)',
      borderRadius: '1.25rem',
      padding: '8px',
      zIndex: 0
    }} />
    <div style={{
      position: 'absolute',
      inset: 12,
      background: 'white',
      borderRadius: '1rem',
      zIndex: 1
    }} />
    <div className="relative z-10 flex flex-col items-center w-full px-12 py-10">
      <h2 className="text-4xl font-serif font-bold text-blue-900 tracking-wider mb-2">CERTIFICATE</h2>
      <div className="text-xl font-serif text-blue-900 tracking-widest mb-4">OF ACHIEVEMENT</div>
      <div className="text-base font-medium text-gray-700 mb-2 mt-2">THIS CERTIFICATE IS PROUDLY PRESENTED TO</div>
      <div className="text-4xl text-blue-900 mb-2" style={{ fontFamily: 'cursive, Pacifico, Arial' }}>[Recipient Name]</div>
      <div className="text-base text-gray-700 mb-4 text-center max-w-2xl">
        For outstanding participation in <span className="font-semibold text-blue-800">{event.title}</span> held on <span className="font-semibold text-blue-800">{new Date(event.date).toLocaleDateString()}</span>.
      </div>
      <div className="flex justify-center items-center my-6">
        <div className="rounded-full border-4 border-yellow-400 bg-gradient-to-br from-yellow-200 to-yellow-500 w-20 h-20 flex items-center justify-center shadow-lg">
          <span className="text-3xl font-bold text-yellow-700">★</span>
        </div>
      </div>
      <div className="flex flex-row justify-center gap-16 mt-8 w-full">
        {editing ? (
          <div className="flex flex-col w-full items-center">
            {organizers.map((org, idx) => (
              <div key={idx} className="flex flex-col items-center mb-4">
                {org.signature && <img src={org.signature} className="h-10 object-contain mb-1" alt="Signature" />}
                <input
                  type="text"
                  value={org.name}
                  onChange={e => handleOrganizerChange(idx, "name", e.target.value)}
                  placeholder="Organizer Name"
                  className="border px-2 py-1 rounded mb-1 text-center"
                />
                <input
                  type="text"
                  value={org.label}
                  onChange={e => handleOrganizerChange(idx, "label", e.target.value)}
                  placeholder="Label"
                  className="border px-2 py-1 rounded mb-1 text-center"
                />
                <input
                  type="file"
                  accept="image/*"
                  onChange={e => handleOrganizerSignature(idx, e.target.files[0])}
                  className="mb-1"
                />
                <button
                  type="button"
                  className="bg-red-500 text-white px-2 py-1 rounded text-xs"
                  onClick={() => removeOrganizer(idx)}
                  disabled={organizers.length === 1}
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              type="button"
              className="bg-green-600 text-white px-3 py-1 rounded mt-2"
              onClick={addOrganizer}
            >
              + Add Organizer
            </button>
          </div>
        ) : (
          organizers.map((org, idx) => (
            <div key={idx} className="flex flex-col items-center">
              {org.signature && <img src={org.signature} className="h-10 object-contain mb-1" alt="Signature" />}
              <span style={{ fontFamily: 'cursive, Pacifico, Arial' }} className="text-xl text-blue-900 mb-1">{org.name}</span>
              <span className="text-xs text-gray-500 uppercase tracking-widest">{org.label}</span>
            </div>
          ))
        )}
      </div>
    </div>
  </div>
);

export default ModernGoldTemplate;