const express = require('express');
var cors = require('cors');
var jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express()
require('dotenv').config();
const port = process.env.PORT || 5000;

// middleware
app.use(express.json());
app.use(cors({
  origin: [
    'http://localhost:5173'
  ],
  credentials: true
}));
app.use(cookieParser());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.fbkj2kv.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

const verifyToken = async (req, res, next) => {
  const token = req.cookies?.token;
  console.log('token in the middleware', token);
  if (!token) {
    return res.status(401).send({ message: 'not authorized' })
  }
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    // error
    if (err) {
      return res.status(401).send({ message: 'unAuthorized' })
    }
    console.log('value in token', decoded);
    req.user = decoded;
    next();
  })
}

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const jobCollections = client.db("onlineMarket").collection("jobs");
    const bidJobsCollections = client.db("onlineMarket").collection("bidJobs");
    // auth related api
    app.post('/jwt', async (req, res) => {
      const user = req.body;
      console.log('user called token', user);
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' })
      res.cookie('token', token, {
        httpOnly: true,
        secure: true,
        sameSite: 'none',

      })
        .send({ success: true })
    })

    app.post('/logout', async (req, res) => {
      const user = req.body;
      console.log(user, 'log out user');
      res.clearCookie('token', { maxAge: 0, secure: true, sameSite: 'none' }).send({ success: true })
    })

    app.get('/jobs', async (req, res) => {
      const result = await jobCollections.find().toArray();
      res.send(result);
    })

    app.post('/jobs', async (req, res) => {
      const job = req.body;
      console.log(job);
      const result = await jobCollections.insertOne(job);
      res.send(result)
    })

    app.get('/jobs/:id', async (req, res) => {
      const id = req.params;
      const query = { _id: new ObjectId(id) };
      const result = await jobCollections.findOne(query);
      req.send(result)
    })

    app.patch('/jobs/:id', async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const job = req.body;
      console.log(job);
      const updateDoc = {
        $set: {
          email: job.ownerEmail,
          jobTitle: job.jobTitle,
          deadline: job.deadline,
          category: job.category,
          shortDescription: job.shortDescription,
          minimumPrice: job.minimumPrice,
          maximumPrice: job.maximumPrice,
        }
      }
      const result = await jobCollections.updateOne(filter, updateDoc);
      res.send(result)
    })

    app.delete('/jobs/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await jobCollections.deleteOne(query);
      res.send(result)
    })

    app.get('/bidJobs', verifyToken, async (req, res) => {
      console.log(req.user?.email, req.query?.email);
      // console.log(req);
      // if (req.query.email !== req.user.email || req.query?.ownerEmail !== req.user.email) {
      //   return res.status(403).send({ message: 'forbidden access' })
      // }
      let query = {};
      if (req.query?.email || req.query?.ownerEmail) {
        query = { email: req.query?.email };
      };
      const result = await bidJobsCollections.find(query).toArray();
      res.send(result);
    })

    app.post('/bidJobs', async (req, res) => {
      const bidJobs = req.body;
      const result = await bidJobsCollections.insertOne(bidJobs);
      res.send(result);
    })

    app.patch('/bidJobs/:id', async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updatedBooking = req.body;
      const updateDoc = {
        $set: {
          status: updatedBooking.status
        },
      };
      const result = await bidJobsCollections.updateOne(filter, updateDoc);
      res.send(result)
    })



    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);



app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})