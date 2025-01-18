const express = require("express");
const dotenv = require("dotenv");
// use cors to allow cross origin resource sharing
const cors = require("cors");
var jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const app = express();
const bcrypt = require("bcryptjs"); // For password hashing
const bodyParser = require("body-parser"); // Body parser for handling JSON data

// Middleware for parsing JSON requests
app.use(bodyParser.json());
dotenv.config();

const port = process.env.PORT || 9000;
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const uri =
  "mongodb+srv://imurad2020:yJfOu6iDDEA0qGEZ@tourism.ipsfd.mongodb.net/?retryWrites=true&w=majority&appName=tourism";
const client = new MongoClient(uri);

client.connect((err) => {
  if (err) {
    console.error("Failed to connect to MongoDB", err);
    process.exit(1);
  }
  console.log("Connected to MongoDB");
});

app.use(cors());
app.use(express.json());
app.use(cookieParser());

// all data from backend

app.get("/api/tg", async (req, res) => {
  try {
    const collection = database.collection("tourGuides");
    const result = await collection.find().toArray();
    res.send(result);
  } catch (error) {
    res.status(500).send("Error fetching data");
  }
});

// tg with id
app.get("/api/tg/:id", async (req, res) => {
  try {
    const collection = database.collection("tourGuides");
    const id = req.params.id;
    const result = await collection.findOne({ _id: new ObjectId(id) });
    if (!result) {
      return res.status(404).send("Tour Guide not found");
    }
    res.send(result);
  } catch (error) {
    res.status(500).send("Error fetching data");
  }
});
const database = client.db("WanderWise");
// get samples
app.get("/api/samples", async (req, res) => {
  const collection = database
    .collection("packages")
    .aggregate([{ $sample: { size: 3 } }]);
  const result = await collection.toArray();
  //   const result = await collection.find(query).toArray();
  res.send(result);
});

app.get("/client/homeStories", async (req, res) => {
  const collection = database.collection("stories");
  // only 4 data
  const result = await collection.find().limit(4).toArray();
  //   const result = await collection.find().toArray();
  res.send(result);
});

app.get("/packages", async (req, res) => {
  const collection = database.collection("packages");
  const result = await collection.find().toArray();
  res.send(result);
});

app.get("/packages/:id", async (req, res) => {
  try {
    const id = req.params.id; // Get the ID from the request parameters

    const collection = database.collection("packages");

    // Use findOne with a filter to match the `id`
    const result = await collection.findOne({ _id: new ObjectId(id) });

    if (!result) {
      return res.status(404).send("Package not found");
    }

    res.send(result);
  } catch (error) {
    res.status(500).send("Error fetching data");
  }
});

//  /client/userStories
// all about client

// client register and check user if exist for return

app.post("/client/register", async (req, res) => {
  const { email, name, password, iconUrl } = req.body; // Extract data from request body

  // Validate required fields
  if (!email || !name || !password) {
    return res
      .status(400)
      .send({ success: false, message: "Missing required fields" });
  }

  try {
    const database = client.db("WanderWise");
    const collection = database.collection("users");

    // Check if the user already exists
    const existingUser = await collection.findOne({ email });
    if (existingUser) {
      return res
        .status(400)
        .send({ success: false, message: "User already exists" });
    }

    // Hash the password before saving
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user object
    const newUser = {
      email,
      name,
      password: hashedPassword,
      icon: iconUrl || "", // Default to an empty string if no icon URL is provided
      stories: [], // Initialize as an empty array
      booking: [], // Initialize as an empty array
    };

    // Insert the new user into the database
    await collection.insertOne(newUser);

    // Generate JWT token
    const token = jwt.sign({ email: newUser.email }, process.env.JWT_SECRET, {
      expiresIn: "12h",
    });

    res.status(201).send({
      success: true,
      message: "User registered successfully",
      newUser,
      token, // Send the token in the response
    });
  } catch (error) {
    console.error("Error registering user:", error);
    res.status(500).send({ success: false, message: "Internal Server Error" });
  }
});

// client info sent to web by email
app.get("/clientinfo/:email", async (req, res) => {
  try {
    const email = req.params.email;
    const collection = database.collection("users");
    const query = {
      email: email,
    };
    const result = await collection.findOne(query);
    if (!result) {
      return res.status(404).send("User not found");
    }
    res.send(result);
  } catch {
    res.status(500).send("Error fetching data");
  }
});
//boooking info
app.post("/booking", async (req, res) => {
  const values = req.body;
  const collection = database.collection("users");
  // insert / append booking info to user booking array
  const result = await collection.updateOne(
    { email: values.touristEmail },
    { $push: { booking: values } }
  );
  res.send(result);
});

// client user stories
app.get("/client/userStories/:email", async (req, res) => {
  try {
    const email = req.params.email;
    const collection = database.collection("stories");
    const query = {
      email: email,
    };
    const result = await collection.find(query).toArray();
    res.send(result);
  } catch {
    res.status(500).send("Error fetching data");
  }
});

app.get("/client/userStories", async (req, res) => {
  const collection = database.collection("stories");
  const result = await collection.find().toArray();
  res.send(result);
});

// server respons
app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
