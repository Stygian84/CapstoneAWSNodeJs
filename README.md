# CapstoneAWSNodeJs  
`app.js` is to handle all necessary GET and POST requests for the [app](https://agroreach.netlify.app)
The source code for the app can be found [here](https://github.com/Stygian84/CapstoneWebApp/tree/master).

# Framework
1. Express.JS

# How to Host
1. Find a service that can host Node.JS ( like [AWS EC2](https://aws.amazon.com/pm/ec2/) and [Render](https://render.com) )
2. Follow their instructions but most of the time, only need to put `node app.js` as the start command.
3. Insert all the necessary environment variables. ( `DB_HOST`,`DB_NAME`,`DB_PASSWORD`,`DB_PORT`,`DB_USER`,`PORT` ) for the AWS RDS database.
5. Add Secret files `key.json` for the firebase/firetore credentials. 

# Notes
1. The `pushInitData` is to initialise 7 Harvest Days for all the Rows for each level in the Firebase.
2. Firebase database is mainly for notification features (userToken + track harvest time for each row) and Raspberry Pi Pump control (True or False).
3. AWS RDS stores the rest of the data ( data gathered by the sensors and the thresholds for each status )
4. The content of the `.env` file should look like this
```
DB_USER=
DB_HOST=
DB_NAME=
DB_PASSWORD=
DB_PORT=5432
PORT=80
PORT_HTTPS = 8443
```
