require("dotenv").config({ path: "./.env" });
const mongoose = require("mongoose");

mongoose.set("strictQuery", false);

const url = process.env.MONGODB_URI;

console.log(`connecting to ${url}`);

mongoose
  .connect(url)
  .then((result) => {
    console.log(`connected to MongoDB`);
  })
  .catch((err) => {
    console.log("error connecting to MongoDB", err.message);
  });

const personSchema = new mongoose.Schema({
  name: {
    type: String,
    minLength: 3,
  },
  number: {
    type: String,
    minLength: 8,
    validate: {
      validator: (value) => /^\d{2,3}-\d+$/.test(value),
    },
  },
});

personSchema.set("toJSON", {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString();
    delete returnedObject._id;
    delete returnedObject.__v;
  },
});

module.exports = mongoose.model("person", personSchema);
