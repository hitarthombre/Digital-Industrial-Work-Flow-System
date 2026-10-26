import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

async function run() {
  if (!process.env.MONGODB_URI) throw new Error("No MONGODB_URI");
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected to MongoDB Atlas");

  const collections = [
    "companies",
    "customers",
    "suppliers",
    "products",
    "purchaseorders",
    "salesorders",
    "salesinvoices",
    "quotations",
  ];

  for (const c of collections) {
    try {
      const col = mongoose.connection.collection(c);
      const count = await col.countDocuments({ currency: "USD" });
      if (count > 0) {
        const res = await col.updateMany({ currency: "USD" }, { $set: { currency: "INR" } });
        console.log(`Updated ${c}: ${res.modifiedCount} documents from USD to INR`);
      } else {
        console.log(`Collection ${c}: 0 documents with USD`);
      }
    } catch (err: any) {
      console.warn(`Collection ${c} error:`, err.message);
    }
  }

  // Also update nested order arrays in customers and suppliers
  const custRes = await mongoose.connection.collection("customers").updateMany(
    { "orders.currency": "USD" },
    { $set: { "orders.$[].currency": "INR" } }
  );
  console.log(`Updated nested customer orders: ${custRes.modifiedCount}`);

  const supRes = await mongoose.connection.collection("suppliers").updateMany(
    { "purchaseHistory.currency": "USD" },
    { $set: { "purchaseHistory.$[].currency": "INR" } }
  );
  console.log(`Updated nested supplier purchaseHistory: ${supRes.modifiedCount}`);

  await mongoose.disconnect();
  console.log("Database currency migration to INR completed successfully.");
}

run().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
