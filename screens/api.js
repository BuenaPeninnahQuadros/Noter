import Constants from "expo-constants";

const configuredApiUrl = process.env.EXPO_PUBLIC_API_URL?.trim();
const hostUri =
  Constants.expoConfig?.hostUri ||
  Constants.manifest?.debuggerHost ||
  "";
const host = hostUri ? hostUri.split(":")[0] : "localhost";
const BASE_URL = configuredApiUrl || `http://${host}:8080`;

// Fetch all notes
export const getNotes = async () => {
  const res = await fetch(`${BASE_URL}/notes`);
  return res.json();
};

// Fetch topics
export const getTopics = async () => {
  const res = await fetch(`${BASE_URL}/topics`);
  return res.json();
};

// Delete a note by ID
export const deleteNote = async (id) => {
  const res = await fetch(`${BASE_URL}/notes/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete note");
};

// Create a note
export const createNote = async (note) => {
  const res = await fetch(`${BASE_URL}/notes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(note),
  });
  return res.json();
};

// Update a note by ID
export const updateNote = async (id, note) => {
  const res = await fetch(`${BASE_URL}/notes/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(note),
  });
  return res.json();
};

// Track note view
export const trackView = async (id, timeSpent = 0) => {
  const res = await fetch(`${BASE_URL}/notes/${id}/view`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ timeSpent }),
  });
  return res.json();
};

// Extract text from an uploaded PDF via backend
export const extractPdfText = async (file) => {
  const formData = new FormData();
  formData.append("file", {
    uri: file.uri,
    name: file.name || "document.pdf",
    type: "application/pdf",
  });

  const res = await fetch(`${BASE_URL}/extract-pdf`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const message = await res.text();
    throw new Error(message || "PDF extraction failed");
  }

  return res.json();
};

// Sync note categories from ML pipeline into MongoDB
export const syncCategories = async () => {
  const res = await fetch(`${BASE_URL}/sync-categories`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  return res.json();
};