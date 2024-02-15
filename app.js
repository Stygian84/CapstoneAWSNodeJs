const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
const https = require("https");

require("dotenv").config();

const port = process.env.PORT || 3001;
const app = express();
app.use(cors());

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  sslmode: "require",
});

app.get("/api/data/:tableName", async (req, res) => {
  const { tableName } = req.params;

  try {
    // Use parameterized query to avoid SQL injection
    const result = await pool.query(`SELECT * FROM public."${tableName}"`);
    res.json(result.rows);
  } catch (error) {
    console.error("Error executing query:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//api/query?sqlQuery=SELECT%20*%20FROM%20public."PlantData"
app.get("/api/query", async (req, res) => {
  const { sqlQuery } = req.query;

  try {
    // Use parameterized query to avoid SQL injection
    const decodedQuery = decodeURIComponent(sqlQuery);
    const result = await pool.query(decodedQuery);
    res.json(result.rows);
  } catch (error) {
    console.error("Error executing query:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

/*
list query needed for each page
ROW : rowdata + status
Status : rowdata
PlantDetails : Plantdata
plantdetails graph -> plantdata (plantid,timestamp, value)

propertiestable -> all
*/

//Row Page (display each row and its overall status)
app.get("/api/row", async (req, res) => {
  try {
    const query = {
      text: `SELECT RowID, Status
      FROM public."RowData"
      ORDER BY RowID ASC;
      `,
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
    let queryText = `SELECT * FROM public."RowData"`;

    if (rowId) {
      queryText += ` WHERE RowID = $1 ORDER BY RowID ASC`;
      const queryValues = [rowId];
      const result = await pool.query({ text: queryText, values: queryValues });
      res.json(result.rows);
    } else {
      queryText += ` ORDER BY RowID ASC`;
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
app.get("/api/plant", async (req, res) => {
  try {
    const { rowId, plantId, property } = req.query;
    let queryText = `SELECT * FROM public."PlantData"`;

    if (rowId && plantId && property) {
      const subQuery = `SELECT timestamp, ${property}
      FROM public."PlantData"
      WHERE RowID = $1 AND PlantID = $2
      ORDER BY timestamp ASC`;
      const queryValues = [rowId, plantId];
      const result = await pool.query({ text: subQuery, values: queryValues });
      res.json(result.rows);
    } else if (rowId && !plantId && !property) {
      queryText = `SELECT * FROM public."PlantData" pd
                   JOIN (
                   SELECT PlantID, MAX(Timestamp) AS latest_timestamp
                   FROM public."PlantData"
                   WHERE RowID = $1
                   GROUP BY PlantID
                   ) AS latest ON pd.PlantID = latest.PlantID AND pd.Timestamp = latest.latest_timestamp
                   ORDER BY pd.PlantID ASC;`;
      const queryValues = [rowId];
      const result = await pool.query({ text: queryText, values: queryValues });
      res.json(result.rows);
    } else {
      queryText += ` ORDER BY RowID ASC`;
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
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
