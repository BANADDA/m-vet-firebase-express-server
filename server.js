const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const routes = require('./routes'); // Ensure routes.js is correctly set up

const app = express();
app.use(bodyParser.json());
app.use(cors());

app.use('/api', routes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
