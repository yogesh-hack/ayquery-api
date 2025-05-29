import Stores from "../models/Store.js";
import mongoose from "mongoose";

export const AskStore = async (req, res) => {
  const postStoreData = req.body;
  const userId = req.userId;
  const postStore = new Stores({ ...postStoreData, userId });
  try {
    await postStore.save();
    res.status(200).json("Posted a Store successfully");
  } catch (error) {
    console.log(error);
    res.status(409).json("Couldn't post a new Store");
  }
};

export const getAllStores = async (req, res) => {
  try {
    const StoreList = await Stores.find().sort({ askedOn: -1 });
    res.status(200).json(StoreList);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

export const deleteStore = async (req, res) => {
  const { id: _id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(_id)) {
    return res.status(404).send("Store unavailable...");
  }

  try {
    await Stores.findByIdAndRemove(_id);
    res.status(200).json({ message: "successfully deleted..." });
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

export const voteStore = async (req, res) => {
  const { id: _id } = req.params;
  const { value } = req.body;
  const userId = req.userId;

  if (!mongoose.Types.ObjectId.isValid(_id)) {
    return res.status(404).send("Store unavailable...");
  }

  try {
    const Store = await Stores.findById(_id);
    const upIndex = Store.upVote.findIndex((id) => id === String(userId));

    if (value === "like") {
      if (upIndex === -1) {
        Store.upVote.push(userId);
      } else {
        Store.upVote = Store.upVote.filter((id) => id !== String(userId));
      }
    } 
    await Stores.findByIdAndUpdate(_id, Store);
    res.status(200).json({ message: "like successfully..." });
  } catch (error) {
    res.status(404).json({ message: "id not found" });
  }
};