const express = require("express");
const app = express();
const mainRoute = require("./Routes/index");
const cors = require("cors");
app.use(cors());
app.use(express.json());
app.use("/api/v1" , mainRoute );


app.listen(3000 , ()=>{
    console.log("live on https://localhost:3000");
});


