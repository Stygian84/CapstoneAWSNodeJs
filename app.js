// Init
const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
const bodyParser = require("body-parser");
const https = require("https");
const { Firestore } = require("@google-cloud/firestore");
var admin = require("firebase-admin");
var serviceAccount = require("./key.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});
const firestore = new Firestore({ projectId: "capstonenotification-bdce8", keyFilename: "./key.json" });
require("dotenv").config();
const port = process.env.PORT || 3001;
const app = express();
app.use(cors());
app.use(bodyParser.json());
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  sslmode: "require",
});

// app.get("/api/data/:tableName", async (req, res) => {
//   const { tableName } = req.params;

//   try {
//     // Use parameterized query to avoid SQL injection
//     const result = await pool.query(`SELECT * FROM public."${tableName}"`);
//     res.json(result.rows);
//   } catch (error) {
//     console.error("Error executing query:", error);
//     res.status(500).json({ error: "Internal Server Error" });
//   }
// });

// //api/query?sqlQuery=SELECT%20*%20FROM%20public."PlantData"
// app.get("/api/query", async (req, res) => {
//   const { sqlQuery } = req.query;

//   try {
//     // Use parameterized query to avoid SQL injection
//     const decodedQuery = decodeURIComponent(sqlQuery);
//     const result = await pool.query(decodedQuery);
//     res.json(result.rows);
//   } catch (error) {
//     console.error("Error executing query:", error);
//     res.status(500).json({ error: "Internal Server Error" });
//   }
// });

/*
list query needed for each page
ROW : rowdata + status
Status : rowdata
PlantDetails : Plantdata
plantdetails graph -> plantdata (plantid,timestamp, value)

propertiestable -> all
*/

//Row Page (display each row and its overall status)
// app.get("/api/row", async (req, res) => {
//   try {
//     const query = {
//       text: `SELECT RowID, Status
//       FROM public."RowData"
//       ORDER BY RowID ASC;
//       `,
//     };

//     const result = await pool.query(query);
//     res.json(result.rows);
//   } catch (error) {
//     console.error("Error executing query:", error);
//     res.status(500).json({ error: "Internal Server Error" });
//   }
// });
app.get("/api/level", async (req, res) => {
  try {
    const query = {
      text: `SELECT LevelID, Status
      FROM public."LevelData"
      ORDER BY LevelID ASC;
      `,
    };

    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error("Error executing query:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});
app.get("/api/parameter", async (req, res) => {
  try {
    const query = {
      text: `WITH LatestTimestamp AS (
        SELECT RowID, LevelID, MAX(Timestamp) AS LatestTimestamp
        FROM public."RowData"
        GROUP BY RowID, LevelID
    )
    SELECT yt.Status, lt.RowID, lt.LevelID
    FROM LatestTimestamp lt
    INNER JOIN public."RowData" yt ON lt.RowID = yt.RowID AND lt.LevelID = yt.LevelID AND lt.LatestTimestamp = yt.Timestamp
    ORDER BY lt.LevelID ASC, lt.RowID ASC;`,
    };

    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error("Error executing query:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});
//Status Page (display specific row status)
// /api/status -> all rowdata
// /api/status?rowId=123 -> only 1 row
app.get("/api/status", async (req, res) => {
  try {
    const { rowId } = req.query;
    let queryText = `SELECT * FROM public."LevelData"`;

    if (rowId) {
      queryText += ` WHERE LevelID = $1 ORDER BY LevelID ASC`;
      const queryValues = [rowId];
      const result = await pool.query({ text: queryText, values: queryValues });
      res.json(result.rows);
    } else {
      queryText += ` ORDER BY LevelID ASC`;
      const result = await pool.query(queryText);
      res.json(result.rows);
    }
  } catch (error) {
    console.error("Error executing query:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// GET /api/plant  -> all data
// GET /api/plant?rowId=123 -> specific rowid plants latest timestamp details
// GET api/plant?rowId=1&plantId=4&property=temperature -> specific plant id in a specific rowid with specific data (eg humidity) and all timestamp
app.get("/api/row", async (req, res) => {
  try {
    const { levelId, rowId, property } = req.query;
    let queryText = `SELECT * FROM public."RowData"`;

    if (levelId && rowId && property) {
      const subQuery = `SELECT timestamp, ${property}
      FROM public."RowData"
      WHERE LevelID = $1 AND RowID = $2
      ORDER BY timestamp ASC`;
      const queryValues = [levelId, rowId];
      const result = await pool.query({ text: subQuery, values: queryValues });
      res.json(result.rows);
    } else if (levelId && rowId && !property) {
      const subQuery = `SELECT *
      FROM public."RowData"
      WHERE LevelID = $1 AND RowID = $2
        AND timestamp = (
          SELECT MAX(timestamp)
          FROM public."RowData"
          WHERE LevelID = $1 AND RowID = $2
        );`;
      const queryValues = [levelId, rowId];
      const result = await pool.query({ text: subQuery, values: queryValues });
      res.json(result.rows);
    } else if (levelId && !rowId && !property) {
      queryText = `SELECT * FROM public."RowData" pd
                   JOIN (
                   SELECT RowID, MAX(Timestamp) AS latest_timestamp
                   FROM public."RowData"
                   WHERE LevelID = $1
                   GROUP BY RowID
                   ) AS latest ON pd.RowID = latest.RowID AND pd.Timestamp = latest.latest_timestamp
                   ORDER BY pd.RowID ASC;`;
      const queryValues = [levelId];
      const result = await pool.query({ text: queryText, values: queryValues });
      res.json(result.rows);
    } else {
      queryText += ` ORDER BY LevelID ASC`;
      const result = await pool.query(queryText);
      res.json(result.rows);
    }
  } catch (error) {
    console.error("Error executing query:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//PropertiesTable
app.get("/api/table", async (req, res) => {
  try {
    const query = {
      text: `
      SELECT * FROM public.SoilProperties
      ORDER BY id ASC
      `,
    };

    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error("Error executing query:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// POST
// Define a route to handle POST requests to create a new record in the database
app.post("/post/plant", async (req, res) => {
  try {
    const { RowID, LevelID, plantName, soilPH, soilMoisture, temperature, humidity, airQuality, status } = req.body;

    // Insert the new record into the database
    const query = `
      INSERT INTO public."RowData" (RowID, LevelID, PlantName, SoilPH, SoilMoisture, Temperature, Humidity, AirQuality, Status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;
    const values = [RowID, LevelID, plantName, soilPH, soilMoisture, temperature, humidity, airQuality, status];
    const result = await pool.query(query, values);

    // Respond with the newly created record
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error executing SQL query:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Sample POST script
// import requests

// # Define the URL of your Node.js server
// url = 'http://localhost:3000/plants'

// # Define the JSON data to send in the request body
// data = {
//     'plantName': 'Sample Plant',
//     'soilPH': 6.5,
//     'soilMoisture': 0.5,
//     'temperature': 25.0,
//     'humidity': 50.0,
//     'airQuality': 30.0,
//     'status': 'Healthy'
// }

// # Send a POST request with JSON data
// response = requests.post(url, json=data)

// # Check the response status code
// if response.status_code == 201:
//     print('Plant data uploaded successfully:', response.json())
// else:
//     print('Failed to upload plant data:', response.status_code, response.text)

// Start the server
//--------------------HTTPS--------------------*/

// try {
//   const cred = {
//     key: process.env.HTTPS_KEY,
//     cert: process.env.HTTPS_CERT
//   };

//   const httpsServer = https.createServer(cred, app);

//   httpsServer.listen(process.env.PORT_HTTPS, () => {
//     console.log(`HTTPS server listening on port ${process.env.PORT_HTTPS}`);
//   });
// } catch (err) {
//   console.log('HTTPS err:', err.stack);
// }

// app.listen(port, () => {
//   console.log(`HTTP server listening on port ${port}`);
// });

// Firebase

async function saveTokenToFirestore(userId, token) {
  const docRef = firestore.collection("userToken").doc(userId);
  await docRef.set({ token });
}

// Function to fetch token from Firestore
async function getTokenFromFirestore(userId) {
  const docRef = firestore.collection("userToken").doc(userId);
  const doc = await docRef.get();
  if (doc.exists) {
    return doc.data().token;
  } else {
    return null;
  }
}

app.post("/post/token", async (req, res) => {
  try {
    const { UserID, token } = req.body;
    await saveTokenToFirestore(UserID, token);
    res.status(201);
  } catch (error) {
    console.error("Error updating token:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Set up polling interval
const pollingInterval = 600000; // 10 minute
setInterval(async () => {
  try {
    // Perform the check for each collection
    const collections = ["Level2", "Level3"];
    const results = [];
    const tokenCollections = [];
    const zeroValue = [];
    const collectionTokenRef = firestore.collection("userToken");
    const snapshotToken = await collectionTokenRef.get();
    const tokenValues = snapshotToken.docs.map((doc) => doc.data().token);
    tokenCollections.push(tokenValues);

    for (const collectionName of collections) {
      const collectionRef = firestore.collection(collectionName);
      const snapshot = await collectionRef.get();
      const documents = snapshot.docs.map((doc) => doc.data());
      const hasZeroOrBelow = documents.some((doc) => doc.value <= 0);
      results.push({ collectionName, hasZeroOrBelow });
      if (hasZeroOrBelow) {
        snapshot.forEach((doc) => {
          const data = doc.data();
          if (data.value <= 0) {
            zeroValue.push({ collectionName, docId: doc.id });
          }
        });

        //send notif to all tokens in tokencollection
        tokenValues.forEach(async (token) => {
          try {
            // Iterate over each zero value and send a notification
            zeroValue.forEach(async (item) => {
              const collectionName = item.collectionName;
              const docId = item.docId;
              const body = `${collectionName} - Document ID: ${docId}`;

              await sendNotification(token, "Time to Harvest", body);
              console.log("Notification sent to token:", token);
            });
          } catch (error) {
            console.error("Error sending notification:", error);
          }
        });
      } else {
        continue;
      }
    }
    console.log(zeroValue);
  } catch (error) {
    console.error("Error during polling:", error);
  }
}, pollingInterval);
// Polling Notif ends here

app.listen(port, () => {
  console.log(`Server is running on port : ${port}`);
});

async function sendNotification(token, title, body) {
  try {
    await admin.messaging().send({
      token: token,
      notification: {
        title: title,
        body: body,
      },
    });
    console.log("Notification sent successfully");
  } catch (error) {
    console.error("Error sending notification:", error);
  }
}
