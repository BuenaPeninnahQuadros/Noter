package routes

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"noter-backend/models"
	"os"
	"time"

	"github.com/gorilla/mux"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)
import "go.mongodb.org/mongo-driver/bson/primitive"

var Collection *mongo.Collection

// InitDB connects to MongoDB Atlas
func InitDB() {
	uri := os.Getenv("MONGO_URI")
	if uri == "" {
		log.Fatal("MONGO_URI is not set")
	}

	client, err := mongo.NewClient(options.Client().ApplyURI(uri))
	if err != nil {
		log.Fatal(err)
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	err = client.Connect(ctx)
	if err != nil {
		log.Fatal(err)
	}

	err = client.Ping(ctx, nil)
	if err != nil {
		log.Fatal("❌ Could not connect to MongoDB:", err)
	}

	fmt.Println("✅ Connected to MongoDB Atlas!")
	Collection = client.Database("notesAppDB").Collection("notes")
}

// RegisterRoutes sets up HTTP routes
func RegisterRoutes(router *mux.Router) {
	router.HandleFunc("/notes", CreateNoteHandler).Methods("POST")
	router.HandleFunc("/notes", ListNotesHandler).Methods("GET")
	router.HandleFunc("/notes/{id}", UpdateNoteHandler).Methods("PUT")
	router.HandleFunc("/notes/{id}", DeleteNoteHandler).Methods("DELETE")
	router.HandleFunc("/notes/{id}/view", TrackViewHandler).Methods("POST")
	router.HandleFunc("/extract-pdf", ExtractPDFText).Methods("POST")

	// Topics endpoint
	router.HandleFunc("/topics", TopicsHandler).Methods("GET")
	// Clustered notes endpoint (served from clustered_notes.json produced by ML pipeline)
	router.HandleFunc("/clustered", ClusteredNotesHandler).Methods("GET")
	// Sync categories from ML pipeline into MongoDB
	router.HandleFunc("/sync-categories", SyncCategoriesHandler).Methods("POST")
}

// CreateNoteHandler adds a new note
func CreateNoteHandler(w http.ResponseWriter, r *http.Request) {
	var note models.Note
	json.NewDecoder(r.Body).Decode(&note)
	note.CreatedAt = time.Now()
	note.UpdatedAt = time.Now()
	res, err := Collection.InsertOne(context.Background(), note)
	if err != nil {
		http.Error(w, "Failed to create note", 500)
		return
	}

	// set the generated ID back onto the note for response
	if oid, ok := res.InsertedID.(primitive.ObjectID); ok {
		note.ID = oid
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(note)
}

// ListNotesHandler returns all notes
func ListNotesHandler(w http.ResponseWriter, r *http.Request) {
	cursor, err := Collection.Find(context.Background(), bson.M{})
	if err != nil {
		http.Error(w, "Failed to fetch notes", 500)
		return
	}
	defer cursor.Close(context.Background())

	var notes []models.Note
	cursor.All(context.Background(), &notes)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(notes)
}

// UpdateNoteHandler updates a note by title
func UpdateNoteHandler(w http.ResponseWriter, r *http.Request) {
	params := mux.Vars(r)
	id := params["id"]

	objID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		http.Error(w, "Invalid ID", http.StatusBadRequest)
		return
	}

	var note models.Note
	json.NewDecoder(r.Body).Decode(&note)
	note.UpdatedAt = time.Now()

	_, err = Collection.UpdateOne(
		context.Background(),
		bson.M{"_id": objID},
		bson.M{"$set": bson.M{"title": note.Title, "content": note.Content, "updatedAt": note.UpdatedAt}, "$inc": bson.M{"editCount": 1}},
	)
	if err != nil {
		http.Error(w, "Failed to update note", 500)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(note)
}

// DeleteNoteHandler deletes a note by title
func DeleteNoteHandler(w http.ResponseWriter, r *http.Request) {
	params := mux.Vars(r)
	id := params["id"]

	objID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		http.Error(w, "Invalid ID", http.StatusBadRequest)
		return
	}

	_, err = Collection.DeleteOne(context.Background(), bson.M{"_id": objID})
	if err != nil {
		http.Error(w, "Failed to delete note", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// TopicsHandler serves topics.json contents
func TopicsHandler(w http.ResponseWriter, r *http.Request) {
	data, err := os.ReadFile("topics.json")
	if err != nil {
		http.Error(w, "Failed to read topics", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.Write(data)
}

// ClusteredNotesHandler serves clustered_notes.json produced by the ML pipeline
func ClusteredNotesHandler(w http.ResponseWriter, r *http.Request) {
	data, err := os.ReadFile("clustered_notes.json")
	if err != nil {
		// try alternative filename
		data, err = os.ReadFile("clustered_notes.json")
		if err != nil {
			http.Error(w, "Failed to read clustered notes", http.StatusInternalServerError)
			return
		}
	}

	w.Header().Set("Content-Type", "application/json")
	w.Write(data)
}

// TrackViewHandler tracks note views and updates engagement metrics
func TrackViewHandler(w http.ResponseWriter, r *http.Request) {
	params := mux.Vars(r)
	id := params["id"]

	objID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		http.Error(w, "Invalid ID", http.StatusBadRequest)
		return
	}

	// Parse optional timeSpent from request body
	var payload struct {
		TimeSpent int `json:"timeSpent"`
	}
	json.NewDecoder(r.Body).Decode(&payload)

	// Increment view count, update last viewed, and add time spent
	update := bson.M{
		"$inc": bson.M{"viewCount": 1},
		"$set": bson.M{"lastViewed": time.Now()},
	}
	if payload.TimeSpent > 0 {
		update["$inc"].(bson.M)["timeSpent"] = payload.TimeSpent
	}

	_, err = Collection.UpdateOne(
		context.Background(),
		bson.M{"_id": objID},
		update,
	)
	if err != nil {
		http.Error(w, "Failed to track view", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(bson.M{"success": true})
}

// SyncCategoriesHandler syncs clustering results from clustered_notes.json into MongoDB
func SyncCategoriesHandler(w http.ResponseWriter, r *http.Request) {
	// Read clustered_notes.json
	data, err := os.ReadFile("clustered_notes.json")
	if err != nil {
		http.Error(w, "Failed to read clustered_notes.json", http.StatusInternalServerError)
		return
	}

	// Parse JSON array of notes with topics
	var clusteredNotes []map[string]interface{}
	err = json.Unmarshal(data, &clusteredNotes)
	if err != nil {
		http.Error(w, "Failed to parse clustered_notes.json", http.StatusBadRequest)
		return
	}

	// Update MongoDB with topic assignments
	updateCount := 0
	for _, noteData := range clusteredNotes {
		noteIDStr, ok := noteData["_id"].(string)
		if !ok {
			continue
		}

		objID, err := primitive.ObjectIDFromHex(noteIDStr)
		if err != nil {
			continue
		}

		// Extract topic (may be float64 from JSON)
		topic := 0
		if topicVal, ok := noteData["topic"]; ok {
			switch v := topicVal.(type) {
			case float64:
				topic = int(v)
			case int:
				topic = v
			}
		}

		// Update MongoDB
		_, err = Collection.UpdateOne(
			context.Background(),
			bson.M{"_id": objID},
			bson.M{"$set": bson.M{"topic": topic}},
		)
		if err == nil {
			updateCount++
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(bson.M{
		"success": true,
		"message": fmt.Sprintf("Synced %d notes with topic assignments", updateCount),
		"synced":  updateCount,
	})
}
