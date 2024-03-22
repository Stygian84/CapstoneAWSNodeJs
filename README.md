# CapstoneAWSNodeJs  
`app.js` is to handle all necessary GET and POST requests for the [app](https://agroreach.netlify.app)

# Framework
1. Express.JS

# How to Host
1. Find a service that can host Node.JS ( like [AWS EC2](https://aws.amazon.com/pm/ec2/) and [Render](https://render.com) )
2. Follow their instructions but most of the time, only need to put `node app.js` as the start command.
3. Insert all the necessary environment variables. ( `DB_HOST`,`DB_NAME`,`DB_PASSWORD`,`DB_PORT`,`DB_USER`,`PORT` )

# Notes
The `pushInitData` is to initialise 7 Harvest Days for all the Rows for each level in the Firebase.
