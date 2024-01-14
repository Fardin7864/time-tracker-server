const express = require("express");
const app = express();
const jwt = require("jsonwebtoken");
const cors = require("cors");
require("dotenv").config();
var cookieParser = require("cookie-parser");
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://fardin18:hamba78@cluster0.7k1zdza.mongodb.net/?retryWrites=true&w=majority`;


app.use(express.json());
// app.use(cookieParser());
app.use(
  cors({
    origin: ["http://localhost:5173"],
    credentials: true,
    methods: ["GET", "POST", "DELETE", "UPDATE", "PUT", "PATCH"],
  })
);

//custom middlewares
const verify = (req, res, next) => {
  const token = req.cookies["ema-zohan"];
  if (!token) {
    return res.status(401).send({ message: "unauthorized" });
  }
  jwt.verify(token, process.env.API_SECRET_KEY, (err, decoded) => {
    if (err) {
      console.error("JWT verification error:", err);
      return res.status(401).send("Forbidden");
    }
    // console.log(decoded.email)
    res.user = decoded;
    next();
  });
};

// app.use(verify)

app.get("/", async (req, res) => {
  res.send("Time tracker is runig!!");
});

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // await client.connect();

    //collection
    const users = client.db("tracker").collection("users");

    //Auth related api
    app.post("/api/v1/jwt", async (req, res) => {
      const email = req.body.email;
      // console.log(email)
      const token = jwt.sign({ email }, process.env.API_SECRET_KEY, {
        expiresIn: "1h",
      });
      try {
        // console.log(token);
        res
          .cookie("ema-zohan", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
          })
          .send(token);
      } catch (error) {}
    });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );

    //user api
    app.post("/api/v1/user", async (req, res) => {
      console.log("clicked on post!");
      try {
        const user = req.body;
        const result = await users.insertOne(user);
        res.send(result);
      } catch (error) {
        console.error("Error saving time:", error);
        res.status(500).send({ success: false, message: "Error saving time." });
      }
    });

    //get user api 
    app.get("/api/v1/user/:userId", async (req, res) => {
      const userId = req.params.userId;
      try {
        const user = await users.findOne({ _id: new ObjectId(userId) });
        if (!user) {
          return res.status(404).send({ success: false, message: "User not found." });
        }
        res.json(user);
      } catch (error) {
        console.error("Error retrieving user:", error);
        res.status(500).send({ success: false, message: "Error retrieving user." });
      }
    });
    //get user api by email
    app.get("/api/v1/user/:email", async (req, res) => {
      const email = req.params.email;
      try {
        const user = await users.findOne({ email: new ObjectId(email) });
        if (!user) {
          return res.status(404).send({ success: false, message: "User not found." });
        }
        res.json(user);
      } catch (error) {
        console.error("Error retrieving user:", error);
        res.status(500).send({ success: false, message: "Error retrieving user." });
      }
    });

     // Update Single Property of User API
     app.put("/api/v1/user/:userId/update-profile", async (req, res) => {
      const userId = req.params.userId;
      const { name } = req.body;

      try {
        const result = await users.updateOne(
          { _id: new ObjectId(userId) },
          { $set: { name: name } }
        );

        if (result.matchedCount === 0) {
          return res.status(404).send({ success: false, message: "User not found." });
        }

        res.json({ success: true, message: "User profile updated successfully." });
      } catch (error) {
        console.error("Error updating user profile:", error);
        res.status(500).send({ success: false, message: "Error updating user profile." });
      }
    });




  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.listen(port, () => {
  console.log(`Server is runnig on port: ${port}`);
});
