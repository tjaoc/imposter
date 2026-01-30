const mongoose = require("mongoose");

const WordPackSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, lowercase: true },
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

// Mismo slug puede existir por locale (es-ES, pt-PT, etc.)
// Si ya tenías DB con índice único en slug: en MongoDB ejecutar
// db.wordpacks.dropIndex('slug_1') antes de volver a ejecutar el seed.
WordPackSchema.index({ slug: 1, locale: 1 }, { unique: true });

module.exports = mongoose.model("WordPack", WordPackSchema);
