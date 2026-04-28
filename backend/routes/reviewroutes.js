const History = require("../models/History");

if (req.user) {
  await History.create({
    userId: req.user.id,
    code,
    result: parsed
  });
}