const express = require("express");
const router = express.Router();
const { getAllReportsTotal } = require("./reports-controller");

router.get("/get-all-reports-total", getAllReportsTotal);

module.exports = router;
