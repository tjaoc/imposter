const WordPack = require('../models/WordPack');

const wordPacks = [
  {
    name: 'Cine y Series',
    slug: 'cine-series',
    description: 'Películas, series, actores y personajes famosos',
    tags: ['entretenimiento', 'películas', 'series'],
    isAdult: false,
    locale: 'es-ES',
    words: [
      'Harry Potter', 'Star Wars', 'El Padrino', 'Titanic', 'Avatar',
      'Breaking Bad', 'Game of Thrones', 'Friends', 'Stranger Things', 'The Office',
      'Marvel', 'DC Comics', 'Disney', 'Pixar', 'Netflix',
      'Spider-Man', 'Batman', 'Iron Man', 'Joker', 'Thanos',
      'James Bond', 'Indiana Jones', 'Terminator', 'Matrix', 'Jurassic Park',
      'Leonardo DiCaprio', 'Brad Pitt', 'Tom Cruise', 'Will Smith', 'Scarlett Johansson',
      'La Casa de Papel', 'Narcos', 'Lost', 'The Walking Dead', 'Vikings',
      'El Señor de los Anillos', 'Hobbit', 'Toy Story', 'Frozen', 'Los Simpson',
    ],
  },
  {
    name: 'Deportes',
    slug: 'deportes',
    description: 'Deportes, equipos, jugadores y competiciones',
    tags: ['deportes', 'fútbol', 'basketball'],
    isAdult: false,
    locale: 'es-ES',
    words: [
      'Fútbol', 'Basketball', 'Tenis', 'Natación', 'Ciclismo',
      'Real Madrid', 'Barcelona', 'Manchester United', 'Juventus', 'Bayern Munich',
      'Lionel Messi', 'Cristiano Ronaldo', 'Neymar', 'Mbappé', 'Ronaldinho',
      'NBA', 'NFL', 'FIFA', 'Champions League', 'Mundial',
      'Michael Jordan', 'LeBron James', 'Kobe Bryant', 'Stephen Curry', 'Shaq',
      'Rafael Nadal', 'Roger Federer', 'Novak Djokovic', 'Serena Williams', 'Naomi Osaka',
      'Maradona', 'Pelé', 'Zinedine Zidane', 'David Beckham', 'Ronaldo Nazário',
      'Olimpiadas', 'Tour de Francia', 'Super Bowl', 'Wimbledon', 'Roland Garros',
      'Golf', 'Boxeo', 'UFC', 'Fórmula 1', 'MotoGP',
    ],
  },
  {
    name: 'Viajes y Lugares',
    slug: 'viajes-lugares',
    description: 'Ciudades, países, monumentos y destinos turísticos',
    tags: ['viajes', 'geografía', 'turismo'],
    isAdult: false,
    locale: 'es-ES',
    words: [
      'París', 'Londres', 'Nueva York', 'Tokio', 'Roma',
      'Torre Eiffel', 'Big Ben', 'Estatua de la Libertad', 'Coliseo', 'Taj Mahal',
      'España', 'Francia', 'Italia', 'Japón', 'Estados Unidos',
      'Playa', 'Montaña', 'Desierto', 'Selva', 'Nieve',
      'Barcelona', 'Madrid', 'Sevilla', 'Valencia', 'Bilbao',
      'México', 'Argentina', 'Brasil', 'Chile', 'Colombia',
      'Machu Picchu', 'Chichen Itzá', 'Cristo Redentor', 'Iguazú', 'Patagonia',
      'Dubái', 'Maldivas', 'Bali', 'Tailandia', 'Grecia',
      'Pirámides de Egipto', 'Gran Muralla China', 'Petra', 'Angkor Wat', 'Stonehenge',
    ],
  },
  {
    name: 'Comida y Bebida',
    slug: 'comida-bebida',
    description: 'Platos, bebidas, postres y gastronomía',
    tags: ['comida', 'gastronomía', 'bebidas'],
    isAdult: false,
    locale: 'es-ES',
    words: [
      'Pizza', 'Hamburguesa', 'Sushi', 'Tacos', 'Pasta',
      'Helado', 'Chocolate', 'Pastel', 'Galletas', 'Tarta',
      'Café', 'Té', 'Coca-Cola', 'Cerveza', 'Vino',
      'Paella', 'Tortilla española', 'Jamón ibérico', 'Gazpacho', 'Churros',
      'Ramen', 'Poke Bowl', 'Burrito', 'Enchiladas', 'Ceviche',
      'Croissant', 'Baguette', 'Macaron', 'Crepe', 'Fondue',
      'Risotto', 'Tiramisú', 'Lasaña', 'Carbonara', 'Bolognesa',
      'Empanadas', 'Asado', 'Choripán', 'Milanesa', 'Alfajores',
      'Espresso', 'Cappuccino', 'Latte', 'Mojito', 'Margarita',
    ],
  },
  {
    name: 'Animales',
    slug: 'animales',
    description: 'Todo tipo de animales del mundo',
    tags: ['animales', 'naturaleza', 'fauna'],
    isAdult: false,
    locale: 'es-ES',
    words: [
      'Perro', 'Gato', 'León', 'Tigre', 'Elefante',
      'Jirafa', 'Cebra', 'Hipopótamo', 'Rinoceronte', 'Gorila',
      'Delfín', 'Ballena', 'Tiburón', 'Pulpo', 'Pingüino',
      'Águila', 'Búho', 'Loro', 'Flamenco', 'Colibrí',
      'Serpiente', 'Cocodrilo', 'Tortuga', 'Lagarto', 'Camaleón',
      'Oso polar', 'Oso panda', 'Koala', 'Canguro', 'Koala',
      'Caballo', 'Vaca', 'Cerdo', 'Oveja', 'Gallina',
      'Mariposa', 'Abeja', 'Hormiga', 'Araña', 'Escarabajo',
      'Lobo', 'Zorro', 'Conejo', 'Ardilla', 'Mapache',
    ],
  },
  {
    name: 'Tecnología',
    slug: 'tecnologia',
    description: 'Marcas, productos y tecnología moderna',
    tags: ['tecnología', 'gadgets', 'marcas'],
    isAdult: false,
    locale: 'es-ES',
    words: [
      'iPhone', 'Samsung', 'Google', 'Apple', 'Microsoft',
      'PlayStation', 'Xbox', 'Nintendo', 'Switch', 'Steam',
      'Instagram', 'TikTok', 'YouTube', 'Twitter', 'Facebook',
      'WhatsApp', 'Telegram', 'Discord', 'Zoom', 'Spotify',
      'Netflix', 'Amazon', 'Tesla', 'SpaceX', 'NASA',
      'Inteligencia Artificial', 'ChatGPT', 'Robot', 'Drone', 'VR',
      'Laptop', 'Tablet', 'Smartwatch', 'AirPods', 'Kindle',
      'WiFi', 'Bluetooth', 'USB', 'HDMI', 'SSD',
      'Uber', 'Airbnb', 'PayPal', 'Stripe', 'Bitcoin',
    ],
  },
  {
    name: 'Música',
    slug: 'musica',
    description: 'Artistas, géneros y música',
    tags: ['música', 'artistas', 'géneros'],
    isAdult: false,
    locale: 'es-ES',
    words: [
      'Rock', 'Pop', 'Reggaeton', 'Hip Hop', 'Jazz',
      'The Beatles', 'Queen', 'Michael Jackson', 'Madonna', 'Elvis Presley',
      'Bad Bunny', 'Shakira', 'Rosalía', 'J Balvin', 'Daddy Yankee',
      'Taylor Swift', 'Beyoncé', 'Ariana Grande', 'Ed Sheeran', 'Drake',
      'Guitarra', 'Piano', 'Batería', 'Bajo', 'Violín',
      'Spotify', 'YouTube Music', 'Apple Music', 'SoundCloud', 'Deezer',
      'Reggae', 'Salsa', 'Bachata', 'Cumbia', 'Tango',
      'Coldplay', 'Imagine Dragons', 'Maroon 5', 'One Direction', 'BTS',
      'Karaoke', 'Concierto', 'Festival', 'DJ', 'Rap',
    ],
  },
  {
    name: 'Profesiones',
    slug: 'profesiones',
    description: 'Oficios, profesiones y trabajos',
    tags: ['profesiones', 'trabajos', 'oficios'],
    isAdult: false,
    locale: 'es-ES',
    words: [
      'Médico', 'Enfermera', 'Profesor', 'Ingeniero', 'Arquitecto',
      'Abogado', 'Policía', 'Bombero', 'Chef', 'Camarero',
      'Piloto', 'Azafata', 'Taxista', 'Conductor', 'Mecánico',
      'Electricista', 'Fontanero', 'Carpintero', 'Pintor', 'Albañil',
      'Programador', 'Diseñador', 'Fotógrafo', 'Periodista', 'Escritor',
      'Actor', 'Cantante', 'Músico', 'Bailarín', 'Director',
      'Veterinario', 'Dentista', 'Farmacéutico', 'Psicólogo', 'Fisioterapeuta',
      'Banquero', 'Contable', 'Economista', 'Empresario', 'Vendedor',
    ],
  },
  {
    name: 'Adultos',
    slug: 'adultos',
    description: 'Contenido para mayores de 18 años',
    tags: ['adultos', '+18', 'picante'],
    isAdult: true,
    locale: 'es-ES',
    words: [
      'Tinder', 'OnlyFans', 'Viagra', 'Kamasutra', 'Stripper',
      'Bachelor Party', 'Pole Dance', 'Jacuzzi', 'Masaje', 'Lencería',
      'Romance', 'Cita', 'Beso', 'Conquista', 'Seducción',
      'Bar', 'Discoteca', 'Resaca', 'Shot', 'Tequila',
      'Tatuaje', 'Piercing', 'Bikini', 'Sauna', 'Spa',
    ],
  },
  {
    name: 'Modo Personalizado',
    slug: 'personalizado',
    description: 'Palabras añadidas por los usuarios',
    tags: ['personalizado', 'custom'],
    isAdult: false,
    locale: 'es-ES',
    words: [],
    isPremium: true,
  },
];

async function seedWordPacks() {
  try {
    console.log('🌱 Iniciando seed de packs de palabras...');
    
    for (const packData of wordPacks) {
      const exists = await WordPack.findOne({ slug: packData.slug });
      
      if (exists) {
        console.log(`⏭️  Pack "${packData.name}" ya existe, actualizando...`);
        await WordPack.updateOne({ slug: packData.slug }, packData);
      } else {
        console.log(`➕ Creando pack "${packData.name}"...`);
        await WordPack.create(packData);
      }
    }
    
    console.log(`✅ Seed completado! ${wordPacks.length} packs creados/actualizados`);
    const total = await WordPack.countDocuments();
    console.log(`📊 Total de packs en DB: ${total}`);
  } catch (error) {
    console.error('❌ Error en seed:', error);
    throw error;
  }
}

module.exports = { seedWordPacks, wordPacks };
