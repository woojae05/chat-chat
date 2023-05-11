const mongoose = require("mongoose");
const { MONGO_ID, MONGO_PASSWORD } = process.env;

const connect = async () => {
  if (process.env.NODE_ENV !== "production") {
    mongoose.set("debug", true);
  }
  try {
    await mongoose.connect(`mongodb://localhost:27017/admin`, {
      dbName: "gifchat",
      useNewUrlParser: true,
    });
    console.log("몽고디비 연결 성공");
  } catch (error) {
    console.log("몽고디비 연결 실패", error);
  }
};

mongoose.connection.on("error", (error) => {
  console.error(error);
});

mongoose.connection.on("disconnected", () => {
  console.log("disconnected");
  connect();
});

module.exports = connect;
