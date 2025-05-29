import mongoose from "mongoose";

const StoreSchema = mongoose.Schema({
  storeTitle: { type: String, required: "Product must have a title" },
  storeDescription: { type: String, required: "Product must have a Desciption" },
  storeCoverImage: { type: [String], required: "Product must have a Image" },
  storePdfFile: { type: String, required: "Product must have a PDF file" },
  storeType: { type: String, default: "Ebook",required: "Product must have a Type" },
  likes: { type: [String], default: [] },
  userPosted: { type: String, required: "Product must have an author" },
  userId: { type: String },
  storePrice: { type: Number, required : "Product must have price.." },
  storeDate: { type: Date, default: Date.now },
  reviews: [
    {
      commentBody: String,
      usercomment: String,
      userId: String,
      commentOn: { type: Date, default: Date.now },
    },
  ],
});

export default mongoose.model("store", StoreSchema);
