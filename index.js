const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 5000;

// ---------- MIDDLEWARE ----------
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "https://perfect-painters-client.vercel.app",
    ], // allow frontend
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);
app.use(express.json());

// ---------- DATABASE ----------
const uri = `mongodb+srv://perfectDBUser:IwljyWq6LIlQ9IA9@cluster0.twm2yvw.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

// ---------- JWT VERIFY FUNCTION ----------
function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).send({ message: "unauthorized access" });
  }
  const token = authHeader.split(" ")[1];

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
    if (err) {
      return res.status(403).send({ message: "Forbidden access" });
    }
    req.decoded = decoded;
    next();
  });
}

// ---------- MAIN SERVER FUNCTION ----------
async function run() {
  try {
    const serviceCollection = client
      .db("perfectPainters")
      .collection("services");

    // Generate JWT
    app.post("/jwt", (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1h",
      });
      res.send({ token });
    });

    // Get all services
    app.get("/services", async (req, res) => {
      const query = {};
      const cursor = serviceCollection.find(query);
      const services = await cursor.toArray();
      res.send(services);
    });

    // Get single service by ID
    app.get("/services/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const service = await serviceCollection.findOne(query);
      res.send(service);
    });

    // Get limited services (for home page)
    app.get("/limitServices", async (req, res) => {
      const size = parseInt(req.query.size) || 3;
      const query = {};
      const cursor = serviceCollection.find(query);
      const services = await cursor
        .sort({ service_id: -1 })
        .limit(size)
        .toArray();
      res.send(services);
    });
  } finally {
    // Do nothing, let Node handle connection
  }
}

run().catch((err) => console.error(err));

// ---------- ROOT ROUTE ----------
app.get("/", (req, res) => {
  res.send("Perfect Painters Server is running ✅");
});

// ---------- START SERVER ----------
app.listen(port, () => {
  console.log(`Perfect Painters server running on port ${port}`);
});
