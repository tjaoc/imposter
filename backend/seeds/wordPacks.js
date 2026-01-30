const WordPack = require('../models/WordPack');

const TARGET_TOTAL_WORDS = 50000;
const MIN_WORD_LENGTH = 4;
const MAX_WORD_LENGTH = 22;

function loadBulkSpanishWords() {
  try {
    return require('an-array-of-spanish-words');
  } catch (e) {
    console.warn('⚠️  an-array-of-spanish-words no disponible. Instala con: npm install an-array-of-spanish-words');
    return [];
  }
}

function buildWordPacksWithBulk(curatedPacks) {
  const bulk = loadBulkSpanishWords();
  const packsWithWords = curatedPacks.filter((p) => p.words && p.words.length >= 0 && p.slug !== 'personalizado');
  const numPacks = packsWithWords.length;
  if (numPacks === 0 || bulk.length === 0) return curatedPacks;

  const curatedTotal = packsWithWords.reduce((acc, p) => acc + p.words.length, 0);
  const curatedSet = new Set();
  packsWithWords.forEach((p) => p.words.forEach((w) => curatedSet.add(String(w).toLowerCase().trim())));

  const extraNeeded = Math.max(0, TARGET_TOTAL_WORDS - curatedTotal);
  if (extraNeeded === 0) return curatedPacks;

  const filtered = bulk.filter((w) => {
    const s = String(w).trim();
    if (s.length < MIN_WORD_LENGTH || s.length > MAX_WORD_LENGTH) return false;
    if (curatedSet.has(s.toLowerCase())) return false;
    if (/\d/.test(s)) return false;
    return /^[a-záéíóúñü\s-]+$/i.test(s);
  });

  const uniqueFiltered = [...new Set(filtered)];
  for (let i = uniqueFiltered.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [uniqueFiltered[i], uniqueFiltered[j]] = [uniqueFiltered[j], uniqueFiltered[i]];
  }
  const pool = uniqueFiltered.slice(0, extraNeeded);
  const perPack = Math.floor(pool.length / numPacks);
  const remainder = pool.length % numPacks;

  let offset = 0;
  return curatedPacks.map((pack) => {
    if (pack.slug === 'personalizado' || !pack.words) return { ...pack };
    const idx = packsWithWords.findIndex((p) => p.slug === pack.slug);
    const size = perPack + (idx < remainder ? 1 : 0);
    const chunk = pool.slice(offset, offset + size);
    offset += size;
    const merged = [...pack.words];
    const seen = new Set(merged.map((w) => String(w).toLowerCase()));
    chunk.forEach((w) => {
      const wl = String(w).toLowerCase();
      if (!seen.has(wl)) {
        seen.add(wl);
        merged.push(w);
      }
    });
    return { ...pack, words: merged };
  });
}

const curatedWordPacks = [
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
      'Dune', 'Interstellar', 'Inception', 'Gladiator', 'Forrest Gump',
      'Pulp Fiction', 'Kill Bill', 'Django', 'Inglourious Basterds', 'Reservoir Dogs',
      'The Godfather', 'Scarface', 'Goodfellas', 'The Departed', 'Heat',
      'Black Mirror', 'Westworld', 'The Crown', 'Bridgerton', 'Squid Game',
      'Peaky Blinders', 'Ozark', 'Money Heist', 'Dark', 'The Witcher',
      'Aquaman', 'Wonder Woman', 'Superman', 'Flash', 'Green Lantern',
      'Captain America', 'Thor', 'Hulk', 'Black Widow', 'Doctor Strange',
      'Avengers', 'Guardians of the Galaxy', 'Black Panther', 'Ant-Man', 'Deadpool',
      'Shrek', 'Finding Nemo', 'The Lion King', 'Aladdin', 'Mulan',
      'Coco', 'Encanto', 'Moana', 'Zootopia', 'Inside Out',
      'Dwayne Johnson', 'Ryan Reynolds', 'Chris Hemsworth', 'Robert Downey Jr', 'Chris Evans',
      'Jennifer Lawrence', 'Emma Stone', 'Margot Robbie', 'Gal Gadot', 'Zendaya',
      'Christopher Nolan', 'Steven Spielberg', 'Quentin Tarantino', 'Martin Scorsese', 'Ridley Scott',
      'Oscar', 'Cannes', 'Emmy', 'Golden Globe', 'BAFTA',
      'Cine de terror', 'Comedia romántica', 'Ciencia ficción', 'Documental', 'Animación',
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
      'Atletismo', 'Maratón', 'Salto de longitud', 'Lanzamiento de jabalina', 'Decatlón',
      'Liverpool', 'Chelsea', 'Arsenal', 'Manchester City', 'Tottenham',
      'Atlético de Madrid', 'Sevilla', 'Villarreal', 'Betis', 'Valencia',
      'Luka Modric', 'Karim Benzema', 'Vinicius Jr', 'Haaland', 'Salah',
      'Kevin Durant', 'Giannis Antetokounmpo', 'Luka Doncic', 'Jayson Tatum', 'Nikola Jokic',
      'Carlos Alcaraz', 'Carlos Sainz', 'Fernando Alonso', 'Max Verstappen', 'Lewis Hamilton',
      'MMA', 'Kickboxing', 'Judo', 'Taekwondo', 'Lucha libre',
      'Voleibol', 'Balonmano', 'Rugby', 'Hockey sobre hielo', 'Béisbol',
      'Surf', 'Skateboarding', 'Escalada', 'Paracaidismo', 'Buceo',
      'Gimnasia', 'Patinaje artístico', 'Esquí', 'Snowboard', 'Motocross',
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
      'Berlín', 'Ámsterdam', 'Lisboa', 'Praga', 'Viena',
      'Sydney', 'Melbourne', 'Toronto', 'Vancouver', 'Montreal',
      'San Francisco', 'Los Ángeles', 'Miami', 'Chicago', 'Las Vegas',
      'Santorini', 'Mykonos', 'Creta', 'Capri', 'Amalfi',
      'Islandia', 'Noruega', 'Suecia', 'Finlandia', 'Dinamarca',
      'Portugal', 'Alemania', 'Reino Unido', 'Irlanda', 'Suiza',
      'Egipto', 'Marruecos', 'Sudáfrica', 'Kenia', 'Tanzania',
      'India', 'Vietnam', 'Camboya', 'Sri Lanka', 'Nepal',
      'Alpes', 'Himalaya', 'Andes', 'Rocky Mountains', 'Grand Canyon',
      'Sagrada Familia', 'Notre Dame', 'Acrópolis', 'Alhambra', 'Neuschwanstein',
      'Caribe', 'Polinesia', 'Seychelles', 'Mauricio', 'Fiyi',
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
      'Tapas', 'Pinchos', 'Tortilla de patatas', 'Salmorejo', 'Fabada',
      'Cocido', 'Callos', 'Pulpo a la gallega', 'Bacalao', 'Gambas al ajillo',
      'Tortilla', 'Quesadilla', 'Guacamole', 'Nachos', 'Tamales',
      'Curry', 'Pad Thai', 'Pho', 'Dim sum', 'Tempura',
      'Falafel', 'Hummus', 'Shawarma', 'Kebab', 'Baklava',
      'Fish and chips', 'Sunday roast', 'Full English', 'Haggis', 'Crumpets',
      'Bratwurst', 'Pretzel', 'Schnitzel', 'Sauerkraut', 'Strudel',
      'Gelato', 'Cannoli', 'Panna cotta', 'Bruschetta', 'Caprese',
      'Gin Tonic', 'Aperol Spritz', 'Sangría', 'Tinto de verano', 'Kalimotxo',
      'Whisky', 'Ron', 'Vodka', 'Ginebra', 'Tequila',
      'Agua con gas', 'Zumo', 'Smoothie', 'Batido', 'Infusión',
      'Brownie', 'Cheesecake', 'Flan', 'Arroz con leche', 'Torrijas',
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
      'Oso polar', 'Oso panda', 'Koala', 'Canguro', 'Wombat',
      'Caballo', 'Vaca', 'Cerdo', 'Oveja', 'Gallina',
      'Mariposa', 'Abeja', 'Hormiga', 'Araña', 'Escarabajo',
      'Lobo', 'Zorro', 'Conejo', 'Ardilla', 'Mapache',
      'Hámster', 'Cobaya', 'Ratón', 'Hurón', 'Erizo',
      'Orca', 'Foca', 'Morsa', 'Manatí', 'Nutria',
      'Pez payaso', 'Caballito de mar', 'Medusa', 'Estrella de mar', 'Erizo de mar',
      'Cangrejo', 'Langosta', 'Calamar', 'Almeja', 'Ostra',
      'Pavo real', 'Tucán', 'Guacamayo', 'Cuervo', 'Gaviota',
      'Murciélago', 'Topo', 'Tejón', 'Comadreja', 'Nutria',
      'Jaguar', 'Leopardo', 'Guepardo', 'Puma', 'Lince',
      'Mono', 'Chimpancé', 'Orangután', 'Mandril', 'Lemur',
      'Hiena', 'Zorro ártico', 'Reno', 'Alce', 'Bisonte',
      'Cabra', 'Burro', 'Llama', 'Alpaca', 'Yak',
      'Grillo', 'Saltamontes', 'Mantis', 'Libélula', 'Mariquita',
      'Caracol', 'Babosa', 'Lombriz', 'Sanguijuela', 'Medusa',
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
      'Android', 'iOS', 'Windows', 'macOS', 'Linux',
      'LinkedIn', 'Pinterest', 'Snapchat', 'Twitch', 'Reddit',
      'GitHub', 'GitLab', 'Slack', 'Notion', 'Trello',
      'Ethereum', 'Criptomoneda', 'NFT', 'Blockchain', 'Metaverso',
      'Alexa', 'Siri', 'Google Assistant', 'Cortana', 'Bixby',
      'Chromecast', 'Fire TV', 'Apple TV', 'Roku', 'Smart TV',
      'GoPro', 'Dron DJI', 'Oculus', 'Meta Quest', 'PSVR',
      'Canon', 'Nikon', 'Sony', 'GoPro', 'Insta360',
      '5G', 'Fibra óptica', 'Cloud', 'VPN', 'Firewall',
      'Código QR', 'NFC', 'Cargador inalámbrico', 'Power bank', 'Hub USB',
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
      'Freddie Mercury', 'David Bowie', 'Prince', 'Whitney Houston', 'Amy Winehouse',
      'AC/DC', 'Led Zeppelin', 'Pink Floyd', 'Nirvana', 'Metallica',
      'U2', 'Radiohead', 'Oasis', 'Blur', 'Arctic Monkeys',
      'Saxofón', 'Trompeta', 'Trombón', 'Flauta', 'Clarinete',
      'Ópera', 'Clásica', 'Sinfónica', 'Flamenco', 'Folk',
      'Billboard', 'Grammy', 'MTV', 'Eurovisión', 'San Remo',
      'Vinilo', 'CD', 'Casete', 'Streaming', 'Playlist',
      'Rauw Alejandro', 'Karol G', 'Anuel', 'Ozuna', 'Maluma',
      'Harry Styles', 'Billie Eilish', 'Dua Lipa', 'The Weeknd', 'Bruno Mars',
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
      'Agricultor', 'Ganadero', 'Pescador', 'Minero', 'Forestal',
      'Juez', 'Fiscal', 'Notario', 'Secretario', 'Administrativo',
      'Comercial', 'Marketing', 'Recursos Humanos', 'Compras', 'Logística',
      'Investigador', 'Científico', 'Biólogo', 'Químico', 'Físico',
      'Traductor', 'Intérprete', 'Guía turístico', 'Recepcionista', 'Conserje',
      'Entrenador', 'Árbitro', 'Deportista', 'Masajista', 'Nutricionista',
      'Peluquero', 'Esteticista', 'Barbero', 'Manicura', 'Maquillador',
      'Soldado', 'Militar', 'Guardia civil', 'Seguridad', 'Vigilante',
      'Astronauta', 'Paleontólogo', 'Arqueólogo', 'Historiador', 'Geólogo',
      'Compositor', 'Productor', 'DJ', 'Crítico', 'Editor',
    ],
  },
  {
    name: 'Naturaleza y Clima',
    slug: 'naturaleza-clima',
    description: 'Elementos naturales, fenómenos y clima',
    tags: ['naturaleza', 'clima', 'medio ambiente'],
    isAdult: false,
    locale: 'es-ES',
    words: [
      'Sol', 'Luna', 'Estrella', 'Nube', 'Lluvia',
      'Nieve', 'Viento', 'Tormenta', 'Rayo', 'Trueno',
      'Aurora boreal', 'Arcoíris', 'Niebla', 'Granizo', 'Ventisca',
      'Bosque', 'Río', 'Lago', 'Océano', 'Cascada',
      'Volcán', 'Terremoto', 'Tsunami', 'Huracán', 'Tornado',
      'Playa', 'Acantilado', 'Isla', 'Península', 'Bahía',
      'Desierto', 'Oasis', 'Dunas', 'Cactus', 'Palmera',
      'Montaña', 'Valle', 'Colina', 'Cañón', 'Cueva',
      'Selva', 'Jungla', 'Sabana', 'Tundra', 'Pradera',
      'Árbol', 'Flor', 'Hierba', 'Musgo', 'Helecho',
      'Rosa', 'Girasol', 'Tulipán', 'Margarita', 'Orquídea',
      'Roble', 'Pino', 'Olivo', 'Ciprés', 'Sauce',
      'Primavera', 'Verano', 'Otoño', 'Invierno', 'Estación',
      'Amanecer', 'Atardecer', 'Eclipse', 'Marea', 'Ola',
      'Contaminación', 'Reciclaje', 'Energía solar', 'Eólico', 'Sostenible',
    ],
  },
  {
    name: 'Ciencia',
    slug: 'ciencia',
    description: 'Ciencia, espacio y descubrimientos',
    tags: ['ciencia', 'espacio', 'investigación'],
    isAdult: false,
    locale: 'es-ES',
    words: [
      'Átomo', 'Molécula', 'ADN', 'Gen', 'Célula',
      'Gravedad', 'Relatividad', 'Agujero negro', 'Galaxia', 'Planeta',
      'Tierra', 'Marte', 'Júpiter', 'Saturno', 'Luna',
      'Estación Espacial', 'Cohete', 'Satélite', 'Telescopio', 'Microscopio',
      'Einstein', 'Newton', 'Hawking', 'Darwin', 'Marie Curie',
      'Física', 'Química', 'Biología', 'Matemáticas', 'Astronomía',
      'Ecuación', 'Teoría', 'Experimento', 'Hipótesis', 'Laboratorio',
      'Vacuna', 'Antibiótico', 'Virus', 'Bacteria', 'Inmunidad',
      'Energía', 'Electricidad', 'Magnetismo', 'Luz', 'Sonido',
      'Evolución', 'Extinción', 'Fósil', 'Dinosaurio', 'Ecosistema',
      'Clonación', 'Edición genética', 'CRISPR', 'Robótica', 'Nanotecnología',
      'Big Bang', 'Universo', 'Vía Láctea', 'Nebulosa', 'Supernova',
      'Océano', 'Fondo marino', 'Coral', 'Placton', 'Biodiversidad',
      'Cambio climático', 'Efecto invernadero', 'Renovable', 'Nuclear', 'Fusión',
    ],
  },
  {
    name: 'Historia',
    slug: 'historia',
    description: 'Épocas, personajes y eventos históricos',
    tags: ['historia', 'civilización', 'cultura'],
    isAdult: false,
    locale: 'es-ES',
    words: [
      'Antiguo Egipto', 'Imperio Romano', 'Grecia clásica', 'Edad Media', 'Renacimiento',
      'Revolución Francesa', 'Revolución Industrial', 'Guerras Mundiales', 'Guerra Fría', 'Caída del Muro',
      'Cleopatra', 'Julio César', 'Alejandro Magno', 'Napoleón', 'Genghis Khan',
      'Cristóbal Colón', 'Descubrimiento de América', 'Conquistadores', 'Inca', 'Azteca',
      'Reyes Católicos', 'Felipe II', 'Carlos V', 'Isabel la Católica', 'Fernando de Aragón',
      'Pirámides', 'Coliseo', 'Partenón', 'Acrópolis', 'Stonehenge',
      'Vikingos', 'Caballeros', 'Castillos', 'Catedrales', 'Cruzadas',
      'Imperio Bizantino', 'Imperio Otomano', 'Dinastía Ming', 'Samuráis', 'Shogun',
      'Revolución Rusa', 'Gandhi', 'Martin Luther King', 'Nelson Mandela', 'Churchill',
      'Paleolítico', 'Neolítico', 'Edad de Bronce', 'Edad de Hierro', 'Antigüedad',
      'Piratas', 'Corsarios', 'Bucaneros', 'Armada Invencible', 'Titanic',
      'Reforma', 'Contrarreforma', 'Ilustración', 'Revolución', 'Independencia',
      'Arqueología', 'Manuscritos', 'Pergaminos', 'Jeroglíficos', 'Papiros',
    ],
  },
  {
    name: 'Arte y Cultura',
    slug: 'arte-cultura',
    description: 'Pintura, escultura, literatura y arte',
    tags: ['arte', 'cultura', 'literatura'],
    isAdult: false,
    locale: 'es-ES',
    words: [
      'Mona Lisa', 'Guernica', 'Noche estrellada', 'Grito', 'Creación de Adán',
      'Picasso', 'Dalí', 'Velázquez', 'Goya', 'Miguel Ángel',
      'Van Gogh', 'Monet', 'Rembrandt', 'Da Vinci', 'Rafael',
      'Museo del Prado', 'Louvre', 'MOMA', 'Tate', 'Reina Sofía',
      'Escultura', 'Pintura', 'Grabado', 'Acuarela', 'Óleo',
      'Cervantes', 'Don Quijote', 'García Márquez', 'Borges', 'Pablo Neruda',
      'Shakespeare', 'Homero', 'Dante', 'Orwell', 'Kafka',
      'Teatro', 'Ópera', 'Ballet', 'Danza', 'Performance',
      'Fotografía', 'Cine', 'Documental', 'Cortometraje', 'Animación',
      'Arquitectura gótica', 'Barroco', 'Modernismo', 'Minimalismo', 'Surrealismo',
      'Graffiti', 'Street art', 'Mural', 'Instalación', 'Arte digital',
      'Poesía', 'Novela', 'Ensayo', 'Cuento', 'Cómic',
      'Guggenheim', 'Sagrada Familia', 'Torre de Pisa', 'Cristo Redentor', 'Estatua de la Libertad',
    ],
  },
  {
    name: 'Moda',
    slug: 'moda',
    description: 'Ropa, complementos y tendencias',
    tags: ['moda', 'ropa', 'estilo'],
    isAdult: false,
    locale: 'es-ES',
    words: [
      'Vaqueros', 'Camiseta', 'Vestido', 'Chaqueta', 'Abrigo',
      'Zapatillas', 'Botas', 'Sandalias', 'Zapatos de tacón', 'Mocasines',
      'Gorra', 'Sombrero', 'Bufanda', 'Guantes', 'Cinturón',
      'Bolso', 'Mochila', 'Cartera', 'Reloj', 'Gafas de sol',
      'Chanel', 'Gucci', 'Louis Vuitton', 'Prada', 'Hermès',
      'Nike', 'Adidas', 'Zara', 'H&M', 'Uniqlo',
      'Alta costura', 'Prêt-à-porter', 'Streetwear', 'Vintage', 'Segunda mano',
      'Pasarela', 'Fashion Week', 'Editorial', 'Influencer', 'Trend',
      'Sastrería', 'Denim', 'Cuero', 'Seda', 'Lana',
      'Minimalista', 'Bohemio', 'Clásico', 'Sporty', 'Glamour',
      'Bikini', 'Bañador', 'Sudadera', 'Leggings', 'Blazer',
      'Pendientes', 'Collar', 'Pulsera', 'Anillo', 'Broche',
      'Maquillaje', 'Skincare', 'Perfume', 'Uñas', 'Peinado',
    ],
  },
  {
    name: 'Videojuegos',
    slug: 'videojuegos',
    description: 'Juegos, consolas y personajes',
    tags: ['videojuegos', 'gaming', 'consolas'],
    isAdult: false,
    locale: 'es-ES',
    words: [
      'Mario', 'Zelda', 'Pokémon', 'Minecraft', 'Fortnite',
      'FIFA', 'Call of Duty', 'GTA', 'The Last of Us', 'Elden Ring',
      'PlayStation', 'Xbox', 'Nintendo Switch', 'PC Gaming', 'Steam',
      'Super Smash Bros', 'Mario Kart', 'Animal Crossing', 'Splatoon', 'Metroid',
      'League of Legends', 'Valorant', 'Overwatch', 'Dota', 'Counter-Strike',
      'World of Warcraft', 'Final Fantasy', 'Dark Souls', 'Bloodborne', 'Sekiro',
      'Assassin\'s Creed', 'God of War', 'Uncharted', 'Horizon', 'Spider-Man',
      'Pikachu', 'Link', 'Donkey Kong', 'Kirby', 'Samus',
      'Streamer', 'Twitch', 'eSports', 'Torneo', 'Ranked',
      'RPG', 'FPS', 'MMO', 'Battle Royale', 'Sandbox',
      'Retro', 'Arcade', 'Indie', 'AAA', 'DLC',
      'Resident Evil', 'Silent Hill', 'Dead Space', 'Outlast', 'Five Nights',
      'Halo', 'Gears of War', 'Forza', 'Sea of Thieves', 'Minecraft',
    ],
  },
  {
    name: 'Hogar',
    slug: 'hogar',
    description: 'Muebles, objetos y vida en casa',
    tags: ['hogar', 'decoración', 'muebles'],
    isAdult: false,
    locale: 'es-ES',
    words: [
      'Sofá', 'Cama', 'Mesa', 'Silla', 'Armario',
      'Escritorio', 'Estantería', 'Lámpara', 'Espejo', 'Cuadro',
      'Cocina', 'Nevera', 'Horno', 'Lavavajillas', 'Microondas',
      'Baño', 'Ducha', 'Lavabo', 'Inodoro', 'Bañera',
      'Jardín', 'Terraza', 'Balcón', 'Garaje', 'Sótano',
      'Almohada', 'Manta', 'Sábanas', 'Edredón', 'Colchón',
      'Cortinas', 'Persianas', 'Alfombra', 'Felpudo', 'Cojín',
      'Planta', 'Maceta', 'Florero', 'Velas', 'Ambientador',
      'Herramientas', 'Taladro', 'Martillo', 'Destornillador', 'Llave inglesa',
      'Aspiradora', 'Fregona', 'Escoba', 'Cubo', 'Bayeta',
      'Lavadora', 'Secadora', 'Plancha', 'Secador', 'Ventilador',
      'Televisión', 'Mando', 'Altavoz', 'Router', 'Enchufe',
      'Libro', 'Revista', 'Periódico', 'Cuaderno', 'Lápiz',
    ],
  },
  {
    name: 'Transporte',
    slug: 'transporte',
    description: 'Vehículos y medios de transporte',
    tags: ['transporte', 'vehículos', 'viajes'],
    isAdult: false,
    locale: 'es-ES',
    words: [
      'Coche', 'Moto', 'Bicicleta', 'Autobús', 'Metro',
      'Tren', 'Avión', 'Barco', 'Ferry', 'Helicóptero',
      'Taxi', 'Uber', 'Cabify', 'Carsharing', 'Scooter',
      'Camión', 'Furgoneta', 'Ambulancia', 'Policía', 'Bomberos',
      'Fórmula 1', 'NASCAR', 'Rally', 'Kart', 'Buggy',
      'Yate', 'Velero', 'Kayak', 'Canoa', 'Submarino',
      'Aeropuerto', 'Estación', 'Puerto', 'Parking', 'Gasolinera',
      'Pasaporte', 'Billete', 'Equipaje', 'Maleta', 'Mochila',
      'Semáforo', 'Rotonda', 'Autopista', 'Carretera', 'Peaje',
      'Conductor', 'Copiloto', 'Pasajero', 'Azafata', 'Piloto',
      'Rueda', 'Motor', 'Frenos', 'Aceite', 'Gasolina',
      'Tesla', 'BMW', 'Mercedes', 'Audi', 'Volkswagen',
    ],
  },
  {
    name: 'Salud y Cuerpo',
    slug: 'salud-cuerpo',
    description: 'Salud, deporte personal y bienestar',
    tags: ['salud', 'bienestar', 'cuerpo'],
    isAdult: false,
    locale: 'es-ES',
    words: [
      'Gimnasio', 'Correr', 'Yoga', 'Pilates', 'CrossFit',
      'Meditación', 'Mindfulness', 'Respiración', 'Relajación', 'Spa',
      'Dieta', 'Nutrición', 'Proteína', 'Vitaminas', 'Suplementos',
      'Dormir', 'Descanso', 'Insomnio', 'Sueño', 'Alarma',
      'Dolor de cabeza', 'Gripe', 'Resfriado', 'Fiebre', 'Tos',
      'Corazón', 'Pulmones', 'Hígado', 'Riñón', 'Cerebro',
      'Huesos', 'Músculos', 'Piel', 'Cabello', 'Uñas',
      'Dentista', 'Oftalmólogo', 'Cardiólogo', 'Dermatólogo', 'Traumatólogo',
      'Radiografía', 'Análisis de sangre', 'Ecografía', 'TAC', 'Resonancia',
      'Fisioterapia', 'Rehabilitación', 'Masaje', 'Osteopatía', 'Acupuntura',
      'Alergia', 'Asma', 'Diabetes', 'Presión arterial', 'Colesterol',
      'Higiene', 'Lavarse las manos', 'Cepillo de dientes', 'Hilo dental', 'Desodorante',
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
      'Cóctel', 'Vodka', 'Whisky', 'Cerveza', 'Vino',
      'Fiesta', 'Afterwork', 'Karaoke', 'Pub', 'Nightclub',
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

const wordPacks = buildWordPacksWithBulk(curatedWordPacks);

async function seedWordPacks() {
  try {
    console.log('🌱 Iniciando seed de packs de palabras...');
    const totalWords = wordPacks.reduce((acc, p) => acc + (p.words ? p.words.length : 0), 0);
    console.log(`📚 Palabras totales a cargar: ~${totalWords.toLocaleString()}`);
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
    const agg = await WordPack.aggregate([{ $project: { n: { $size: '$words' } } }, { $group: { _id: null, total: { $sum: '$n' } } }]);
    const totalWordsInDb = agg[0]?.total ?? 0;
    console.log(`📊 Total de packs en DB: ${total}, palabras: ${totalWordsInDb.toLocaleString()}`);
  } catch (error) {
    console.error('❌ Error en seed:', error);
    throw error;
  }
}

module.exports = { seedWordPacks, wordPacks };
