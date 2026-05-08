import express from "express";
import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  acceptInvite,
} from "../controllers/userController.js";

import { inviteUser } from "../controllers/inviteController.js";

const router = express.Router();

router.get("/", getUsers);
router.post("/", createUser);
router.patch("/:id", updateUser);
router.delete("/:id", deleteUser);

// INVITE FLOW
router.post("/accept_invite", acceptInvite);

export default router;