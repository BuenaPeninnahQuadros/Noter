package models

import (
    "time"

    "go.mongodb.org/mongo-driver/bson/primitive"
)

// Note represents a note in the database
type Note struct {
    ID        primitive.ObjectID `json:"id,omitempty" bson:"_id,omitempty"`
    Title     string             `json:"title" bson:"title"`
    Content   string             `json:"content" bson:"content"`
    CreatedAt time.Time          `json:"createdAt" bson:"createdAt"`
    UpdatedAt time.Time          `json:"updatedAt" bson:"updatedAt"`
    Topic     int                `json:"topic" bson:"topic"`
    BackgroundColor string             `bson:"backgroundColor,omitempty" json:"backgroundColor"`
    ViewCount int                `json:"viewCount" bson:"viewCount"`
    LastViewed time.Time         `json:"lastViewed" bson:"lastViewed"`
    EditCount int                `json:"editCount" bson:"editCount"`
    TimeSpent int                `json:"timeSpent" bson:"timeSpent"`
    RevisitScore float64         `json:"revisitScore,omitempty" bson:"revisitScore,omitempty"`
}
