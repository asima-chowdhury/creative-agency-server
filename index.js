const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs-extra');
const fileUpload = require('express-fileupload');
const MongoClient = require('mongodb').MongoClient;
require('dotenv').config();

const app = express();

app.use(bodyParser.json());
app.use(cors());
app.use(express.static('services'));
app.use(fileUpload());

const port = 5000;

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.2m5ig.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
client.connect(err => {
  const serviceCollection = client.db("creativeAgencyDB").collection("services");
  const feedbackCollection = client.db("creativeAgencyDB").collection("feedback");
  const orderCollection = client.db("creativeAgencyDB").collection("order");
  const adminCollection = client.db("creativeAgencyDB").collection("admin");
  console.log("DB connected");

  //-----------  Test DB Connection start ---------
  app.get('/', (req, res) => {
    res.send('Hi! DB is working!');
  });
  //-----------  Test DB Connection end ---------

  //-----------  admin add service start ---------
  app.post('/addService', (req, res) => {
    const file = req.files.file;
    const title = req.body.title;
    const description = req.body.description;
    // console.log(title, description, file);
    const filePath = `${__dirname}/services/${file.name}`;

    file.mv(filePath, err => {
      if (err => {
        console.log(err);
        res.status(500).send({ msg: 'Failed to upload image' });
      })

        var newImg = fs.readFileSync(filePath);
      const encImg = newImg.toString('base64');

      var image = {
        contentType: req.files.file.mimType,
        size: req.files.file.size,
        img: Buffer(encImg, 'base64')
      };
      serviceCollection.insertOne({ title, description, image })
        .then(result => {
          fs.remove(filePath, error => {
            if (error) {
              console.log(error);
              res.status(500).send({ msg: 'Failed to upload image' });
            }
            res.send(result.insertedCount > 0);
          })
        })
      // return res.send({ name: file.name, path: `/${file.name}` })
    })
  })

  app.get('/services', (req, res) => {
    serviceCollection.find({})
      .toArray((err, documents) => {
        return res.send(documents);
      })
  });
  //----------- admin add service end ---------

  //------------ Admin ServiceList show start  ----------

  app.get('/customerServiceList', (req, res) => {
    orderCollection.find({})
      .toArray((err, documents) => {
        return res.send(documents);
      })
  })
  
  //------------ Admin ServiceList show end  ----------

  //------------ Make Admin start  ----------
  app.post('/makeAdmin', (req, res) => {
    const makeAdmin = req.body;
    // console.log(makeAdmin);
    adminCollection.insertOne(makeAdmin)
      .then(result => {
        // console.log(result.insertedCount);
        res.send(result.insertedCount > 0);
      })
  })
  app.get('/showAllAdmin', (req, res) => {
    adminCollection.find({})
      .toArray((err, documents) => {
        res.send(documents);
      })
  })
  //------------ Make Admin end ----------

  //------------ Customer Order start  ----------  
  app.post('/addOrder', (req, res) => {
    const order = req.body;
    console.log(order)
    orderCollection.insertOne(order)
      .then(result => {
        // console.log(result.insertedCount);
        res.send(result.insertedCount > 0);
      })
  })
  app.get('/order', (req, res) => {
    orderCollection.find({email:req.query.email})
      .toArray((err, documents) => {
        res.send(documents);
      })
  })
  //------------ Customer Order end  ----------
  //----------- Customer feedback start ---------
  app.post('/addReview', (req, res) => {
    const name = req.body.name;
    const companyName = req.body.companyName;
    const description = req.body.description;
    // console.log(name,companyName,description);

    feedbackCollection.insertOne({ name, companyName, description })
      .then(result => {
        console.log(result);
        res.send(result.insertedCount > 0);
      })
  })

  app.get('/feedback', (req, res) => {
    feedbackCollection.find({})
      .toArray((err, documents) => {
        return res.send(documents);
      })
  })
  //------------ Customer feedback end  ----------

});

app.listen(process.env.PORT || port);