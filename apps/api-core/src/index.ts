import "dotenv/config";
// @ts-ignore
import app from "./app.js";

const PORT = process.env.PORT || 8080;

import { config } from "./config.js";

app.listen(PORT, () => {
    console.log(`🚀 API Core running on port ${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
});
