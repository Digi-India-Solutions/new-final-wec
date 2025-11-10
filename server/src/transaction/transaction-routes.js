const express = require("express");
const router = express.Router();

const {
  createTransactionByAdmin,
  getTransactionByAdminWithPagination,
  updateTransactionByAdmin,
  deleteTransactionByAdmin,
  getAllTransactions,
  getWalletManagementByAdmin,
} = require("./transaction-controller");

// CRUD Routes
router.post("/create-transaction-by-admin", createTransactionByAdmin);
router.get("/get-transaction-by-admin-with-pagination", getTransactionByAdminWithPagination);

// router.get("/get-user-transaction-by-admin-with-pagination", getUserTransactionByAdminWithPagination);

router.get("/get-all-transactions", getAllTransactions);
router.post("/update-transaction-by-admin/:id", updateTransactionByAdmin);
router.get("/delete-transaction-by-admin/:id", deleteTransactionByAdmin);

router.get("/getWalletManagementByAdmin/:id", getWalletManagementByAdmin);
module.exports = router;
