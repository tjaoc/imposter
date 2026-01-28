const mongoose = require("mongoose");

const connectDb = async () => {
  const uri =
    process.env.MONGODB_URI || "mongodb://localhost:27017/imposter-premium";

  try {
    await mongoose.connect(uri, {
      autoIndex: true,
    });
    // eslint-disable-next-line no-console
    console.log("✅ MongoDB conectado correctamente:", uri.replace(/\/\/.*@/, "//***@"));
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("❌ MongoDB connection error:", error);
    process.exit(1);
  }
};

module.exports = { connectDb };
