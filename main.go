package main

import (
	"context"
	"fmt"
	"log"
	"os"

	"github.com/gofiber/fiber/v2"
	"github.com/joho/godotenv"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type Todo struct {
	ID        primitive.ObjectID `json:"_id,omitempty" bson:"_id,omitempty"`
	Completed bool               `json:"completed"`
	Body      string             `json:"body"`
}

var collection *mongo.Collection

func main() {
	fmt.Println("Hello world")
	err := godotenv.Load(".env")
	if err != nil {
		log.Fatal("error loading .env file", err)
	}

	MONGODB_URI := os.Getenv("MONGODB_URI")
	clientOptions := options.Client().ApplyURI(MONGODB_URI)

	client, err := mongo.Connect(context.Background(), clientOptions)
	if err != nil {
		log.Fatal(err)
	}

	defer client.Disconnect(context.Background())

	err = client.Ping(context.Background(), nil)
	if err != nil {
		log.Fatal(err)
	}

	fmt.Println("Connected to Mongodb atlas")

	collection = client.Database("golanf_db").Collection("todos")

	app := fiber.New()

	app.Get("/api/todos", getTodos)
	app.Post("/api/todos", createTodo)
	//app.Get("/api/todos", getTodos)
	//app.Get("/api/todos", getTodos)
	//
	port := os.Getenv("PORT")

	if port == "" {
		port = "5000"
	}
	log.Fatal(app.Listen("0.0.0.0:" + port))
}

func getTodos(c *fiber.Ctx) error {
	var todos []Todo

	cursor, err := collection.Find(context.Background(), bson.M{})
	if err != nil {
		return err
	}
	defer cursor.Close(context.Background())

	for cursor.Next(context.Background()) {
		var todo Todo
		if err := cursor.Decode(&todo); err != nil {
			return err
		}
		todos = append(todos, todo)
	}
	return c.JSON(todos)
}

func createTodo(c *fiber.Ctx) error {
	todo := new(Todo)

	if err := c.BodyParser(todo); err != nil {
		log.Printf("Error parsing request body: %v", err)

		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid reqeust body"})
	}

	todo.ID = primitive.NilObjectID

	if todo.Body == "" {
		return c.Status(400).JSON(fiber.Map{"error": "Todo body cannot be empty"})
	}

	inserResult, err := collection.InsertOne(context.Background(), todo)
	if err != nil {
		if mongo.IsDuplicateKeyError(err) {
			log.Printf("Duplicate key error during todo creation %v", err)
			return c.Status(fiber.StatusConflict).JSON(fiber.Map{"error": "A todo with this ID aready exist"})
		}
		log.Printf("Error inserting todo into the databse %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to create todo because of databse error"})
	}

	if objectID, ok := inserResult.InsertedID.(primitive.ObjectID); ok {
		todo.ID = objectID
	} else {
		log.Printf("Inserted ID is not of type primitive.ObjectID: %v", err)
	}

	return c.Status(201).JSON(todo)
}
