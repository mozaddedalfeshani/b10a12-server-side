const dotenv = require("dotenv");
dotenv.config(); // Load .env.local file

const express = require("express");
// use cors to allow cross origin resource sharing
const cors = require("cors");
var jwt = require("jsonwebtoken");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const cookieParser = require("cookie-parser");
const app = express();
const bcrypt = require("bcryptjs"); // For password hashing
const bodyParser = require("body-parser"); // Body parser for handling JSON data

// Middleware for parsing JSON requests
app.use(bodyParser.json());

const port = process.env.PORT || 9000;
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

console.log(process.env.MONGO_USERNAME);
console.log(process.env.MONGO_PASS);
console.log(process.env.STRIPE_SECRET_KEY);
const uri = `mongodb+srv://${process.env.MONGO_USERNAME}:${process.env.MONGO_PASS}@tourism.ipsfd.mongodb.net/?retryWrites=true&w=majority&appName=tourism`;
const client = new MongoClient(uri);

// client.connect((err) => {
//   if (err) {
//     console.error("Failed to connect to MongoDB", err);
//     process.exit(1);
//   }
//   console.log("Connected to MongoDB");
// });

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

// The following below code just give total count of each collection

// app.get("/total/totalpayment", async (req, res) => {
//   const collection = database.collection("payment");
//   const result = await collection.find().toArray();
//   res.send(result);
// });

app.get("/total/totaltg", async (req, res) => {
  const collection = database.collection("tourGuides");
  const result = await collection.find().toArray();
  // total count of tour guide
  const totals = result.length;

  const total = totals.toString();
  res.send(total);
});

app.get("/total/totalpackages", async (req, res) => {
  const collection = database.collection("packages");
  const result = await collection.find().toArray();
  // total count of packages
  const totals = result.length;

  const total = totals.toString();
  res.send(total);
});

app.get("/total/totalclients", async (req, res) => {
  const collection = database.collection("users");
  const result = await collection.find().toArray();
  // total count of clients
  const totals = result.length;

  const total = totals.toString();
  res.send(total);
});

app.get("/total/totalstories", async (req, res) => {
  const collection = database.collection("stories");
  const result = await collection.find().toArray();
  // total count of stories
  const totals = result.length;

  const total = totals.toString();
  res.send(total);
});

//////////////////////////////////////////////////
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
      // add which type of user tourist , or tour guide
      userType: "tourist",
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

// cancel booking by index and email
app.delete("/cancelBooking", async (req, res) => {
  const { email, packageName, tourDate } = req.body;

  if (!email || !packageName || !tourDate) {
    return res.status(400).send({
      success: false,
      message: "Missing required fields: email, packageName, or tourDate",
    });
  }

  try {
    const db = client.db("WanderWise");
    const collection = db.collection("users");

    // Update document to remove one booking
    const result = await collection.updateOne(
      { email: email }, // Match user by email
      { $pull: { booking: { packageName, tourDate } } } // Remove specific booking
    );

    if (result.modifiedCount > 0) {
      res.status(200).send({
        success: true,
        message: "Booking deleted successfully",
      });
    } else {
      res.status(404).send({
        success: false,
        message: "Booking not found",
      });
    }
  } catch (error) {
    console.error("Error deleting booking:", error);
    res.status(500).send({
      success: false,
      message: "Internal server error",
    });
  }
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

// PAYMENT ZONE

app.post("/create-payment-intent", async (req, res) => {
  const { items } = req.body;

  const { price } = req.body;
  const amount = parseInt(price * 100);

  // Create a PaymentIntent with the order amount and currency
  const paymentIntent = await stripe.paymentIntents.create({
    amount: amount,
    currency: "usd",
    payment_method_types: ["card"],
  });

  res.send({
    clientSecret: paymentIntent.client_secret,
  });
});

// Tour Guide Applications
app.post("/tgApplication", async (req, res) => {
  const data = req.body;
  console.log(data);
  try {
    const collection = database.collection("tgApplications");
    const result = await collection.insertOne(data);
    res.send({
      success: true,
      message: "Application submitted successfully",
      result: result,
    });
  } catch {
    res.status(500).send("Error submitting application");
  }
});

app.get("/client/userStories", async (req, res) => {
  const collection = database.collection("stories");
  const result = await collection.find().toArray();
  res.send(result);
});

// server respons
app.get("/", (req, res) => {
  res.send("Hello World! 3");
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
