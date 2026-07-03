import React, { useState, useEffect } from "react";
import { View, TextInput, StyleSheet, TouchableOpacity, Text, Alert, ScrollView } from "react-native";
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { Ionicons } from '@expo/vector-icons';
import { createNote, updateNote, extractPdfText } from "./api";

const BACKGROUND_COLORS = [
  { name: "Cream", color: "#FFF8F0" },
  { name: "Pink", color: "#FFE5EC" },
  { name: "Blue", color: "#E3F2FD" },
  { name: "Green", color: "#E8F5E9" },
  { name: "Yellow", color: "#FFFDE7" },
  { name: "Purple", color: "#F3E5F5" },
];

export default function CreateNote({ route, navigation }) {
  const [noteTitle, setNoteTitle] = useState("");
  const [noteText, setNoteText] = useState("");
  const [bgColor, setBgColor] = useState("#FFF8F0");
  const [isEdit, setIsEdit] = useState(false);
  const [noteId, setNoteId] = useState(null);

  useEffect(() => {
    if (route.params?.note) {
      const { note } = route.params;
      setNoteTitle(note.title);
      setNoteText(note.content);
      setBgColor(note.backgroundColor || "#FFF8F0");
      setNoteId(note.id || note._id || null);
      setIsEdit(true);
    }
  }, [route.params]);

  const handleSave = async () => {
    if (!noteTitle || !noteText) {
      Alert.alert("Please enter a title and note content");
      return;
    }

    try {
      const noteData = { 
        title: noteTitle, 
        content: noteText,
        backgroundColor: bgColor 
      };
      
      if (isEdit) {
        if (!noteId) {
          Alert.alert("Cannot update: missing note ID");
          return;
        }
        await updateNote(noteId, noteData);
      } else {
        await createNote(noteData);
      }
      navigation.navigate("ListNotes", { refresh: true });

    } catch (err) {
      Alert.alert("Failed to save note. Try again!");
    }
  };

  const handleDocumentPick = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/plain', 'application/pdf', 'image/*'],
        copyToCacheDirectory: true
      });

      if (result.canceled) return;

      const file = result.assets[0];
      
      // Handle text files
      if (file.mimeType === 'text/plain') {
        const content = await FileSystem.readAsStringAsync(file.uri);
        setNoteText(prevText => prevText + "\n\n" + content);
        Alert.alert("Success", "Text file imported!");
      } 
      else if (file.mimeType === 'application/pdf') {
        const data = await extractPdfText(file);
        const extracted = (data?.text || "").trim();
        if (!extracted) {
          Alert.alert("PDF Imported", "No selectable text found in this PDF.");
          return;
        }
        setNoteText(prevText => prevText + "\n\n" + extracted);
        Alert.alert("Success", "PDF text imported!");
      } else if (file.mimeType?.startsWith('image/')) {
        Alert.alert("Image OCR", "Image text extraction (OCR) requires additional setup. For now, please type manually.");
      }
    } catch (err) {
      Alert.alert("Error", "Failed to import document");
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <TextInput
          style={styles.titleInput}
          placeholder="Title"
          placeholderTextColor="#888"
          value={noteTitle}
          onChangeText={setNoteTitle}
        />

        {/* Color Picker */}
        <View style={styles.colorPickerContainer}>
          <Text style={styles.colorLabel}>Background Color:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {BACKGROUND_COLORS.map((item) => (
              <TouchableOpacity
                key={item.color}
                style={[
                  styles.colorCircle,
                  { backgroundColor: item.color },
                  bgColor === item.color && styles.selectedColor
                ]}
                onPress={() => setBgColor(item.color)}
              >
                {bgColor === item.color && (
                  <Ionicons name="checkmark" size={20} color="#333" />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.iconButton} onPress={handleDocumentPick}>
            <Ionicons name="document-attach" size={24} color="#FF6F3C" />
            <Text style={styles.iconButtonText}>Import</Text>
          </TouchableOpacity>
        </View>

        <TextInput
          style={styles.input}
          placeholder="Start writing your note here..."
          placeholderTextColor="#888"
          multiline
          value={noteText}
          onChangeText={setNoteText}
        />

        <TouchableOpacity style={styles.button} onPress={handleSave}>
          <Text style={styles.buttonText}>{isEdit ? "Update Note" : "Save Note"}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  titleInput: {
    fontSize: 18,
    color: "#333",
    borderBottomWidth: 1,
    borderColor: "#ddd",
    marginBottom: 15,
    paddingVertical: 8,
  },
  colorPickerContainer: {
    marginBottom: 15,
  },
  colorLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
    fontWeight: "500",
  },
  colorCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 2,
    borderColor: "#ddd",
    justifyContent: "center",
    alignItems: "center",
  },
  selectedColor: {
    borderColor: "#FF6F3C",
    borderWidth: 3,
  },
  actionButtons: {
    flexDirection: "row",
    marginBottom: 15,
    gap: 15,
  },
  iconButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#FF6F3C",
    gap: 5,
  },
  iconButtonText: {
    color: "#FF6F3C",
    fontSize: 14,
    fontWeight: "500",
  },
  input: {
    minHeight: 300,
    fontSize: 18,
    color: "#333",
    textAlignVertical: "top",
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    backgroundColor: "rgba(255,255,255,0.7)",
  },
  button: {
    backgroundColor: "#FF6F3C",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 20,
    marginBottom: 15,
  },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});