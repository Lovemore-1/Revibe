import { httpRouter } from "convex/server";
import { auth } from "./auth";

const http = httpRouter();

// Mount Convex Auth HTTP routes (handles OAuth callbacks, etc.)
auth.addHttpRoutes(http);

export default http;
