import React, { useState, useEffect } from "react";
import axios from "axios";

const questionTypes = ["Choice", "Text", "Rating", "Likert"];

const FeedbackBuilder = () => {
  const [questions, setQuestions] = useState([]);
  const [file, setFile] = useState(null);
  const [eventQuery, setEventQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (eventQuery.length > 1) {
        axios
          .post("/api/events/search", { title: eventQuery })
          .then((res) => {
            setSearchResults(res.data.events || []);
          })
          .catch((err) => {
            console.error("Error fetching events:", err);
          });
      } else {
        setSearchResults([]);
      }
    }, 300); 

    return () => clearTimeout(delayDebounceFn);
  }, [eventQuery]);

  const addQuestion = (type = "Text") => {
    const newQuestion = {
      id: Date.now(),
      type,
      text: "",
      options: type === "Choice" ? ["Very Unsatisfied", "Unsatisfied", "Neutral", "Satisfied", "Very Satisfied"] : [],
      statements: type === "Likert" ? ["Statement 1", "Statement 2"] : [],
    };
    setQuestions([...questions, newQuestion]);
  };

  const handleQuestionChange = (id, field, value) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === id ? { ...q, [field]: value } : q))
    );
  };

  const addOption = (id) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === id ? { ...q, options: [...q.options, ""] } : q))
    );
  };

  const updateOption = (id, index, value) => {
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === id
          ? {
              ...q,
              options: q.options.map((opt, i) => (i === index ? value : opt)),
            }
          : q
      )
    );
  };

  const addStatement = (id) => {
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === id
          ? {
              ...q,
              statements: [
                ...q.statements,
                "Statement " + (q.statements.length + 1),
              ],
            }
          : q
      )
    );
  };

  const removeQuestion = (id) => {
    setQuestions((prev) => prev.filter((q) => q.id !== id));
  };

  const renderQuestion = (q, index) => {
    return (
      <div className="border p-4 mb-4 rounded-md bg-white shadow" key={q.id}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex gap-2 items-center">
            <span className="font-medium">{index + 1}.</span>
            <input
              type="text"
              value={q.text}
              placeholder="Question"
              onChange={(e) =>
                handleQuestionChange(q.id, "text", e.target.value)
              }
              className="border px-2 py-1 rounded w-full"
            />
          </div>
          <button
            onClick={() => removeQuestion(q.id)}
            className="text-red-500 text-xl"
          >
            🗑
          </button>
        </div>

        {q.type === "Choice" &&
          q.options.map((opt, i) => (
            <div key={i} className="flex items-center gap-2 mb-2">
              <input type="radio" disabled />
              <input
                type="text"
                value={opt}
                placeholder={`Option ${i + 1}`}
                onChange={(e) => updateOption(q.id, i, e.target.value)}
                className="border px-2 py-1 rounded w-full"
              />
            </div>
          ))}
        {q.type === "Choice" && (
          <button
            className="text-sm text-blue-600 hover:underline"
            onClick={() => addOption(q.id)}
          >
            + Add Option
          </button>
        )}

        {q.type === "Likert" && (
          <>
            <div className="grid grid-cols-6 gap-2 mb-2 font-medium">
              <div></div>
              {[1, 2, 3, 4, 5].map((n) => (
                <span key={n}>Option {n}</span>
              ))}
            </div>
            {q.statements.map((stmt, i) => (
              <div key={i} className="grid grid-cols-6 gap-2 mb-2 items-center">
                <input
                  type="text"
                  value={stmt}
                  onChange={(e) => {
                    const newStatements = [...q.statements];
                    newStatements[i] = e.target.value;
                    handleQuestionChange(q.id, "statements", newStatements);
                  }}
                  className="border px-2 py-1 rounded"
                />
                {[1, 2, 3, 4, 5].map((n) => (
                  <input key={n} type="radio" disabled />
                ))}
              </div>
            ))}
            <button
              className="text-sm text-blue-600 hover:underline"
              onClick={() => addStatement(q.id)}
            >
              + Add Statement
            </button>
          </>
        )}

        {q.type === "Rating" && (
          <div className="flex gap-1 text-yellow-400 text-2xl">
            {[...Array(5)].map((_, i) => (
              <span key={i}>⭐</span>
            ))}
          </div>
        )}

        {q.type === "Text" && (
          <input
            className="border px-2 py-1 rounded w-full"
            type="text"
            placeholder="Answer"
            disabled
          />
        )}
      </div>
    );
  };

  const handleSubmit = () => {
  if (!selectedEvent) {
    alert("Please select an event before submitting the feedback form.");
    return;
  }

  const feedbackData = {
    eventId: selectedEvent._id,
    title: "Event Feedback", 
    questions: questions,
  };

  
  axios
    .put("/api/feedback/createFeedback", feedbackData)
    .then((response) => {
      alert("Feedback form created successfully!");
    })
    .catch((error) => {
      console.error("Error creating feedback form:", error);
      alert("Error creating feedback form. Please try again.");
    });
};


  return (
    <div className="max-w-4xl mx-auto p-4">
      <h2 className="text-xl font-semibold mb-4">Event Feedback</h2>
      <div className="mb-6">
        <label className="block font-medium mb-1">Select Event</label>
        <input
          type="text"
          value={eventQuery}
          onChange={(e) => {
            setEventQuery(e.target.value);
            setSelectedEvent(null); 
          }}
          className="border px-3 py-2 rounded w-full"
          placeholder="Search for event..."
        />
        {searchResults.length > 0 && (
          <ul className="bg-white border rounded mt-1 max-h-40 overflow-auto shadow">
            {searchResults.map((event) => (
              <li
                key={event._id}
                onClick={() => {
                  setSelectedEvent(event);
                  setEventQuery(event.title);
                  setSearchResults([]);
                }}
                className="px-4 py-2 cursor-pointer hover:bg-gray-100"
              >
                {event.title}
              </li>
            ))}
          </ul>
        )}
        {selectedEvent && (
          <p className="text-sm text-green-600 mt-1">
            Selected Event: {selectedEvent.title}
          </p>
        )}
      </div>
      {questions.map((q, idx) => renderQuestion(q, idx))}

      <div className="flex flex-wrap gap-2 mb-6">
        {questionTypes.map((type) => (
          <button
            key={type}
            onClick={() => addQuestion(type)}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-1 rounded text-sm"
          >
            {type}
          </button>
        ))}
      </div>

      <div className="mt-4">
        <label className="block font-medium mb-2">Upload Certificate</label>
        <input
          type="file"
          onChange={(e) => setFile(e.target.files[0])}
          className="block border rounded px-3 py-2 w-full"
        />
      </div>
      <button
        onClick={handleSubmit}
        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm"
      >
        Submit Feedback Form
      </button>
    </div>
  );
};

export default FeedbackBuilder;
