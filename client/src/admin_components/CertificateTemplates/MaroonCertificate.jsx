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
  <div
    className="certificate-template relative bg-[#fdf6e3] rounded-2xl shadow-xl flex flex-col items-center border-4 border-[#800000]"
    style={{
      width: 1056,
      height: 816,
      padding: 0,
      overflow: "hidden",
    }}
  >
    <h2 className="text-6xl font-serif font-bold text-[#800000] tracking-widest mb-4">
      CERTIFICATE
    </h2>
    <div className="text-3xl font-serif text-[#4b2e2e] tracking-widest mb-8">
      OF PARTICIPATION
    </div>
    <div className="text-2xl text-gray-800 mb-4">Presented to</div>
    <div
      className="text-5xl text-blue-900 mb-4"
      style={{
        fontFamily: "cursive, Pacifico, Arial",
        minHeight: "2.5em",
        height: "2.5em",
      }}
    ></div>
    <p className="text-2xl text-center text-gray-700 max-w-3xl mb-10">
      For actively engaging in{" "}
      <span className="font-semibold text-[#800000]">{event.title}</span> held
      on{" "}
      <span className="font-semibold text-[#800000]">
        {new Date(event.date).toLocaleDateString()}
      </span>
      . We thank you for your valuable presence.
    </p>
    <div className="w-full flex justify-around mt-12">
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
            className="bg-green-600 text-white px-5 py-2 rounded mt-4 text-lg"
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
              className="text-2xl text-[#4b2e2e] mb-2"
            >
              {org.name}
            </span>
            <span className="text-lg text-gray-600 uppercase tracking-widest">
              {org.label}
            </span>
          </div>
        ))
      )}
    </div>
  </div>
);

export default ClassicMaroonTemplate;