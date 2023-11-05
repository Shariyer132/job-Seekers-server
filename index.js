const express = require('express')
var cors = require('cors')
const app = express()
const port = process.env.PORT 

// middleware
app.use(express.json());
app.use(cors());


app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})