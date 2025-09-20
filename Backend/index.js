const express = require("express");
const app = express();
const mainRoute = require("./routes/index");
const cors = require("cors");
const { setupSSE } = require("./sse");
const { authMiddleware } = require("./Middlewares/auth");

app.use(cors());
app.use(express.json());
app.use("/api/v1" , mainRoute );

setupSSE(app, authMiddleware);


app.listen(3000 , ()=>{
    console.log("live on http://localhost:3000");
});

