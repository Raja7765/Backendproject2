require('dotenv').config();
const express = require("express");
const bodyParser = require('body-parser');
const cors = require('cors');
const multer = require("multer");
const { getAllUsers, createUser, updateUser, deleteUser,signIn, signOut } = require("./controllers/user-controler.js");
const authMiddleware = require("./middleware/authMiddleware.js");
const { uploadimageController, fetchimagesController, deleteImageController } = require("./controllers/image-controller.js");
const roleMiddleware = require('./middleware/roleMiddleware.js');
const app = express();
const PORT = process.env.PORT || 3000;

//Middlewares
app.use(bodyParser.json())
app.use(cors())
app.use(express.json());
const upload = multer({ dest: "uploads/" });

// user 
app.get("/user", getAllUsers);
app.post("/user",createUser)
app.put("/user/:id",updateUser)
app.delete("/user/:id",deleteUser)
app.post("/signin",signIn)
app.post('/signout',authMiddleware,signOut)

// image
app.get("/image",fetchimagesController)
app.post("/image",authMiddleware,roleMiddleware("admin"),upload.single("image"),uploadimageController)
app.delete("/image/:id",authMiddleware,roleMiddleware("admin"),deleteImageController)

app.listen(PORT,() => {
    console.log(`Server is now listening to PORT ${PORT}`);
})