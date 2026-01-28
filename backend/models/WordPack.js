const mongoose = require("mongoose");

const WordPackSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    description: { type: String, default: "" },
    tags: { type: [String], default: [] },
    isAdult: { type: Boolean, default: false },
    locale: { type: String, default: "es-ES" },
    words: {
      type: [String],
      default: [],
      validate: {
        validator: function(value) {
          // Permitir array vacío solo para packs personalizados
          if (this.slug === 'personalizado') {
            return Array.isArray(value);
          }
          return Array.isArray(value) && value.length > 0;
        },
        message: "WORD_LIST_REQUIRED",
      },
    },
    isPremium: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("WordPack", WordPackSchema);
