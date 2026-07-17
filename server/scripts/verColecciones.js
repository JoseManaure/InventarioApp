require("dotenv").config({
    path: require("path").join(__dirname, "../.env")
});

const mongoose = require("mongoose");


async function revisar() {

    await mongoose.connect(process.env.MONGO_URI);

    console.log("✅ Mongo conectado");


    const collections =
        await mongoose.connection.db.listCollections().toArray();


    console.log(
        collections.map(c => c.name)
    );


    process.exit();

}


revisar();