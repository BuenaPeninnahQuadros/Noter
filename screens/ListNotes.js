import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { getNotes, deleteNote, getTopics, trackView } from "./api";

export default function ListNotes({ navigation, highlightTopic = 0 }) {
  const [notes, setNotes] = useState([]);
  const [grouped, setGrouped] = useState({});
  const [topicNames, setTopicNames] = useState({});

  const getTopicLabel = (topicKey) => {
    const entry = topicNames?.[topicKey];
    if (typeof entry === "string") return entry;
    if (entry?.label) return entry.label;
    if (Array.isArray(entry?.top_terms)) return entry.top_terms.join(", ");
    return `Topic ${topicKey}`;
  };

  const fetchNotes = async () => {
    try {
      const data = await getNotes();
      setNotes(data);

      // Group notes by topic
      const groups = {};
      data.forEach(note => {
        const t = note.topic ?? 0;
        if (!groups[t]) groups[t] = [];
        groups[t].push(note);
      });
      setGrouped(groups);

    } catch (err) {
      console.log("Error fetching notes:", err);
    }
  };

  const fetchTopics = async () => {
    try {
      const topics = await getTopics();
      setTopicNames(topics || {});
    } catch (err) {
      console.log("Error fetching topics:", err);
    }
  };

  useEffect(() => {
    fetchTopics();
    fetchNotes();
    const unsubscribeFocus = navigation.addListener("focus", fetchNotes);
    return unsubscribeFocus;
  }, [navigation]);

  const confirmDelete = (id) => {
    Alert.alert(
      "Delete Note",
      "Are you sure you want to delete this note permanently?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => handleDelete(id) }
      ]
    );
  };

  const handleDelete = async (id) => {
    try {
      await deleteNote(id);
      fetchNotes();
    } catch (err) {
      console.log("Error deleting note:", err);
    }
  };

  const handleEdit = (note) => {
    // Track view when opening note
    trackView(note.id || note._id).catch(err => console.log("Error tracking view:", err));
    navigation.navigate("CreateNote", { note });
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.heading}>All Notes</Text>

      {/* Recommended notes based on revisit score */}
      {(() => {
        const recommended = [...notes]
          .filter(n => n.revisitScore && n.revisitScore > 0.5)
          .sort((a, b) => (b.revisitScore || 0) - (a.revisitScore || 0))
          .slice(0, 3);
        
        if (recommended.length === 0) return null;
        
        return (
          <View style={styles.recommendedContainer}>
            <Text style={styles.recommendedHeader}>🔥 Frequently Accessed</Text>
            {recommended.map(note => (
              <View key={note.id || note._id} style={styles.note}>
                <Text style={styles.noteTitle}>{note.title}</Text>
                <Text>{note.content}</Text>
                <Text style={styles.scoreText}>Score: {(note.revisitScore * 100).toFixed(0)}%</Text>
                <View style={styles.actions}>
                  <TouchableOpacity onPress={() => handleEdit(note)}>
                    <Text style={styles.edit}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => confirmDelete(note.id || note._id)}>
                    <Text style={styles.delete}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        );
      })()}

      {/* Highlighted topic (if any) */}
      {(() => {
        const hKey = String(highlightTopic);
        const hNotes = grouped[hKey] ?? [];
        if (hNotes.length === 0) return null;
        return (
          <View style={styles.specialTopicContainer}>
            <Text style={styles.topicHeader}>⭐ {getTopicLabel(hKey)}</Text>
            {hNotes.map(note => (
              <View key={note.id || note._id} style={styles.note}>
                <Text style={styles.noteTitle}>{note.title}</Text>
                <Text>{note.content}</Text>
                <View style={styles.actions}>
                  <TouchableOpacity onPress={() => handleEdit(note)}>
                    <Text style={styles.edit}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => confirmDelete(note.id || note._id)}>
                    <Text style={styles.delete}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        );
      })()}

      {/* All topics (including empty ones), excluding highlighted */}
      {Object.keys(topicNames || {})
        .filter(topicKey => topicKey !== String(highlightTopic))
        .map(topicKey => {
          const notesForTopic = grouped[topicKey] ?? [];
          return (
            <View key={topicKey} style={styles.topicContainer}>
              <Text style={styles.topicHeader}>📁 {getTopicLabel(topicKey)}</Text>
              {notesForTopic.length === 0 ? (
                <Text style={{ fontStyle: "italic", color: "#666" }}>No notes yet</Text>
              ) : (
                notesForTopic.map(note => (
                  <View key={note.id || note._id} style={styles.note}>
                    <Text style={styles.noteTitle}>{note.title}</Text>
                    <Text>{note.content}</Text>
                    <View style={styles.actions}>
                      <TouchableOpacity onPress={() => handleEdit(note)}>
                        <Text style={styles.edit}>Edit</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => confirmDelete(note.id || note._id)}>
                        <Text style={styles.delete}>Delete</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              )}
            </View>
          );
        })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#FFF8F0" },
  heading: { fontSize: 24, fontWeight: "bold", marginBottom: 20, marginTop: 30 },
  recommendedContainer: { marginBottom: 25, backgroundColor: "#FFE5E5", padding: 15, borderRadius: 8, borderWidth: 2, borderColor: "#FF6B6B" },
  recommendedHeader: { fontSize: 20, fontWeight: "bold", marginBottom: 10, color: "#FF6B6B" },
  specialTopicContainer: { marginBottom: 25, backgroundColor: "#FFF4E0", padding: 10, borderRadius: 8 },
  topicContainer: { marginBottom: 25 },
  topicHeader: { fontSize: 20, fontWeight: "bold", marginBottom: 10, color: "#E76B5A" },
  note: {
    padding: 15,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    marginVertical: 5,
    backgroundColor: "#fff",
  },
  noteTitle: { fontWeight: "bold", marginBottom: 5 },
  scoreText: { fontSize: 12, color: "#666", fontStyle: "italic", marginTop: 5 },
  actions: { flexDirection: "row", justifyContent: "space-between", marginTop: 10 },
  edit: { color: "blue", fontWeight: "bold" },
  delete: { color: "red", fontWeight: "bold" },
});