require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const bodyParser = require('body-parser');
const connectDB = require('./config/db');
const userRoutes = require('./routes/userRoute');

const app = express();
app.use(express.json());
app.use(bodyParser.json());
app.use(cors());
connectDB();
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
  });
// app.get('/api',(req,res)=>{
//   res.send({message:'Node js AWS Deployement'})
// })
app.use('/api/users', userRoutes);

const PORT = process.env.PORT || 4000;
app.listen(PORT,() => console.log(`Server running on port ${PORT}`));
