import React from "react";

const ClassicMaroonTemplate = ({
  event,
  organizers,
  editing,
  handleOrganizerChange,
  handleOrganizerSignature,
  addOrganizer,
  removeOrganizer,
}) => (
  <div className="certificate-template relative bg-[#fdf6e3] rounded-2xl shadow-xl flex flex-col items-center border-4 border-[#800000]"
    style={{ minWidth: 700, minHeight: 500, padding: '2rem', overflow: 'hidden' }}>
    <h2 className="text-5xl font-serif font-bold text-[#800000] tracking-widest mb-2">CERTIFICATE</h2>
    <div className="text-lg font-serif text-[#4b2e2e] tracking-widest mb-6">OF PARTICIPATION</div>
    <div className="text-sm text-gray-800 mb-2">Presented to</div>
    <div className="text-4xl text-[#4b2e2e] mb-4" style={{ fontFamily: 'cursive, Pacifico, Arial' }}>[Recipient Name]</div>
    <p className="text-base text-center text-gray-700 max-w-2xl mb-6">
      For actively engaging in <span className="font-semibold text-[#800000]">{event.title}</span> held on <span className="font-semibold text-[#800000]">{new Date(event.date).toLocaleDateString()}</span>. We thank you for your valuable presence.
    </p>
    <div className="w-full flex justify-around mt-8">
      {editing ? (
        <div className="flex flex-col w-full items-center">
          {organizers.map((org, idx) => (
            <div key={idx} className="flex flex-col items-center mb-4">
              {org.signature && <img src={org.signature} className="h-12 object-contain mb-1" alt="Signature" />}
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
            {org.signature && <img src={org.signature} className="h-12 object-contain mb-1" alt="Signature" />}
            <span style={{ fontFamily: 'cursive, Pacifico, Arial' }} className="text-lg text-[#4b2e2e] mb-1">{org.name}</span>
            <span className="text-xs text-gray-600 uppercase tracking-widest">{org.label}</span>
          </div>
        ))
      )}
    </div>
  </div>
);

export default ClassicMaroonTemplate;