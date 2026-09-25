import { httpRouter } from "convex/server";
import { auth } from "./auth";

const http = httpRouter();

// Serves /api/auth/* — required for Convex Auth sign-in flows.
auth.addHttpRoutes(http);

export default http;
