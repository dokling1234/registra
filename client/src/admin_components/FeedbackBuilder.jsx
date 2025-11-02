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
  const [existingForm, setExistingForm] = useState(null);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (eventQuery.length > 1) {
        axios
          .post("/api/events/search", { title: eventQuery })
          .then((res) => {
            // Filter out events whose date has already passed
            const now = new Date();
            const filtered = (res.data.events || []).filter((event) => {
              const eventDate = new Date(event.date);
              return eventDate >= now;
            });
            setSearchResults(filtered);
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

  // Check for existing feedback form when event is selected
  useEffect(() => {
    if (selectedEvent) {

      axios
        .get(`/api/feedback/getFeedback/${selectedEvent._id}`)
        .then((res) => {
          if (res.data && res.data.questions && res.data.questions.length > 0) {
            setExistingForm(res.data);
            setQuestions(res.data.questions);
          } else {
            setExistingForm(null);
            setQuestions([]);
          }
        })
        .catch((err) => {
          setExistingForm(null);
          setQuestions([]);
        });
    } else {
      setExistingForm(null);
      setQuestions([]);
    }
  }, [selectedEvent]);

  const addQuestion = (type = "Text") => {
    const newQuestion = {
      id: Date.now(),
      type,
      text: "Untitled Question",
      options:
        type === "Choice"
          ? [
              "Very Unsatisfied",
              "Unsatisfied",
              "Neutral",
              "Satisfied",
              "Very Satisfied",
            ]
          : [],
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
      <div
        className="border p-4 mb-4 rounded-md bg-white shadow"
        key={q.id || index}
      >
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
            type="button"
          >
            🗑
          </button>
        </div>

        {q.type === "Likert" && (
          <>
            <div className="grid grid-cols-6 gap-2 mb-2 font-medium">
              <div></div>
              {q.likertOptions && q.likertOptions.length === 5
                ? q.likertOptions.map((opt, i) => (
                    <input
                      key={i}
                      type="text"
                      value={opt}
                      onChange={(e) => {
                        const newOpts = [...q.likertOptions];
                        newOpts[i] = e.target.value;
                        handleQuestionChange(q.id, "likertOptions", newOpts);
                      }}
                      className="border px-2 py-1 rounded text-xs text-center"
                      placeholder={`Option ${i + 1}`}
                    />
                  ))
                : // fallback to default options if not set
                  [
                    "Very Unsatisfied",
                    "Unsatisfied",
                    "Neutral",
                    "Satisfied",
                    "Very Satisfied",
                  ].map((opt, i) => (
                    <input
                      key={i}
                      type="text"
                      value={q.likertOptions ? q.likertOptions[i] : opt}
                      onChange={(e) => {
                        const newOpts = q.likertOptions
                          ? [...q.likertOptions]
                          : [
                              "Very Unsatisfied",
                              "Unsatisfied",
                              "Neutral",
                              "Satisfied",
                              "Very Satisfied",
                            ];
                        newOpts[i] = e.target.value;
                        handleQuestionChange(q.id, "likertOptions", newOpts);
                      }}
                      className="border px-2 py-1 rounded text-xs text-center"
                      placeholder={`Option ${i + 1}`}
                    />
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
                {(q.likertOptions && q.likertOptions.length === 5
                  ? q.likertOptions
                  : [
                      "Very Unsatisfied",
                      "Unsatisfied",
                      "Neutral",
                      "Satisfied",
                      "Very Satisfied",
                    ]
                ).map((_, n) => (
                  <input key={n} type="radio" disabled />
                ))}
              </div>
            ))}
            <button
              className="text-sm text-blue-600 hover:underline"
              onClick={() => addStatement(q.id)}
              type="button"
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
      toast.error(
        "Please select an event before submitting the feedback form."
      );
      return;
    }

    // Ensure all questions have a non-empty text
    const questionsWithText = questions.map((q) => ({
      ...q,
      text: q.text && q.text.trim() !== "" ? q.text : "Untitled Question",
    }));

    const feedbackData = {
      eventId: selectedEvent._id,
      title: "Event Feedback",
      questions: questionsWithText,
      date: selectedEvent.date, // <-- Add this
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
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-white flex flex-col items-center py-8 sm:py-12 px-3 sm:px-4">
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl p-6 sm:p-10 flex flex-col items-center">
        <div className="bg-gradient-to-r from-blue-600 to-blue-400 rounded-xl p-6 mb-8 shadow w-full flex items-center justify-center">
          <h2 className="text-2xl font-extrabold text-white tracking-wide text-center">
            Event Feedback Builder
          </h2>
        </div>
        {/* Event Selection */}
        <div className="mb-8 w-full">
          <label className="block font-semibold text-lg mb-2 text-gray-700">
            Select Event
          </label>
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
        {/* Show existing feedback form if it exists */}
        {existingForm ? (
          <div className="w-full mb-8">
            <div className="p-4 mb-4 rounded bg-blue-50 border border-blue-200">
              <p className="font-semibold text-blue-700 mb-2">
                A feedback form already exists for this event.
              </p>
              <p className="text-gray-700 mb-2">
                You can view or edit the existing form below.
              </p>
            </div>
            <label className="block font-semibold text-lg mb-2 text-gray-700">
              Existing Questions
            </label>
            {questions.map((q, idx) => renderQuestion(q, idx))}
            <div className="flex flex-wrap gap-2 mt-4">
              {questionTypes.map((type) => (
                <button
                  key={type}
                  onClick={() => addQuestion(type)}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow"
                  type="button"
                >
                  Add {type}
                </button>
              ))}
            </div>
            <button
              onClick={handleSubmit}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-400 hover:from-blue-700 hover:to-blue-500 text-white px-4 sm:px-6 py-3 rounded-lg font-semibold text-lg shadow mt-2"
            >
              Update Feedback Form
            </button>
          </div>
        ) : (
          // No existing form, allow to create new
          <div className="w-full mb-8">
            <label className="block font-semibold text-lg mb-2 text-gray-700">
              Questions
            </label>
            {questions.map((q, idx) => renderQuestion(q, idx))}
            <div className="flex flex-wrap gap-2 mt-4">
              {questionTypes.map((type) => (
                <button
                  key={type}
                  onClick={() => addQuestion(type)}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow"
                  type="button"
                >
                  Add {type}
                </button>
              ))}
            </div>
            <button
              onClick={handleSubmit}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-400 hover:from-blue-700 hover:to-blue-500 text-white px-4 sm:px-6 py-3 rounded-lg font-semibold text-lg shadow mt-2"
            >
              Submit Feedback Form
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default FeedbackBuilder;
