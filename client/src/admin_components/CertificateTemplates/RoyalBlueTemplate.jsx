import React from "react";

const RoyalBlueTemplate = ({
  event,
  organizers,
  editing,
  handleOrganizerChange,
  handleOrganizerSignature,
  addOrganizer,
  removeOrganizer,
}) => (
  <div
    className="certificate-template relative bg-white rounded-2xl shadow-xl flex flex-col items-center border-0"
    style={{
      minWidth: 1056,
      minHeight: 816,
      padding: 0,
      overflow: "hidden",
    }}
  >
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: "linear-gradient(135deg, #1e3a8a, #93c5fd)",
        borderRadius: "1.25rem",
        padding: "10px",
        zIndex: 0,
      }}
    />
    <div
      style={{
        position: "absolute",
        inset: 14,
        background: "#f9fafb",
        borderRadius: "1rem",
        zIndex: 1,
        border: "2px solid #1e3a8a",
      }}
    />
    <div className="relative z-10 flex flex-col items-center w-full px-16 py-14">
      <h2 className="text-6xl font-serif font-bold text-blue-800 tracking-wider mb-2">
        CERTIFICATE
      </h2>
      <div className="text-3xl font-serif text-blue-700 tracking-widest mb-8">
        OF RECOGNITION
      </div>
      <div className="text-2xl font-medium text-gray-800 mb-4 mt-4">
        IS HEREBY AWARDED TO
      </div>
      <div
        className="text-5xl text-blue-900 mb-4"
        style={{
          fontFamily: "cursive, Pacifico, Arial",
          minHeight: "2.5em",
          height: "2.5em",
        }}
      ></div>
      <div className="text-2xl text-gray-800 mb-8 text-center max-w-3xl">
        In acknowledgment of remarkable involvement in{" "}
        <span className="font-semibold text-blue-800">{event.title}</span> on{" "}
        <span className="font-semibold text-blue-800">
          {new Date(event.date).toLocaleDateString()}
        </span>
        .
      </div>
      <div className="flex justify-center items-center my-10">

      </div>
      <div className="flex flex-row justify-center gap-24 mt-12 w-full">
        {editing ? (
          <div className="flex flex-col w-full items-center">
            {organizers.map((org, idx) => (
              <div key={idx} className="flex flex-col items-center mb-6">
                {org.signature && (
                  <img
                    src={org.signature}
                    className="h-16 object-contain mb-2"
                    alt="Signature"
                  />
                )}
                <input
                  type="text"
                  value={org.name}
                  onChange={(e) =>
                    handleOrganizerChange(idx, "name", e.target.value)
                  }
                  placeholder="Organizer Name"
                  className="border px-4 py-2 rounded mb-2 text-center text-lg"
                />
                <input
                  type="text"
                  value={org.label}
                  onChange={(e) =>
                    handleOrganizerChange(idx, "label", e.target.value)
                  }
                  placeholder="Label"
                  className="border px-4 py-2 rounded mb-2 text-center text-lg"
                />
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    handleOrganizerSignature(idx, e.target.files[0])
                  }
                  className="mb-2"
                />
                <button
                  type="button"
                  className="bg-red-500 text-white px-4 py-2 rounded text-base"
                  onClick={() => removeOrganizer(idx)}
                  disabled={organizers.length === 1}
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              type="button"
              className="bg-blue-700 text-white px-5 py-2 rounded mt-4 text-lg"
              onClick={addOrganizer}
            >
              + Add Organizer
            </button>
          </div>
        ) : (
          organizers.map((org, idx) => (
            <div key={idx} className="flex flex-col items-center">
              {org.signature && (
                <img
                  src={org.signature}
                  className="h-16 object-contain mb-2"
                  alt="Signature"
                />
              )}
              <span
                style={{ fontFamily: "cursive, Pacifico, Arial" }}
                className="text-2xl text-blue-900 mb-2"
              >
                {org.name}
              </span>
              <span className="text-lg text-gray-500 uppercase tracking-widest">
                {org.label}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  </div>
);

export default RoyalBlueTemplate;