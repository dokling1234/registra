const ClassicMaroonTemplate = ({ event, organizers }) => (
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
      {organizers.map((org, idx) => (
        <div key={idx} className="flex flex-col items-center">
          {org.signature && <img src={org.signature} className="h-12 object-contain mb-1" />}
          <span style={{ fontFamily: 'cursive, Pacifico, Arial' }} className="text-lg text-[#4b2e2e] mb-1">{org.name}</span>
          <span className="text-xs text-gray-600 uppercase tracking-widest">{org.label}</span>
        </div>
      ))}
    </div>
  </div>
);

export default ClassicMaroonTemplate;