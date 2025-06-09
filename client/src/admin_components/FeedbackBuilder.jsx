import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";

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
      text: "Untitled Question",
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
      toast.error("Please select an event before submitting the feedback form.");
      return;
    }

    // Ensure all questions have a non-empty text
    const questionsWithText = questions.map(q => ({
      ...q,
      text: q.text && q.text.trim() !== '' ? q.text : 'Untitled Question',
    }));

    const feedbackData = {
      eventId: selectedEvent._id,
      title: "Event Feedback",
      questions: questionsWithText,
    };

    axios
      .put("/api/feedback/createFeedback", feedbackData)
      .then((response) => {
        toast.success("Feedback form created successfully!");
      })
      .catch((error) => {
        console.error("Error creating feedback form:", error);
        toast.error("Error creating feedback form. Please try again.");
      });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-white flex flex-col items-center py-12 px-4">
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl p-10 flex flex-col items-center">
        <div className="bg-gradient-to-r from-blue-600 to-blue-400 rounded-xl p-6 mb-8 shadow w-full flex items-center justify-center">
          <h2 className="text-2xl font-extrabold text-white tracking-wide text-center">Event Feedback Builder</h2>
        </div>
        {/* Event Selection */}
        <div className="mb-8 w-full">
          <label className="block font-semibold text-lg mb-2 text-gray-700">Select Event</label>
          <input
            type="text"
            value={eventQuery}
            onChange={(e) => {
              setEventQuery(e.target.value);
              setSelectedEvent(null);
            }}
            className="border px-4 py-3 rounded-lg w-full text-base focus:ring-2 focus:ring-blue-300 focus:outline-none"
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
                  className="px-4 py-2 cursor-pointer hover:bg-blue-50"
                >
                  {event.title}
                </li>
              ))}
            </ul>
          )}
          {selectedEvent && (
            <p className="text-sm text-green-600 mt-1 font-medium">
              Selected Event: {selectedEvent.title}
            </p>
          )}
        </div>
        {/* Questions Section */}
        <div className="w-full mb-8">
          <label className="block font-semibold text-lg mb-2 text-gray-700">Questions</label>
          {questions.map((q, idx) => renderQuestion(q, idx))}
          <div className="flex flex-wrap gap-2 mt-4">
            {questionTypes.map((type) => (
              <button
                key={type}
                onClick={() => addQuestion(type)}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow"
              >
                Add {type}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleSubmit}
          className="w-full bg-gradient-to-r from-blue-600 to-blue-400 hover:from-blue-700 hover:to-blue-500 text-white px-6 py-3 rounded-lg font-semibold text-lg shadow mt-2"
        >
          Submit Feedback Form
        </button>
      </div>
    </div>
  );
};

export default FeedbackBuilder;
