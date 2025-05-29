import express from "express";

import {
  AskStore,
  getAllStores,
  deleteStore,
  voteStore,
} from "../controllers/Store.js";
import auth from "../middleware/auth.js";

const router = express.Router();

router.post("/post", auth, AskStore);
router.get("/get", auth, getAllStores);
router.delete("/delete/:id", auth, deleteStore);
router.patch("/vote/:id", auth, voteStore);

export default router;
