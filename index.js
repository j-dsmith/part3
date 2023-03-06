require("dotenv").config;
const express = require("express");
const morgan = require("morgan");
const app = express();
const Person = require("./models");

morgan.token("body", (req) => {
  return JSON.stringify(req.body);
});

const combineMorganTokens = () =>
  morgan((tokens, req, res) =>
    [
      tokens.method(req, res),
      tokens.url(req, res),
      tokens.status(req, res),
      tokens.res(req, res, "content-length"),
      "-",
      tokens["response-time"](req, res),
      "ms",
      req.method === "POST" ? tokens.body(req) : "",
    ].join(" ")
  );

app.use(express.static("build"), express.json(), combineMorganTokens());

app.get("/api/persons", (req, res, next) => {
  Person.find({})
    .then((persons) => {
      res.json(persons);
    })
    .catch((err) => next(err));
});

app.post("/api/persons", ({ body: { name, number } }, res, next) => {
  const person = new Person({ name, number });
  person
    .save()
    .then((newPerson) => {
      res.json(newPerson);
    })
    .catch((err) => next(err));
});

app.get("/api/persons/:id", (req, res, next) => {
  Person.findById(req.params.id)
    .then((person) => {
      if (person) {
        res.json(person);
      } else {
        res.send(404).end();
      }
    })
    .catch((err) => next(err));
});

app.put("/api/persons/:id", (req, res, next) => {
  const person = { number: req.body.number };
  Person.findByIdAndUpdate(req.params.id, person, {
    new: true,
    runValidators: true,
    context: "query",
  })
    .then((updatedPerson) => {
      res.json(updatedPerson);
    })
    .catch((err) => next(err));
});

app.delete("/api/persons/:id", (req, res, next) => {
  Person.findByIdAndDelete(req.params.id)
    .then((deletedPerson) => {
      console.log(deletedPerson);
      res.status(204).end();
    })
    .catch((err) => next(err));
});

app.get("/info", (req, res) => {
  Person.find({})
    .then((persons) => {
      res.send(`<p>Phonebook has info for ${persons.length} people.</p><p>${new Date()}</p>`);
    })
    .catch((err) => next(err));
});

const errorHandler = (error, req, res, next) => {
  if (error.name === "CastError") {
    res.status(400).send({ error: "malformed id" });
  } else if (error.name === "ValidationError") {
    if (error.errors.name) {
      res.status(400).json({ error: "Name must be at least 3 characters" });
    }

    if (error.errors.number) {
      res.status(400).json({
        error:
          error.errors.number.kind === "user defined"
            ? "Please enter a valid phone number"
            : "Number must be at least 8 characters",
      });
    }
  }
  next(error);
};

app.use(errorHandler);

const PORT = process.env.PORT;
app.listen(PORT, () => {
  console.log(`SERVER LISTENING ON PORT: ${PORT}`);
});
