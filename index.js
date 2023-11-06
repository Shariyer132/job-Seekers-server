const express = require('express');
var cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express()
require('dotenv').config();
const port = process.env.PORT || 5000;

// middleware
app.use(express.json());
app.use(cors());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.fbkj2kv.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const jobCollections = client.db("onlineMarket").collection("jobs");

    app.get('/jobs', async (req, res) => {
      const result = await jobCollections.find().toArray();
      res.send(result);
    })

    app.post('/jobs', async(req, res)=>{
      const job = req.body;
      console.log(job);
      const result = await jobCollections.insertOne(job);
      res.send(result)
    })

    app.get('/jobs/:id', async(req, res)=>{
      const id = req.params;
      const query = {_id: new ObjectId(id)};
      const result = await jobCollections.findOne(query);
      req.send(result)
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