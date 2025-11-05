require("dotenv").config();
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const path = require("path");
const app = express();

// built-in middlewares
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(morgan("dev"));
app.use(express.urlencoded({ limit: "50mb" }));
app.use("/uploads", express.static(path.join(__dirname + "/uploads")));
app.use("/Public", express.static(path.join(__dirname + "/Public")));
// app.set(express.static("./Public"));

const superAdminRoutes = require("./src/super-admin/super-admin-routes");
const claimsRoutes = require("./src/claims/claims-routes");
const categoryRoutes = require("./src/category/category-routes");
const brandRoutes = require("./src/brand/brand-routes");
const typeRoutes = require("./src/type/type-routes");
const amcsRoutes = require("./src/amcs/amcs-routes");
const transactionRoutes = require("./src/transaction/transaction-routes");
const dashboardRoutes = require("./src/dashboard/dashboard-routes");
const roleRoutes = require("./src/adminRole/adminRole-routes");
const customerRoutes = require("./src/customer/customer-routes");
const companyRoutes = require("./src/companyDetails/companyDetails-routes");
const reportsRoutes = require("./src/reports/reports-routes");
// const usersRoutes = require("./src/users/users-routes");


app.use("/api/admin", superAdminRoutes);
app.use("/api/claims", claimsRoutes);
app.use("/api/category", categoryRoutes);
app.use("/api/brand", brandRoutes);
app.use("/api/type", typeRoutes)
app.use("/api/amcs", amcsRoutes);
app.use("/api/transaction", transactionRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/role", roleRoutes);
app.use("/api/customer", customerRoutes);
app.use("/api/company", companyRoutes);
app.use("/api/reports", reportsRoutes);
// app.use("/api/user", usersRoutes);

const connectDatabase = require("./db/database");

//connect db
connectDatabase();

// sendBillingToClient();
app.use("/", (req, res) => {
  return res.send("app is running")
})

//create server//
const server = app.listen(process.env.PORT || 8000, () => {
  console.log("Server is running on port", process.env.PORT || 8000);
});
